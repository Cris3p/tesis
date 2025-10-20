// reportes.js

// Configuración de SweetAlert2
const swalConfig = {
  confirmButtonColor: '#5b3ea1',
  background: '#1f1c29',
  color: '#e4e6eb',
  iconColor: '#5b3ea1',
  heightAuto: false
};

//------------------- MAPA LEAFLET -------------------
var map = L.map('map').setView([-34.6037, -58.3816], 13);
L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
    maxZoom: 20,
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
}).addTo(map);

var marker;
var ultimaUbicacion = null;
let markerSeleccionado = false;


/**
 * Reemplaza el marcador existente por uno nuevo en la ubicación especificada, 
 * usando el icono apropiado (GPS o Selección).
 * @param {L.LatLng} latlng Coordenadas para el marcador.
 * @param {boolean} isGpsLocation Indica si el marcador es la ubicación actual (true) o seleccionada (false).
 */
function replaceMarker(latlng, isGpsLocation = false) {

    if (marker) {
        map.removeLayer(marker);
    }

    let icon;
    let popupText;

    if (isGpsLocation) {
        icon = L.divIcon({
            className: 'location-center',
            iconSize: [18, 18],
            iconAnchor: [9, 9],
            html: '<div class="location-dot"></div>'
        });
        popupText = "Estás aquí";
    } else {
        icon = L.divIcon({
            className: 'custom-marker2',
            iconSize: [19, 19],
            iconAnchor: [10, 10],
            html: '<div class="marker2-dot"></div>'
        });
        popupText = "Ubicación seleccionada";
    }

    marker = L.marker(latlng, { icon: icon })
        .addTo(map)
        .bindPopup(popupText)
        .openPopup();
}

// ------------------- GEOJSON (carga + índice) -------------------
let provinciasData = null;
let localidadesData = null;
let geoReady = false;
let geoLoadPromise = null;

const idxLocalidadesPorProvincia = new Map();

function normalizarProvinciaNombre(n) {
    if (!n) return null;
    return n.toString().trim();
}

async function cargarGeoJSON() {
    if (geoLoadPromise) return geoLoadPromise;

    geoLoadPromise = Promise.all([
        fetch("../data/provinciasARG.geojson").then(r => r.json()),
        fetch("../data/localidades.geojson").then(r => r.json())
    ]).then(([prov, loc]) => {
        provinciasData = prov;
        localidadesData = loc;

        idxLocalidadesPorProvincia.clear();
        for (const f of (localidadesData.features || [])) {
            const provName = normalizarProvinciaNombre(f?.properties?.provincia?.nombre);
            if (!provName) continue;
            if (!idxLocalidadesPorProvincia.has(provName)) {
                idxLocalidadesPorProvincia.set(provName, []);
            }
            idxLocalidadesPorProvincia.get(provName).push(f);
        }

        geoReady = true;
        console.log("GeoJSON cargados e indexados.");
    }).catch(err => {
        console.error("Error cargando GeoJSON:", err);
        geoReady = false;
    });

    return geoLoadPromise;
}

async function ensureGeoReady() {
    if (!geoReady) {
        await cargarGeoJSON();
    }
}

// ------------------- PROVINCIA/LOCALIDAD DESDE COORDENADAS -------------------
async function obtenerProvinciaYLocalidad(lat, lon) {
    await ensureGeoReady();

    if (!provinciasData || !localidadesData) {
        return { provincia: "Desconocida", localidad: "Desconocida" };
    }

    const punto = turf.point([Number(lon), Number(lat)]);

    let provinciaByPolygon = null;
    for (const feature of provinciasData.features) {
        try {
            if (turf.booleanPointInPolygon(punto, feature)) {
                provinciaByPolygon = normalizarProvinciaNombre(feature?.properties?.shapeName);
                break;
            }
        } catch (e) {
            continue;
        }
    }

    let localidad = "Desconocida";
    let provinciaFinal = provinciaByPolygon || "Desconocida";
    let mejor = { distKm: Infinity, feat: null };

    let candidatas = [];
    if (provinciaByPolygon && idxLocalidadesPorProvincia.has(provinciaByPolygon)) {
        candidatas = idxLocalidadesPorProvincia.get(provinciaByPolygon);
    } else {
        candidatas = localidadesData.features || [];
    }

    for (const f of candidatas) {
        const coords = f?.geometry?.coordinates;
        if (!coords || coords.length < 2) continue;
        const pLoc = turf.point(coords);
        const d = turf.distance(punto, pLoc, { units: "kilometers" });

        if (d < mejor.distKm) {
            mejor = { distKm: d, feat: f };
        }
    }

    if (mejor.feat) {
        localidad = mejor.feat?.properties?.nombre || "Desconocida";
        const provFromLoc = normalizarProvinciaNombre(mejor.feat?.properties?.provincia?.nombre);

        if (!provinciaByPolygon && provFromLoc) {
            provinciaFinal = provFromLoc;
        }
    }

    if (provinciaFinal === "Ciudad Autónoma de Buenos Aires") {
        localidad = "CABA";
    }

    console.log("[DEBUG] lat/lon:", lat, lon, "| Provincia(polígono):", provinciaByPolygon, "| Provincia(final):", provinciaFinal, "| Localidad:", localidad);
    return { provincia: provinciaFinal || "Desconocida", localidad: localidad || "Desconocida" };
}

