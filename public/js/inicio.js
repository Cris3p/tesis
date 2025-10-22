//-------------------MAPA---LEAFLET.JS----------------------------//

// Configuración global de SweetAlert2
const swalConfig = {
  confirmButtonColor: '#5b3ea1',
  background: '#1f1c29',
  color: '#e4e6eb',
  iconColor: '#5b3ea1',
  heightAuto: false
};

var map = L.map('map').setView([0.0, 0.0], 2.5);

L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
  maxZoom: 20,
  attribution: '&copy; Stadia Maps'
}).addTo(map);

var marker;
var comisariasLayer = null;
var hospitalesLayer = null;
var routingControl = null;
var ubicacionActual = null; // ✅ DECLARAR GLOBALMENTE
var destinoMarker = null;
var rutaPolyline = null; // Para guardar la línea de ruta

// ✅ FUNCIÓN PARA OBTENER UBICACIÓN ACTUAL
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
        console.log("Ubicación obtenida:", ubicacion);
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
        maximumAge: 5000 
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

function crearDestinoIcon() {
  return L.divIcon({
    className: 'destino-marker',
    iconSize: [25, 25],
    iconAnchor: [12, 12],
    html: '<div style="background: #d62839; border: 3px solid white; border-radius: 50%; width: 25px; height: 25px;"></div>'
  });
}

function crearComisariaIcon() {
  return L.divIcon({
    className: 'comisaria-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    html: '<img src="../img/policia.png" style="width: 100%; height: 100%; object-fit: contain;" />'
  });
}

function crearHospitalIcon() {
  return L.divIcon({
    className: 'hospital-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    html: '<img src="../img/hospital.png" style="width: 100%; height: 100%; object-fit: contain;" />'
  });
}

