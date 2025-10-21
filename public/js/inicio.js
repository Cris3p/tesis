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
      console.log('Ubicación actualizada:', pos.coords);
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
    console.log('Reportes obtenidos:', data);

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
    Swal.fire({
      ...swalConfig,
      icon: 'error',
      title: 'Error al cargar reportes',
      text: 'No se pudieron cargar los reportes: ' + error.message
    });
  }
};

// Cargar reportes
cargarReportes('/reportes/getall', map);

// Configurar eventos de ubicación
map.on('locationfound', onLocationFound);
map.on('locationerror', onLocationError);

iniciarSeguimientoUbicacion();
map.locate({ setView: true, maxZoom: 16 });

///-------------------BOTON DE EMERGENCIA----------------------------//
document.getElementById("btn-emergencia").addEventListener("click", async () => {
  const idUsuario = Number(localStorage.getItem("usuarioId"));
  
  if (!idUsuario) {
    Swal.fire({
      ...swalConfig,
      icon: 'warning',
      title: 'Sesión requerida',
      text: 'Debes iniciar sesión para usar esta función'
    });
    return;
  }

  try {
    Swal.fire({
      ...swalConfig,
      title: 'Procesando emergencia...',
      html: 'Obteniendo contactos y ubicación...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const res = await fetch(`https://tesis-f5ik.onrender.com/contactos/${idUsuario}`);
    if (!res.ok) throw new Error("No se pudieron obtener los contactos");
    const contactos = await res.json();

    if (!Array.isArray(contactos) || !contactos.length) {
      Swal.fire({
        ...swalConfig,
        icon: 'warning',
        title: 'Sin contactos',
        text: 'No tienes contactos de emergencia guardados. Configúralos en tu perfil.'
      });
      return;
    }

    const ubicacion = await new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error("Geolocalización no soportada"));
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        err => reject(new Error("Error al obtener ubicación: " + err.message)),
        { enableHighAccuracy: true, timeout: 100000, maximumAge: 0 }
      );
    });

    Swal.close();

    const confirmacion = await Swal.fire({
      ...swalConfig,
      icon: 'warning',
      title: '¿Enviar alerta de emergencia?',
      text: `Se notificará a ${contactos.length} contacto(s) con tu ubicación actual`,
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d62839',
      cancelButtonColor: '#3e2c6d'
    });

    if (!confirmacion.isConfirmed) return;

    let enviados = 0;
    contactos.forEach(c => {
      let numero = String(c.contacto || "").replace(/[^\d]/g, "");

      if (numero.startsWith("0")) numero = numero.slice(1);
      if (!numero.startsWith("54")) numero = "54" + numero;
      numero = numero.replace(/^54(11|2\d|3\d)15/, "54$1");

      const mensaje = `🚨 ¡ALERTA DE EMERGENCIA! 🚨\n\nEstoy en una situación de emergencia. Mi ubicación actual:\n\nhttps://www.google.com/maps?q=${ubicacion.lat},${ubicacion.lon}\n\n⚠️ Por favor, revisa este mensaje lo antes posible.`;
      const link = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
      window.open(link, "_blank");
      enviados++;
    });

    Swal.fire({
      ...swalConfig,
      icon: 'success',
      title: 'Alertas enviadas',
      text: `Se han abierto ${enviados} conversación(es) de WhatsApp con tus contactos de emergencia`,
      confirmButtonColor: '#5b3ea1'
    });

  } catch (err) {
    Swal.close();
    Swal.fire({
      ...swalConfig,
      icon: 'error',
      title: 'Error',
      text: err.message || 'Ocurrió un error al procesar la emergencia'
    });
    console.error(err);
  }
});

///-------------------FUNCIONALIDAD DE COMISARÍAS----------------------------//

