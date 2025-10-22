//-------------------MAPA---LEAFLET.JS----------------------------//

// === Configuración SweetAlert2 ===
const swalConfig = {
  confirmButtonColor: '#5b3ea1',
  background: '#1f1c29',
  color: '#e4e6eb',
  iconColor: '#5b3ea1',
  heightAuto: false
};

// === VARIABLES GLOBALES ===
var map = L.map('map').setView([0.0, 0.0], 2.5);
let ubicacionActual = null;
var marker, marker2, destinoMarker;
var comisariasLayer = null;
var hospitalesLayer = null;
let routingControl = null;

// === CAPA BASE ===
L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
  maxZoom: 20,
  attribution: '&copy; Stadia Maps'
}).addTo(map);

// === FUNCIONES DE ICONOS ===
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

function crearPulseIcon() {
  return L.divIcon({
    className: 'pulse-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    html: '<div class="pulse-inner"></div>'
  });
}

function crearDestinoIcon() {
  return L.divIcon({
    className: 'destino-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    html: '<div class="destino-dot"></div>'
  });
}

function crearComisariaIcon() {
  return L.divIcon({
    className: 'comisaria-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    html: '<img src="../img/policia.png" style="width:100%;height:100%;object-fit:contain;">'
  });
}

function crearHospitalIcon() {
  return L.divIcon({
    className: 'hospital-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    html: '<img src="../img/hospital.png" style="width:100%;height:100%;object-fit:contain;">'
  });
}

// === GEOLOCALIZACIÓN ===
function obtenerUbicacionActual() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocalización no soportada"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const ubicacion = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        resolve(ubicacion);
      },
      (err) => {
        console.error("Error obteniendo ubicación:", err);
        const center = map.getCenter();
        resolve({ lat: center.lat, lon: center.lng });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  });
}

function onLocationFound(e) {
  if (marker) map.removeLayer(marker);
  const radius = Math.max(e.accuracy / 2, 5);
  marker = L.layerGroup([
    L.circle(e.latlng, {
      radius: radius,
      color: '#723edbff',
      fillColor: '#723edbff',
      fillOpacity: 0.5,
      weight: 1
    }),
    L.marker(e.latlng, { icon: crearLocationIcon() })
  ]).addTo(map);
  map.setView(e.latlng, 16);
}

function onLocationError(e) {
  Swal.fire({ ...swalConfig, icon: 'error', title: 'Error de ubicación', text: e.message });
}

function iniciarSeguimientoUbicacion() {
  if (!navigator.geolocation) {
    Swal.fire({ ...swalConfig, icon: 'error', title: 'Geolocalización no disponible' });
    return;
  }
  navigator.geolocation.watchPosition(
    (pos) => {
      const coords = { latlng: L.latLng(pos.coords.latitude, pos.coords.longitude), accuracy: pos.coords.accuracy };
      ubicacionActual = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      onLocationFound(coords);
    },
    (err) => onLocationError(err),
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

// === MARCADOR SECUNDARIO ===
map.doubleClickZoom.disable();
map.on('dblclick', function (e) {
  if (marker2) map.removeLayer(marker2);
  marker2 = L.marker(e.latlng, { icon: crearMarker2Icon() }).addTo(map).bindPopup("Marcador agregado").openPopup();
  document.getElementById('btnQuitar').style.display = 'block';
});

function quitarMarker2() {
  if (marker2) {
    map.removeLayer(marker2);
    marker2 = null;
    document.getElementById('btnQuitar').style.display = 'none';
  }
}

// === REPORTES (PUNTOS DE INCIDENTES) ===
const cargarReportes = async (endpoint, map) => {
  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`Error en la solicitud: ${res.status}`);
    const data = await res.json();
    data.forEach(r => {
      if (r.lat && r.lon) {
        L.marker([r.lat, r.lon], { icon: crearPulseIcon() })
          .addTo(map)
          .bindPopup(`<b>${r.tipo_crimen.toUpperCase()}</b><br>${r.descripcion}`);
      }
    });
  } catch (error) {
    Swal.fire({ ...swalConfig, icon: 'error', title: 'Error al cargar reportes', text: error.message });
  }
};
cargarReportes('/reportes/getall', map);