async function actualizarProvinciaLocalidad(lat, lon) {
    const { provincia, localidad } = await obtenerProvinciaYLocalidad(lat, lon);
    document.getElementById("provincia").value = provincia;
    document.getElementById("localidad").value = localidad;
    console.log("Ubicación final -> Provincia:", provincia, "| Localidad:", localidad);
}

// ------------------- UBICACIÓN GPS -------------------
async function onLocationFound(e) {
    await ensureGeoReady();

    ultimaUbicacion = e.latlng;

    replaceMarker(e.latlng, true);

    map.setView(e.latlng, 15);

    const lat = Number(e.latlng.lat.toFixed(6));
    const lon = Number(e.latlng.lng.toFixed(6));

    document.getElementById("lat").value = lat;
    document.getElementById("lon").value = lon;
    document.getElementById("ubicacion").value = `${lat}, ${lon}`;

    markerSeleccionado = false;
    await actualizarProvinciaLocalidad(lat, lon);

    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&countrycodes=ar`, {
            headers: { "User-Agent": "OnTrack-App" }
        });
        const data = await res.json();
        if (data && data.display_name) {
            document.getElementById("ubicacion").value = data.display_name;
        }
    } catch (err) {
        console.error("Error en reverse geocoding:", err);
    }
}

function onLocationError(e) {
    Swal.fire({
        ...swalConfig,
        icon: 'error',
        title: 'Error de ubicación',
        text: `No se pudo obtener tu ubicación: ${e.message}`,
        confirmButtonText: 'Entendido'
    });
}

map.on('locationfound', onLocationFound);
map.on('locationerror', onLocationError);
map.doubleClickZoom.disable();
map.locate({ setView: true, maxZoom: 15, enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });

// ------------------- DOBLE CLICK EN MAPA -------------------
map.on('dblclick', async function (e) {
    await ensureGeoReady();

    const lat = Number(e.latlng.lat.toFixed(6));
    const lon = Number(e.latlng.lng.toFixed(6));

    replaceMarker(e.latlng, false);

    map.setView(e.latlng, 15);

    document.getElementById("lat").value = lat;
    document.getElementById("lon").value = lon;
    document.getElementById("ubicacion").value = `${lat}, ${lon}`;

    markerSeleccionado = true;
    await actualizarProvinciaLocalidad(lat, lon);

    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&countrycodes=ar`, {
            headers: { "User-Agent": "OnTrack-App" }
        });
        const data = await res.json();
        if (data && data.display_name) {
            document.getElementById("ubicacion").value = data.display_name;
        }
    } catch (err) {
        console.error("Error en reverse geocoding:", err);
    }
});

