//-------------------MAPA---LEAFLET.JS----------------------------//

var map = L.map('map').setView([0.0, 0.0], 2.5); // Vista inicial del mapa centrada en coordenadas 0,0 con un zoom de 2.5
// Declarar la variable global para que todos la vean
let ubicacionActual = null;
L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
  maxZoom: 20,
  attribution: '&copy; Stadia Maps'
}).addTo(map);

var marker;
let routingControl = null;

// === FUNCIÓN PARA OBTENER UBICACIÓN CON PROMISE ===
function obtenerUbicacionActual() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocalización no soportada"));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const ubicacion = { 
          lat: pos.coords.latitude, 
          lon: pos.coords.longitude 
        };
        resolve(ubicacion);
      },
      (err) => {
        console.error("Error obteniendo ubicación:", err);
        // Fallback: usar centro del mapa
        const center = map.getCenter();
        resolve({ lat: center.lat, lon: center.lng });
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 30000 
      }
    );
  });
}

function crearLocationIcon() {
  return L.divIcon({
    className: 'location-center',
    iconSize: [10, 10],
    iconAnchor: [5, 5],
    html: '<div class="location-dot"></div>'
  });
}

function crearMarker2Icon() {
  return L.divIcon({
    className: 'custom-marker2',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    html: '<div class="marker2-dot"></div>'
  });
}

var destinoMarker;

function crearDestinoIcon() {
  return L.divIcon({
    className: 'destino-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    html: '<div class="destino-dot"></div>'
  });
}


function onLocationFound(e) {
  if (marker) {
    map.removeLayer(marker);
  }

  var radius = Math.max(e.accuracy / 2, 5);
  console.log('Precisión de geolocalización (metros):', e.accuracy);

  marker = L.layerGroup([
    L.circle(e.latlng, {
      radius: radius,
      color: '#723edbff',
      fillColor: '#723edbff',
      fillOpacity: 0.5,
      weight: 1,
      className: 'location-circle'
    }),
    L.marker(e.latlng, { icon: crearLocationIcon() })
  ]).addTo(map);

  map.setView(e.latlng, 16);
}

function onLocationError(e) {
  alert("No se pudo obtener tu ubicación: " + e.message);
  console.error('Error de geolocalización:', e);
}

function iniciarSeguimientoUbicacion() {
  if (!navigator.geolocation) {
    alert("Geolocalización no soportada en este dispositivo");
    return;
  }

  navigator.geolocation.watchPosition(
    (pos) => {
      const coords = {
        latlng: L.latLng(pos.coords.latitude, pos.coords.longitude),
        accuracy: pos.coords.accuracy
      };
      onLocationFound(coords);
      console.log('Ubicación actualizada:', pos.coords);
    },
    (err) => {
      console.warn("Timeout geolocalización, usando centro del mapa:", err);
      const center = map.getCenter();
      ubicacionActual = { lat: center.lat, lon: center.lng };
    },
    { enableHighAccuracy: true, timeout: 30000, maximumAge: 60000 }

  );
}

var marker2;

map.doubleClickZoom.disable();
map.on('dblclick', function (e) {
  if (marker2) {
    map.removeLayer(marker2);
  }
  marker2 = L.marker(e.latlng, { icon: crearMarker2Icon() })
    .addTo(map)
    .bindPopup("Marcador agregado")
    .openPopup();
  document.getElementById('btnQuitar').style.display = 'block';
  console.log('Marcador secundario añadido en:', e.latlng);
});

function quitarMarker2() {
  if (marker2) {
    map.removeLayer(marker2);
    marker2 = null;
    document.getElementById('btnQuitar').style.display = 'none';
    console.log('Marcador secundario eliminado');
  }
}

function crearPulseIcon() {
  return L.divIcon({
    className: 'pulse-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    html: '<div class="pulse-inner"></div>'
  });
}