// === BOTÓN DE EMERGENCIA ===
document.getElementById("btn-emergencia").addEventListener("click", async () => {
  const idUsuario = Number(localStorage.getItem("usuarioId"));
  if (!idUsuario) {
    Swal.fire({ ...swalConfig, icon: 'warning', title: 'Sesión requerida', text: 'Inicia sesión para usar esta función' });
    return;
  }
  try {
    Swal.fire({ ...swalConfig, title: 'Procesando...', html: 'Obteniendo ubicación...', didOpen: () => Swal.showLoading() });
    const res = await fetch(`/contactos/${idUsuario}`);
    if (!res.ok) throw new Error("No se pudieron obtener contactos");
    const contactos = await res.json();
    if (!Array.isArray(contactos) || !contactos.length) {
      Swal.fire({ ...swalConfig, icon: 'warning', title: 'Sin contactos', text: 'Agrega contactos de emergencia.' });
      return;
    }
    const ubicacion = await obtenerUbicacionActual();
    Swal.close();
    const confirmacion = await Swal.fire({
      ...swalConfig,
      icon: 'warning',
      title: '¿Enviar alerta?',
      text: `Se notificará a ${contactos.length} contacto(s)`,
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d62839'
    });
    if (!confirmacion.isConfirmed) return;
    contactos.forEach(c => {
      let numero = String(c.contacto || "").replace(/[^\d]/g, "");
      if (numero.startsWith("0")) numero = numero.slice(1);
      if (!numero.startsWith("54")) numero = "54" + numero;
      const mensaje = `🚨 ¡ALERTA DE EMERGENCIA! 🚨\nEstoy en: https://www.google.com/maps?q=${ubicacion.lat},${ubicacion.lon}`;
      window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`, "_blank");
    });
    Swal.fire({ ...swalConfig, icon: 'success', title: 'Alertas enviadas' });
  } catch (err) {
    Swal.fire({ ...swalConfig, icon: 'error', title: 'Error', text: err.message });
  }
});

// === CAPAS DE COMISARÍAS Y HOSPITALES ===
async function cargarComisarias() {
  try {
    const res = await fetch('/data/comisarias.geojson');
    if (!res.ok) throw new Error('No se pudo cargar comisarías');
    const geojson = await res.json();
    if (comisariasLayer) map.removeLayer(comisariasLayer);
    comisariasLayer = L.geoJSON(geojson, {
      pointToLayer: (_, latlng) => L.marker(latlng, { icon: crearComisariaIcon() }),
      onEachFeature: (f, l) => {
        const p = f.properties;
        l.bindPopup(`<b>${p.dependencia}</b><br>${p.localidad}<br>${p.direccion}`);
      }
    }).addTo(map);
  } catch (error) {
    Swal.fire({ ...swalConfig, icon: 'error', title: 'Error al cargar comisarías', text: error.message });
  }
}

async function cargarHospitales() {
  try {
    const res = await fetch('/data/hospitales.geojson');
    if (!res.ok) throw new Error('No se pudo cargar hospitales');
    const geojson = await res.json();
    if (hospitalesLayer) map.removeLayer(hospitalesLayer);
    hospitalesLayer = L.geoJSON(geojson, {
      pointToLayer: (_, latlng) => L.marker(latlng, { icon: crearHospitalIcon() }),
      onEachFeature: (f, l) => {
        const p = f.properties;
        l.bindPopup(`<b>${p.nor}</b><br>${p.dom}<br>${p.nrs}`);
      }
    }).addTo(map);
  } catch (error) {
    Swal.fire({ ...swalConfig, icon: 'error', title: 'Error al cargar hospitales', text: error.message });
  }
}

document.querySelector('[data-filter="comisarias"]').addEventListener('click', function () {
  this.classList.toggle('active');
  this.classList.contains('active') ? cargarComisarias() : map.removeLayer(comisariasLayer);
});

document.querySelector('[data-filter="hospitales"]').addEventListener('click', function () {
  this.classList.toggle('active');
  this.classList.contains('active') ? cargarHospitales() : map.removeLayer(hospitalesLayer);
});

// === BUSCADOR Y RUTAS ===
const inputBuscar = document.getElementById("inputBuscar");
const sugerenciasBox = document.getElementById("sugerencias");

inputBuscar.addEventListener("input", async function () {
  const query = this.value.trim();
  sugerenciasBox.innerHTML = "";
  if (!query) return;

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ", Argentina")}&limit=5`;
    const res = await fetch(url);
    const lugares = await res.json();

    lugares.forEach(lugar => {
      const item = document.createElement("div");
      item.className = "sugerencia-item";
      item.textContent = lugar.display_name;
      item.addEventListener("click", () => seleccionarDestino(lugar));
      sugerenciasBox.appendChild(item);
    });
  } catch (err) {
    console.error("Error en buscador:", err);
  }
});

function seleccionarDestino(lugar) {
  sugerenciasBox.innerHTML = "";
  inputBuscar.value = lugar.display_name;

  if (destinoMarker) map.removeLayer(destinoMarker);
  const coords = [lugar.lat, lugar.lon];
  destinoMarker = L.marker(coords, { icon: crearDestinoIcon() }).addTo(map);

  if (routingControl) map.removeControl(routingControl);

  routingControl = L.Routing.control({
    waypoints: [
      L.latLng(ubicacionActual.lat, ubicacionActual.lon),
      L.latLng(coords[0], coords[1])
    ],
    lineOptions: {
      styles: [{ color: '#3e2c6d', weight: 5 }]
    },
    createMarker: () => null,
    addWaypoints: false
  }).addTo(map);
}

// === MENÚ DE USUARIO ===
document.getElementById("userBtn").addEventListener("click", () => {
  document.getElementById("menuDropdown").classList.toggle("hidden");
});
window.addEventListener("click", (e) => {
  if (!e.target.closest(".user-menu")) {
    document.getElementById("menuDropdown").classList.add("hidden");
  }
});

// === INICIO ===
iniciarSeguimientoUbicacion();
(async () => {
  try {
    ubicacionActual = await obtenerUbicacionActual();
    console.log("Ubicación inicial:", ubicacionActual);
  } catch (error) {
    console.error("No se pudo obtener ubicación inicial:", error);
  }
})();
