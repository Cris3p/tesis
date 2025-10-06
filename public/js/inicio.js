//-------------------MAPA---LEAFLET.JS----------------------------//

var map = L.map('map').setView([0.0, 0.0], 2.5); // Vista inicial del mapa centrada en coordenadas 0,0 con un zoom de 2.5

L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
  maxZoom: 20,
  attribution: '&copy; Stadia Maps'
}).addTo(map);

var marker;

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

function onLocationFound(e) {
  if (marker) {
    map.removeLayer(marker);
  }

  var radius = Math.max(e.accuracy / 10, 20);
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

iniciarSeguimientoUbicacion();

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

// Cerrar sesión
// Añade un evento para el botón de cerrar sesión
document.getElementById('logoutBtn').addEventListener('click', async (e) => {
    e.preventDefault(); // Evita que el enlace recargue la página

    try {
        const res = await fetch('/usuarios/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (res.ok) {
            const data = await res.json();
            console.log(data.message);

            // Elimina el usuario del localStorage (si lo estás usando)
            localStorage.removeItem('usuarioId'); 

            // Redirige al usuario de vuelta a la página de login
            window.location.href = '/html/login.html';
        } else {
            const err = await res.json();
            alert(err.error || 'Error al cerrar sesión');
        }
    } catch (error) {
          console.error('Error detallado:', error);
          alert('Error al conectar con el servidor para cerrar sesión');
    }
});