function crearPulseIcon() {
  return L.divIcon({
    className: 'pulse-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    html: '<div class="pulse-inner"></div>'
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

  // Actualizar ubicación actual
  ubicacionActual = {
    lat: e.latlng.lat,
    lon: e.latlng.lng
  };

  map.setView(e.latlng, 16);
}

function onLocationError(e) {
  Swal.fire({
    ...swalConfig,
    icon: 'error',
    title: 'Error de ubicación',
    text: 'No se pudo obtener tu ubicación: ' + e.message
  });
  console.error('Error de geolocalización:', e);
}

function iniciarSeguimientoUbicacion() {
  if (!navigator.geolocation) {
    Swal.fire({
      ...swalConfig,
      icon: 'error',
      title: 'Geolocalización no disponible',
      text: 'Tu dispositivo no soporta la geolocalización'
    });
    return;
  }

  navigator.geolocation.watchPosition(
    (pos) => {
      const coords = {
        latlng: L.latLng(pos.coords.latitude, pos.coords.longitude),
        accuracy: pos.coords.accuracy
      };
      onLocationFound(coords);
    },
    (err) => {
      onLocationError(err);
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }
  );
}

// ✅ FUNCIÓN PARA CALCULAR Y DIBUJAR RUTA USANDO OSRM
async function obtenerRutaSegura(origen, destino, modo = 'foot') {
  try {
    console.log("Calculando ruta:", { origen, destino, modo });

    // Limpiar ruta anterior
    if (rutaPolyline) {
      map.removeLayer(rutaPolyline);
      rutaPolyline = null;
    }

    // OSRM API (servicio gratuito de OpenStreetMap)
    const url = `https://router.project-osrm.org/route/v1/${modo}/${origen};${destino}?overview=full&geometries=geojson`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error OSRM: ${response.status}`);
    
    const data = await response.json();
    
    if (!data.routes || data.routes.length === 0) {
      throw new Error("No se encontró una ruta");
    }

    const route = data.routes[0];
    const coordinates = route.geometry.coordinates;
    
    // Convertir coordenadas [lon, lat] a [lat, lon] para Leaflet
    const latlngs = coordinates.map(coord => [coord[1], coord[0]]);
    
    // Dibujar la ruta
    rutaPolyline = L.polyline(latlngs, {
      color: '#5b3ea1',
      weight: 5,
      opacity: 0.8,
      lineJoin: 'round',
      lineCap: 'round'
    }).addTo(map);

    // Ajustar vista para mostrar toda la ruta
    map.fitBounds(rutaPolyline.getBounds(), { padding: [50, 50] });

    // Mostrar información de la ruta
    const distanciaKm = (route.distance / 1000).toFixed(2);
    const tiempoMin = Math.round(route.duration / 60);

    Swal.fire({
      ...swalConfig,
      icon: 'success',
      title: 'Ruta calculada',
      html: `
        <p><strong>Distancia:</strong> ${distanciaKm} km</p>
        <p><strong>Tiempo estimado:</strong> ${tiempoMin} minutos</p>
      `,
      confirmButtonText: 'Entendido'
    });

    console.log("Ruta dibujada exitosamente");

  } catch (error) {
    console.error("Error al obtener ruta:", error);
    Swal.fire({
      ...swalConfig,
      icon: 'error',
      title: 'Error al calcular ruta',
      text: error.message || 'No se pudo calcular la ruta'
    });
  }
}

// ✅ FUNCIÓN MEJORADA PARA IR AL DESTINO
async function irADestino(place) {
  if (!place || !place.lat || !place.lon) {
    console.error("Datos de lugar inválidos:", place);
    return;
  }
  
  const destino = L.latLng(place.lat, place.lon);

  // Marcar destino
  if (destinoMarker) map.removeLayer(destinoMarker);
  destinoMarker = L.marker(destino, { icon: crearDestinoIcon() })
    .addTo(map)
    .bindPopup(`<b>Destino</b><br>${place.display_name || 'Ubicación seleccionada'}`)
    .openPopup();

  try {
    // Asegurar que tenemos ubicación actual
    if (!ubicacionActual) {
      console.log("Obteniendo ubicación actual...");
      ubicacionActual = await obtenerUbicacionActual();
    }
    
    const origen = `${ubicacionActual.lon},${ubicacionActual.lat}`; // lon,lat para OSRM
    const dest = `${place.lon},${place.lat}`;
    
    console.log("Calculando ruta desde:", origen, "hacia:", dest);
    
    await obtenerRutaSegura(origen, dest, 'foot');
    
  } catch (err) {
    console.error("Error al calcular ruta:", err);
    Swal.fire({
      ...swalConfig,
      icon: 'error',
      title: 'Error',
      text: 'No se pudo calcular la ruta: ' + err.message
    });
  }
}

// === BUSCADOR DE DIRECCIONES ===
const input = document.getElementById("searchInput");
const btnUbicacion = document.getElementById("searchBtn");
const suggestionsBox = document.getElementById("suggestions");

// ✅ EVENTO DEL BOTÓN DE BÚSQUEDA
btnUbicacion.addEventListener("click", async () => {
  const query = input.value.trim();
  
  if (!query) {
    Swal.fire({
      ...swalConfig,
      icon: 'warning',
      title: 'Campo vacío',
      text: 'Por favor, ingresá una dirección para buscar'
    });
    return;
  }

  try {
    Swal.fire({
      ...swalConfig,
      title: 'Buscando...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=ar`,
      { headers: { "User-Agent": "OnTrack-App" } }
    );
    
    const data = await res.json();
    Swal.close();
    
    if (data && data.length > 0) {
      await irADestino(data[0]);
    } else {
      Swal.fire({
        ...swalConfig,
        icon: 'warning',
        title: 'No encontrado',
        text: 'No se encontró la ubicación buscada'
      });
    }
  } catch (error) {
    Swal.close();
    console.error("Error en búsqueda:", error);
    Swal.fire({
      ...swalConfig,
      icon: 'error',
      title: 'Error',
      text: 'Error al buscar la ubicación'
    });
  }
});