// ------------------- BOTÓN UBICACIÓN ACTUAL -------------------
async function obtenerUbicacion() {
    await ensureGeoReady();

    if (ultimaUbicacion) {
        replaceMarker(ultimaUbicacion, true);

        map.setView(ultimaUbicacion, 15);

        const lat = Number(ultimaUbicacion.lat.toFixed(6));
        const lon = Number(ultimaUbicacion.lng.toFixed(6));

        document.getElementById("lat").value = lat;
        document.getElementById("lon").value = lon;
        document.getElementById("ubicacion").value = `${lat}, ${lon}`;

        markerSeleccionado = false;
        await actualizarProvinciaLocalidad(lat, lon);

        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&countrycodes=ar`, {
                headers: { "User-Agent": "OnTrack-App" }
            });
            const data = await res.json();
            if (data && data.display_name) {
                document.getElementById("ubicacion").value = data.display_name;
            }
        } catch (err) {
            console.error("Error en reverse geocoding:", err);
        }
    } else {
        Swal.fire({
            ...swalConfig,
            icon: 'warning',
            title: 'Ubicación no detectada',
            text: 'Todavía no se detectó la ubicación. Intentá de nuevo en unos segundos.',
            confirmButtonText: 'Reintentar'
        }).then(() => {
            map.locate({ setView: true, maxZoom: 15, enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
        });
    }
}

// ------------------- ENVIAR REPORTE -------------------
document.getElementById("reporteForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const id_usuario = localStorage.getItem('usuarioId');
    if (!id_usuario) {
        Swal.fire({
            ...swalConfig,
            icon: 'warning',
            title: 'Sesión no encontrada',
            text: 'No se encontró el usuario. Por favor, iniciá sesión primero.',
            confirmButtonText: 'Entendido'
        });
        return;
    }

    const fecha_hora = `${document.getElementById("fecha").value} ${document.getElementById("hora").value}`;

    let lat = parseFloat(document.getElementById("lat").value);
    let lon = parseFloat(document.getElementById("lon").value);

    if (isNaN(lat) || isNaN(lon)) {
        Swal.fire({
            ...swalConfig,
            icon: 'error',
            title: 'Coordenadas inválidas',
            text: 'Faltan coordenadas válidas. Por favor, seleccioná una ubicación en el mapa.',
            confirmButtonText: 'Entendido'
        });
        return;
    }

    const provInput = document.getElementById("provincia").value;
    const locInput = document.getElementById("localidad").value;

    if (!provInput || provInput === "Desconocida" || !locInput || locInput === "Desconocida") {
        const { provincia, localidad } = await obtenerProvinciaYLocalidad(lat, lon);
        document.getElementById("provincia").value = provincia;
        document.getElementById("localidad").value = localidad;
    }

    const datos = {
        id_usuario,
        tipo_crimen: document.getElementById("tipo").value,
        descripcion: document.getElementById("descripcion").value,
        lat,
        lon,
        fecha_hora,
        provincia: document.getElementById("provincia").value,
        localidad: document.getElementById("localidad").value,
        iluminacion: document.querySelector('input[name="iluminacion"]:checked')?.value === 'si' ? 1 : 0,
        gente: document.querySelector('input[name="gente"]:checked')?.value === 'si' ? 1 : 0
    };

    try {
        const res = await fetch("/reportes/generar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });

        if (!res.ok) throw new Error("Error al enviar el reporte");

        await res.json();
        
        Swal.fire({
            ...swalConfig,
            icon: 'success',
            title: '¡Reporte enviado!',
            text: 'Tu reporte fue enviado con éxito',
            confirmButtonText: 'Aceptar'
        });

        document.getElementById("reporteForm").reset();

        if (marker) {
            map.removeLayer(marker);
            marker = null;
        }

    } catch (error) {
        console.error(error);
        Swal.fire({
            ...swalConfig,
            icon: 'error',
            title: 'Error al enviar',
            text: 'Hubo un error al enviar el reporte. Por favor, intentá nuevamente.',
            confirmButtonText: 'Entendido'
        });
    }
});

// ------------------- AUTOCOMPLETADO -------------------
const inputUbicacion = document.getElementById("ubicacion");
const listaSugerencias = document.getElementById("sugerencias");
let debounceTimeout;

inputUbicacion.addEventListener("input", () => {
    const query = inputUbicacion.value.trim();
    if (query.length < 3) {
        listaSugerencias.innerHTML = "";
        return;
    }

    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(async () => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&countrycodes=ar`, {
                headers: { "User-Agent": "OnTrack-App" }
            });
            const lugares = await res.json();
            listaSugerencias.innerHTML = "";

            lugares.forEach(lugar => {
                const li = document.createElement("li");
                li.textContent = lugar.display_name;
                li.style.cursor = "pointer";

                li.addEventListener("click", async () => {
                    inputUbicacion.value = lugar.display_name;
                    listaSugerencias.innerHTML = "";

                    const lat = Number(parseFloat(lugar.lat).toFixed(6));
                    const lon = Number(parseFloat(lugar.lon).toFixed(6));
                    const latlng = [lat, lon];

                    replaceMarker(latlng, false);

                    map.setView(latlng, 16);

                    document.getElementById("lat").value = lat;
                    document.getElementById("lon").value = lon;

                    await actualizarProvinciaLocalidad(lat, lon);

                    markerSeleccionado = true;
                });

                listaSugerencias.appendChild(li);
            });
        } catch (err) {
            console.error("Error al buscar lugar:", err);
        }
    }, 300);
});

inputUbicacion.addEventListener("blur", () => {
    setTimeout(() => { listaSugerencias.innerHTML = ""; }, 200);
});


const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('id')) {
    const script = document.createElement('script');
    script.src = '../js/reportes_edicion.js';
    document.body.appendChild(script);
}

document.getElementById("userBtn").addEventListener("click", () => {
    document.getElementById("dropdown").classList.toggle("hidden");
});

window.addEventListener("click", (e) => {
    if (!e.target.closest(".user-menu")) {
        document.getElementById("dropdown").classList.add("hidden");
    }
});