const cargarReportes = async (endpoint, map) => {
  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.status}`);
    }
    const data = await response.json();
    console.log('Reportes obtenidos:', data); // Depuración

    if (!Array.isArray(data)) {
      throw new Error('Los datos no son un array');
    }

    data.forEach(reporte => {
      if (!reporte.lat || !reporte.lon) {
        console.warn('Reporte con coordenadas inválidas:', reporte);
        return;
      }
      L.marker([reporte.lat, reporte.lon], { icon: crearPulseIcon() })
        .addTo(map)
        .bindPopup(`<b>${reporte.tipo_crimen.toUpperCase()}</b><br>${reporte.descripcion}`);
    });
  } catch (error) {
    console.error("Error cargando reportes:", error);
    alert('No se pudieron cargar los reportes: ' + error.message);
  }
};

// Llamar a la función para cargar reportes
cargarReportes('/reportes/getall', map);

// Configurar eventos de ubicación
map.on('locationfound', onLocationFound);
map.on('locationerror', onLocationError);


map.locate({ setView: true, maxZoom: 16 });

///-------------------BOTON DE EMERGENCIA----------------------------//
document.getElementById("btn-emergencia").addEventListener("click", async () => {
  const idUsuario = Number(localStorage.getItem("usuarioId"));
  if (!idUsuario) return alert("Iniciá sesión primero.");

  try {
    // Traer contactos de emergencia desde el backend
    const res = await fetch(`/contactos/${idUsuario}`);
    if (!res.ok) throw new Error("No se pudieron obtener los contactos");
    const contactos = await res.json();

    if (!Array.isArray(contactos) || !contactos.length) {
      return alert("No hay contactos de emergencia guardados");
    }

    // Obtener ubicación actual
    const ubicacion = await new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error("Geolocalización no soportada"));
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        err => reject(new Error("Error al obtener ubicación: " + err.message)),
        { enableHighAccuracy: true, timeout: 100000, maximumAge: 0 }
      );
    });

    // Enviar mensaje a cada contacto via WhatsApp
    contactos.forEach(c => {
      let numero = String(c.contacto || "").replace(/[^\d]/g, "");

      // Normalizar formato argentino (ajustar según tu DB)
      if (numero.startsWith("0")) numero = numero.slice(1);
      if (!numero.startsWith("54")) numero = "54" + numero;
      numero = numero.replace(/^54(11|2\d|3\d)15/, "54$1"); // quita el 15 si existe

      const mensaje = `¡Ayuda! Estoy en una emergencia. Mi ubicación: https://www.google.com/maps?q=${ubicacion.lat},${ubicacion.lon}`;
      const link = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
      window.open(link, "_blank");
    });

  } catch (err) {
    alert(err.message || err);
    console.error(err);
  }
});


// === GEOLOCALIZACIÓN Y BOTÓN DE BÚSQUEDA ===
const input = document.getElementById("searchInput");
const btnUbicacion = document.getElementById("searchBtn");
const suggestionsBox = document.getElementById("suggestions");

input.parentNode.appendChild(suggestionsBox); // Adjuntarlo al input

// === MODIFICAR EL EVENTO DEL BOTÓN DE BÚSQUEDA ===
btnUbicacion.addEventListener("click", async () => {
  try {
    // Primero obtener la ubicación actual y ESPERAR
    ubicacionActual = await obtenerUbicacionActual();
    console.log("Ubicación actual obtenida:", ubicacionActual);
    
    // Ahora sí ejecutar la búsqueda si hay texto
    const query = input.value.trim();
    if (query) {
      await buscarDireccionFinal(query);
    }
  } catch (error) {
    console.error("Error en búsqueda:", error);
    alert("No se pudo obtener tu ubicación para calcular la ruta");
  }
});

// Función para buscar y dibujar la ruta al presionar el botón de búsqueda
async function buscarDireccionFinal(query) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=ar`,
      { headers: { "User-Agent": "OnTrack-App" } }
    );
    const data = await res.json();
    const place = data[0];
    
    if (place) {
      await irADestino(place);
    } else {
      alert("No se encontró la ubicación buscada");
    }
  } catch (error) {
    console.error("Error en búsqueda:", error);
    alert("Error al buscar la ubicación");
  }
}

// === SUGERENCIAS DE DIRECCIONES (LÓGICA AVANZADA DE buscadorRuta.js) ===
input.addEventListener("input", async function () {
  const query = this.value.trim();
  suggestionsBox.innerHTML = "";

  if (query.length < 3) {
    suggestionsBox.style.display = "none";
    return;
  }

  try {
    // Asegurarse de tener ubicación actual antes de buscar
    if (!ubicacionActual) {
      ubicacionActual = await obtenerUbicacionActual();
    }

    let params = `format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=10&countrycodes=ar`;

    if (ubicacionActual) {
      const lat = ubicacionActual.lat;
      const lon = ubicacionActual.lon;
      const viewbox = `${lon - 0.1},${lat - 0.1},${lon + 0.1},${lat + 0.1}`; // Un poco más amplio
      params += `&viewbox=${viewbox}&bounded=1`;
    } else {
      // Priorizar Argentina si no tenemos ubicación (fallback)
      params += `&viewbox=-75,-55,-55,-20&bounded=0`;
    }

    const url = `https://nominatim.openstreetmap.org/search?${params}`;


    const res = await fetch(url, { headers: { "User-Agent": "OnTrack-App" } });

    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

    const data = await res.json();

    data.forEach((item) => {
      const li = document.createElement("li");
      li.className = "suggestion";
      li.textContent = item.display_name;
      
      // Prevenir que el blur oculte las sugerencias antes del click
      li.addEventListener("mousedown", (e) => {
        e.preventDefault(); // Evita que el input pierda el foco
      });
      
      li.addEventListener("click", async () => {
        input.value = item.display_name;
        suggestionsBox.innerHTML = "";
        suggestionsBox.style.display = "none";

        // Asegurar que tenemos ubicación actual
        if (!ubicacionActual) {
          ubicacionActual = await obtenerUbicacionActual();
        }

        const origen = `${ubicacionActual.lat},${ubicacionActual.lon}`;
        await obtenerRutaSegura(origen, `${item.lat},${item.lon}`, 'foot');
      });
      suggestionsBox.appendChild(li);
    });

    suggestionsBox.style.display = "block";
  } catch (err) {
    console.error("Error al buscar sugerencias:", err);
  }
});