// ✅ SUGERENCIAS MIENTRAS ESCRIBÍS
let debounceTimer;
input.addEventListener("input", async function () {
  clearTimeout(debounceTimer);
  
  const query = this.value.trim();
  suggestionsBox.innerHTML = "";

  if (query.length < 3) {
    suggestionsBox.style.display = "none";
    return;
  }

  debounceTimer = setTimeout(async () => {
    try {
      // Asegurar ubicación actual
      if (!ubicacionActual) {
        ubicacionActual = await obtenerUbicacionActual();
      }

      let params = `format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&countrycodes=ar`;

      if (ubicacionActual) {
        const lat = ubicacionActual.lat;
        const lon = ubicacionActual.lon;
        const viewbox = `${lon - 0.5},${lat - 0.5},${lon + 0.5},${lat + 0.5}`;
        params += `&viewbox=${viewbox}&bounded=0`;
      }

      const url = `https://nominatim.openstreetmap.org/search?${params}`;
      const res = await fetch(url, { headers: { "User-Agent": "OnTrack-App" } });

      if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

      const data = await res.json();

      data.forEach((item) => {
        const li = document.createElement("li");
        li.className = "suggestion";
        li.textContent = item.display_name;
        
        li.addEventListener("mousedown", (e) => {
          e.preventDefault();
        });
        
        li.addEventListener("click", async () => {
          input.value = item.display_name;
          suggestionsBox.innerHTML = "";
          suggestionsBox.style.display = "none";

          await irADestino(item);
        });
        
        suggestionsBox.appendChild(li);
      });

      if (data.length > 0) {
        suggestionsBox.style.display = "block";
      }
    } catch (err) {
      console.error("Error al buscar sugerencias:", err);
    }
  }, 300); // Delay de 300ms
});

input.addEventListener("blur", () => {
  setTimeout(() => { suggestionsBox.style.display = "none"; }, 300);
});

input.addEventListener("focus", () => {
  if (suggestionsBox.children.length > 0) {
    suggestionsBox.style.display = "block";
  }
});

// [... resto del código de reportes, comisarías, hospitales, etc. ...]
// (Se mantiene igual, solo copiá el resto de tu código aquí)

// Cargar reportes
const cargarReportes = async (endpoint, map) => {
  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.status}`);
    }
    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('Los datos no son un array');
    }

    data.forEach(reporte => {
      if (!reporte.lat || !reporte.lon) return;
      L.marker([reporte.lat, reporte.lon], { icon: crearPulseIcon() })
        .addTo(map)
        .bindPopup(`<b>${reporte.tipo_crimen.toUpperCase()}</b><br>${reporte.descripcion || 'Sin descripción'}`);
    });
  } catch (error) {
    console.error("Error cargando reportes:", error);
  }
};

cargarReportes('/reportes/getall', map);

// Configurar eventos de ubicación
map.on('locationfound', onLocationFound);
map.on('locationerror', onLocationError);

// Doble click para marcar
var marker2;
map.doubleClickZoom.disable();
map.on('dblclick', function (e) {
  if (marker2) map.removeLayer(marker2);
  marker2 = L.marker(e.latlng, { icon: crearMarker2Icon() })
    .addTo(map)
    .bindPopup("Marcador agregado")
    .openPopup();
  document.getElementById('btnQuitar').style.display = 'block';
});

function quitarMarker2() {
  if (marker2) {
    map.removeLayer(marker2);
    marker2 = null;
    document.getElementById('btnQuitar').style.display = 'none';
  }
}

// ✅ INICIALIZAR AL CARGAR
(async () => {
  try {
    iniciarSeguimientoUbicacion();
    map.locate({ setView: true, maxZoom: 16 });
    
    // Obtener ubicación inicial
    ubicacionActual = await obtenerUbicacionActual();
    console.log("Ubicación inicial cargada:", ubicacionActual);
  } catch (error) {
    console.error("No se pudo obtener ubicación inicial:", error);
  }
})();

// [Resto de código: botón emergencia, comisarías, hospitales, dropdown...]