async function cargarComisarias() {
  try {
    const response = await fetch('/data/comisarias.geojson');
    
    if (!response.ok) {
      throw new Error('No se pudo cargar el archivo de comisarías');
    }
    
    const geojson = await response.json();
    mostrarComisarias(geojson);
    
  } catch (error) {
    console.error('Error cargando comisarías:', error);
    Swal.fire({
      ...swalConfig,
      icon: 'error',
      title: 'Error al cargar comisarías',
      text: 'No se pudieron cargar las comisarías del mapa'
    });
  }
}

function mostrarComisarias(geojson) {
  if (comisariasLayer) {
    map.removeLayer(comisariasLayer);
  }

  comisariasLayer = L.geoJSON(geojson, {
    pointToLayer: (feature, latlng) => {
      return L.marker(latlng, { icon: crearComisariaIcon() });
    },
    onEachFeature: (feature, layer) => {
      const props = feature.properties;
      
      let popupContent = `
        <div style="font-size: 12px; line-height: 1.4;">
          <b style="color: #7f5bd5ff;">${props.dependencia}</b><br>
          <b>Localidad:</b> ${props.localidad}<br>
          <b>Dirección:</b> ${props.direccion}
        </div>
      `;
      
      layer.bindPopup(popupContent);
    }
  }).addTo(map);

  const cantidad = geojson.features.filter(f => f.geometry).length;
  console.log(`${cantidad} comisarías cargadas en el mapa`);
}

///-------------------FUNCIONALIDAD DE HOSPITALES----------------------------//

async function cargarHospitales() {
  try {
    const response = await fetch('/data/hospitales.geojson');
    
    if (!response.ok) {
      throw new Error('No se pudo cargar el archivo de hospitales');
    }
    
    const geojson = await response.json();
    mostrarHospitales(geojson);
    
  } catch (error) {
    console.error('Error cargando hospitales:', error);
    Swal.fire({
      ...swalConfig,
      icon: 'error',
      title: 'Error al cargar hospitales',
      text: 'No se pudieron cargar los hospitales del mapa'
    });
  }
}

function mostrarHospitales(geojson) {
  if (hospitalesLayer) {
    map.removeLayer(hospitalesLayer);
  }

  hospitalesLayer = L.geoJSON(geojson, {
    pointToLayer: (feature, latlng) => {
      return L.marker(latlng, { icon: crearHospitalIcon() });
    },
    onEachFeature: (feature, layer) => {
      const props = feature.properties;
      
      let popupContent = `
        <div style="font-size: 12px; line-height: 1.4;">
          <b style="color: #7f5bd5ff;">${props.nor}</b><br>
          <b>Categoría:</b> ${props.cat}<br>
          <b>Dirección:</b> ${props.dom}<br>
          <b>Localidad:</b> ${props.nrs}
        </div>
      `;
      
      layer.bindPopup(popupContent);
    }
  }).addTo(map);

  const cantidad = geojson.features.filter(f => f.geometry).length;
  console.log(`${cantidad} hospitales cargados en el mapa`);
}

///-------------------EVENT LISTENERS BOTONES FILTRO----------------------------//

document.querySelector('[data-filter="comisarias"]').addEventListener('click', function() {
  const btnComisarias = this;
  
  btnComisarias.classList.toggle('active');
  
  if (btnComisarias.classList.contains('active')) {
    cargarComisarias();
  } else {
    if (comisariasLayer) {
      map.removeLayer(comisariasLayer);
      comisariasLayer = null;
    }
  }
});

document.querySelector('[data-filter="hospitales"]').addEventListener('click', function() {
  const btnHospitales = this;
  
  btnHospitales.classList.toggle('active');
  
  if (btnHospitales.classList.contains('active')) {
    cargarHospitales();
  } else {
    if (hospitalesLayer) {
      map.removeLayer(hospitalesLayer);
      hospitalesLayer = null;
    }
  }
});

///-------------------MENU DROPDOWN----------------------------//

document.getElementById("userBtn").addEventListener("click", () => {
  document.getElementById("menuDropdown").classList.toggle("hidden");
});

window.addEventListener("click", (e) => {
  if (!e.target.closest(".user-menu")) {
    document.getElementById("menuDropdown").classList.add("hidden");
  }
});