input.addEventListener("blur", () => {
  // Aumentar el tiempo para permitir que el click se registre
  setTimeout(() => { suggestionsBox.style.display = "none"; }, 300);
});


// ------------------- FUNCION PARA MOSTRAR LA RUTA ------------------- //


async function irADestino(place) {
  if (!place || !place.lat || !place.lon) return;
  
  const destino = L.latLng(place.lat, place.lon);

  // Marcar destino
  if (destinoMarker) map.removeLayer(destinoMarker);
  destinoMarker = L.marker(destino, { icon: crearDestinoIcon() }).addTo(map).bindPopup("Destino").openPopup();

  try {
    // Obtener ubicación actual
    if (!ubicacionActual) {
      ubicacionActual = await obtenerUbicacionActual();
    }
    
    const origen = `${ubicacionActual.lat},${ubicacionActual.lon}`;
    console.log("Calculando ruta desde:", origen, "hacia:", `${destino.lat},${destino.lng}`);
    
    await obtenerRutaSegura(origen, `${destino.lat},${destino.lng}`, 'foot');
  } catch (err) {
    console.error("Error al calcular ruta:", err);
    alert("No se pudo calcular la ruta");
  }
}

class PriorityQueue {
  constructor() { this.elements = []; }
  enqueue(element, priority) { this.elements.push({ element, priority }); this.elements.sort((a, b) => a.priority - b.priority); }
  dequeue() { return this.elements.shift(); }
  isEmpty() { return this.elements.length === 0; }
}

function dijkstra(graph, start, end) {
  const distances = { [start]: 0 };
  const prev = {};
  const pq = new PriorityQueue();
  pq.enqueue(start, 0);

  while (!pq.isEmpty()) {
    const u = pq.dequeue().element;
    if (u === end) break;
    for (let neighbor in graph[u]) {
      const alt = distances[u] + graph[u][neighbor];
      if (!distances[neighbor] || alt < distances[neighbor]) {
        distances[neighbor] = alt;
        prev[neighbor] = u;
        pq.enqueue(neighbor, alt);
      }
    }
  }

  let path = [];
  let u = end;
  while (u !== undefined) { path.push(u); u = prev[u]; }
  return path.reverse();
}

function buildGraphFromGeoJSON(geojson) {
  const graph = {};
  geojson.features.forEach((feature, index) => {
    const id = `node_${index}`;
    graph[id] = {};
    geojson.features.forEach((otherFeature, otherIndex) => {
      if (index !== otherIndex) {
        const dist = distanciaMetros(feature.geometry.coordinates[0], otherFeature.geometry.coordinates[0]);
        if (dist < 100) graph[id][`node_${otherIndex}`] = dist;
      }
    });
  });
  return graph;
}

function distanciaMetros(a, b) {
  const R = 6371e3;
  const rad = x => (x * Math.PI) / 180;
  const φ1 = rad(a[1]);
  const φ2 = rad(b[1]);
  const Δφ = rad(b[1] - a[1]);
  const Δλ = rad(b[0] - a[0]);
  const d =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(d), Math.sqrt(1 - d));
}

// Cargar GeoJSON
fetch('https://tesis-f5ik.onrender.com/rutas/segura/tortuGB.geojson')
  .then(response => response.json())
  .then(geojson => {
    const graph = buildGraphFromGeoJSON(geojson);

    // Ejemplo: Calcular ruta al hacer clic
    map.on('click', function (e) {
      const start = L.latLng(pos.coords.latitude, pos.coords.longitude).toString()
      const end = e.latlng;
      let startNode = null, endNode = null;
      geojson.features.forEach((feature, index) => {
        const coords = feature.geometry.coordinates[0];
        if (distanciaMetros([coords[1], coords[0]], [start.lat, start.lng]) < 100) startNode = `node_${index}`;
        if (distanciaMetros([coords[1], coords[0]], [end.lat, end.lng]) < 100) endNode = `node_${index}`;
      });
      if (startNode && endNode) {
        const path = dijkstra(graph, startNode, endNode);
        const coords = path.map(nodeId => geojson.features[parseInt(nodeId.split('_')[1])].geometry.coordinates[0].map(c => [c[1], c[0]]));
        L.polyline(coords.flat(), { color: "#ffffffff", weight: 5 }).addTo(map);
      }
    });
  });

iniciarSeguimientoUbicacion();

// === INICIALIZAR UBICACIÓN AL CARGAR LA PÁGINA ===
(async () => {
  try {
    ubicacionActual = await obtenerUbicacionActual();
    console.log("Ubicación inicial cargada:", ubicacionActual);
  } catch (error) {
    console.error("No se pudo obtener ubicación inicial:", error);
  }
})();