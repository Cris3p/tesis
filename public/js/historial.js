// Configuración de SweetAlert2
const swalConfig = {
  confirmButtonColor: '#5b3ea1',
  cancelButtonColor: '#d62839',
  background: '#1f1c29',
  color: '#e4e6eb',
  iconColor: '#5b3ea1',
  heightAuto: false
};

// Variables globales para el mapa y los datos GeoJSON
let modalMapInstance = null;
let modalMarker = null;
let geoReady = false;
let geoLoadPromise = null;
const idxLocalidadesPorProvincia = new Map();
let provinciasData = null;
let localidadesData = null;

// ------------------- CUSTOM MARKER ICONS -------------------
function crearMarker2Icon() {
    return L.divIcon({
        className: 'custom-marker2',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        html: '<div class="marker2-dot"></div>'
    });
}

// ------------------- GEOJSON UTILITIES -------------------
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

    if (!provinciasData || !localidadesData || typeof turf === 'undefined') {
        console.error("Falta GeoJSON o librería turf.");
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

    return { provincia: provinciaFinal || "Desconocida", localidad: localidad || "Desconocida" };
}

async function actualizarProvinciaLocalidad(lat, lon) {
    const { provincia, localidad } = await obtenerProvinciaYLocalidad(lat, lon);
    document.getElementById("modal_provincia").value = provincia;
    document.getElementById("modal_localidad").value = localidad;
    document.getElementById("modal_lat").value = lat;
    document.getElementById("modal_lon").value = lon;
}

// ------------------- INICIALIZAR MAPA DEL MODAL -------------------
function initializeModalMap(lat, lon, idReporte) {
    if (modalMapInstance) {
        modalMapInstance.remove();
        modalMapInstance = null;
    }

    modalMapInstance = L.map('modalMap').setView([lat, lon], 15);
    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
    }).addTo(modalMapInstance);

    modalMarker = L.marker([lat, lon], { icon: crearMarker2Icon(), draggable: true })
        .addTo(modalMapInstance)
        .bindPopup(`Ubicación de Reporte #${idReporte}`);

    modalMapInstance.on('click', async function (e) {
        const newLat = Number(e.latlng.lat.toFixed(6));
        const newLon = Number(e.latlng.lng.toFixed(6));

        modalMarker.setLatLng(e.latlng);
        modalMarker.setPopupContent(`Nueva ubicación: ${newLat}, ${newLon}`).openPopup();

        await actualizarProvinciaLocalidad(newLat, newLon);
    });

    modalMarker.on('dragend', async function (event) {
        const markerLatLng = modalMarker.getLatLng();
        const newLat = Number(markerLatLng.lat.toFixed(6));
        const newLon = Number(markerLatLng.lng.toFixed(6));

        modalMarker.setPopupContent(`Ubicación arrastrada: ${newLat}, ${newLon}`).openPopup();

        await actualizarProvinciaLocalidad(newLat, newLon);
    });
}

// ------------------- GENERAR PDF DE REPORTE -------------------
async function generarPDFReporte(idReporte) {
    try {
        Swal.fire({
            ...swalConfig,
            title: 'Generando PDF...',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => Swal.showLoading()
        });

        const res = await fetch(`/reportes/${idReporte}`);
        if (!res.ok) throw new Error("Error al obtener reporte");
        const reporte = await res.json();

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const logoImg = new Image();
        logoImg.src = '../img/logo_blanco.png';
        
        await new Promise((resolve, reject) => {
            logoImg.onload = resolve;
            logoImg.onerror = () => {
                console.warn('No se pudo cargar el logo');
                resolve();
            };
        });

        const violetaOscuro = [43, 31, 82];
        const violetaVivo = [91, 62, 161];
        const violetaClaro = [138, 117, 201];

        // Encabezado con logo
        try {
            doc.addImage(logoImg, 'PNG', 15, 10, 25, 25);
        } catch (e) {
            console.warn('Error al agregar logo');
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.setTextColor(...violetaVivo);
        doc.text('OnTrack', 45, 22);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Sistema de Reporte de Incidentes', 45, 28);

        doc.setDrawColor(...violetaVivo);
        doc.setLineWidth(0.5);
        doc.line(15, 38, 195, 38);

        let yPos = 50;

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Reporte #${reporte.ID_reportes}`, 15, yPos);
        doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')}`, 150, yPos);

        yPos += 12;

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...violetaOscuro);
        doc.text('DETALLES DEL INCIDENTE', 15, yPos);

        yPos += 10;

        const fechaObj = new Date(reporte.fecha_hora);
        const fechaFormateada = fechaObj.toLocaleDateString('es-AR');
        const horaFormateada = fechaObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

        // Convertir coordenadas a número de forma segura
        const latNum = parseFloat(reporte.lat) || 0;
        const lonNum = parseFloat(reporte.lon) || 0;

        const infoData = [
            ['Tipo de Incidente', reporte.tipo_crimen || 'No especificado'],
            ['Fecha del Incidente', fechaFormateada],
            ['Hora del Incidente', horaFormateada],
            ['Provincia', reporte.provincia || 'Desconocida'],
            ['Localidad', reporte.localidad || 'Desconocida'],
            ['Coordenadas', `${latNum.toFixed(6)}, ${lonNum.toFixed(6)}`]
        ];

        doc.autoTable({
            startY: yPos,
            head: [],
            body: infoData,
            theme: 'grid',
            styles: {
                fontSize: 10,
                cellPadding: 5,
                lineColor: violetaVivo,
                lineWidth: 0.1
            },
            columnStyles: {
                0: { 
                    fontStyle: 'bold', 
                    fillColor: [245, 245, 250],
                    textColor: violetaOscuro,
                    cellWidth: 50
                },
                1: { 
                    fillColor: [255, 255, 255],
                    textColor: [50, 50, 50]
                }
            },
            margin: { left: 15, right: 15 }
        });

        yPos = doc.lastAutoTable.finalY + 10;

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...violetaOscuro);
        doc.text('CONDICIONES DEL ENTORNO', 15, yPos);

        yPos += 8;

        const condicionesData = [
            ['Iluminación en el lugar', reporte.iluminacion === 1 ? 'Sí' : 'No'],
            ['Presencia de personas', reporte.gente === 1 ? 'Sí' : 'No']
        ];

        doc.autoTable({
            startY: yPos,
            head: [],
            body: condicionesData,
            theme: 'grid',
            styles: {
                fontSize: 10,
                cellPadding: 5,
                lineColor: violetaVivo,
                lineWidth: 0.1
            },
            columnStyles: {
                0: { 
                    fontStyle: 'bold', 
                    fillColor: [245, 245, 250],
                    textColor: violetaOscuro,
                    cellWidth: 50
                },
                1: { 
                    fillColor: [255, 255, 255],
                    textColor: [50, 50, 50]
                }
            },
            margin: { left: 15, right: 15 }
        });

        yPos = doc.lastAutoTable.finalY + 10;

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...violetaOscuro);
        doc.text('DESCRIPCIÓN DEL INCIDENTE', 15, yPos);

        yPos += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
        
        const descripcion = reporte.descripcion || 'Sin descripción';
        const splitDesc = doc.splitTextToSize(descripcion, 165);
        
        doc.text(splitDesc, 15, yPos);
        yPos += splitDesc.length * 6 + 10;

        if (yPos > 240) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...violetaOscuro);
        doc.text('UBICACIÓN DEL INCIDENTE', 15, yPos);

        yPos += 8;

        // Información de coordenadas en tabla
        const ubicacionData = [
            ['Latitud', latNum.toFixed(6)],
            ['Longitud', lonNum.toFixed(6)],
            ['Referencia', 'Ver ubicación en OpenStreetMap.org']
        ];

        doc.autoTable({
            startY: yPos,
            head: [],
            body: ubicacionData,
            theme: 'grid',
            styles: {
                fontSize: 10,
                cellPadding: 5,
                lineColor: violetaVivo,
                lineWidth: 0.1
            },
            columnStyles: {
                0: { 
                    fontStyle: 'bold', 
                    fillColor: [245, 245, 250],
                    textColor: violetaOscuro,
                    cellWidth: 50
                },
                1: { 
                    fillColor: [255, 255, 255],
                    textColor: [50, 50, 50]
                }
            },
            margin: { left: 15, right: 15 }
        });

        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            
            doc.setDrawColor(...violetaClaro);
            doc.setLineWidth(0.3);
            doc.line(15, 280, 195, 280);
            
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text('OnTrack - Sistema de Reporte de Incidentes', 15, 285);
            doc.text(`Página ${i} de ${totalPages}`, 195, 285, { align: 'right' });
            doc.text('Este documento es de carácter informativo', 105, 290, { align: 'center' });
        }

        const nombreArchivo = `OnTrack_Reporte_${reporte.ID_reportes}_${new Date().getTime()}.pdf`;
        doc.save(nombreArchivo);

        Swal.close();

        await Swal.fire({
            ...swalConfig,
            icon: 'success',
            title: 'PDF generado',
            text: 'El reporte se descargó correctamente',
            confirmButtonText: 'Aceptar',
            timer: 2000,
            timerProgressBar: true
        });

    } catch (error) {
        console.error('Error generando PDF:', error);
        Swal.fire({
            ...swalConfig,
            icon: 'error',
            title: 'Error',
            text: 'No se pudo generar el PDF del reporte',
            confirmButtonText: 'Entendido'
        });
    }
}

// ------------------- DOCUMENTO READY -------------------
document.addEventListener("DOMContentLoaded", async () => {
    const idUsuario = Number(localStorage.getItem("usuarioId"));
    
    if (!idUsuario) {
        await Swal.fire({
            ...swalConfig,
            icon: 'warning',
            title: 'Sesión no encontrada',
            text: 'Debes iniciar sesión primero.',
            confirmButtonText: 'Ir a Login'
        });
        window.location.href = '/login';
        return;
    }

    const tbody = document.getElementById("lista-historial");
    const editModal = document.getElementById("editModal");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const modalForm = document.getElementById("editForm");
    const submitBtnModal = document.getElementById("modalSubmitBtn");

    // ------------------- FUNCIÓN CARGAR REPORTES -------------------
    async function cargarReportes() {
        tbody.innerHTML = "<tr><td colspan='5'>Cargando...</td></tr>";

        try {
            const res = await fetch(`/reportes/usuario/${idUsuario}`);
            
            if (!res.ok) throw new Error("Error al obtener reportes");
            const data = await res.json();

            if (!Array.isArray(data) || data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5">No tienes reportes registrados.</td></tr>`;
                return;
            }

            tbody.innerHTML = data.map(r => `
                <tr data-id="${r.ID_reportes}">
                    <td>${r.tipo_crimen}</td>
                    <td>${r.localidad}</td>
                    <td>${new Date(r.fecha_hora).toLocaleString()}</td>
                    <td class="descripcion-celda">${r.descripcion}</td>
                    <td>
                        <button class="btn-pdf" title="Descargar PDF" data-id="${r.ID_reportes}">
                            <img src="../img/descargas.png" alt="Descargar" class="icon-btn-historial" />
                        </button>
                        <button class="btn-editar" title="Editar reporte" data-id="${r.ID_reportes}">
                            <img src="../img/edit.svg" alt="Editar" class="icon-btn-historial" />
                        </button>
                        <button class="btn-eliminar" title="Eliminar reporte" data-id="${r.ID_reportes}">
                            <img src="../img/delete.svg" alt="Eliminar" class="icon-btn-historial" />
                        </button>
                    </td>
                </tr>
            `).join("");

            // ------------------- DESCARGAR PDF -------------------
            document.querySelectorAll(".btn-pdf").forEach(btn => {
                btn.addEventListener("click", (e) => {
                    const id = e.currentTarget.dataset.id;
                    generarPDFReporte(id);
                });
            });

            // ------------------- EDITAR REPORTE -------------------
            document.querySelectorAll(".btn-editar").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    const id = e.currentTarget.dataset.id;

                    Swal.fire({
                        ...swalConfig,
                        title: 'Cargando datos...',
                        allowOutsideClick: false,
                        showConfirmButton: false,
                        didOpen: () => Swal.showLoading()
                    });

                    await ensureGeoReady();

                    try {
                        const res = await fetch(`/reportes/${id}`);
                        if (!res.ok) throw new Error("Error al obtener reporte");
                        const reporteData = await res.json();

                        Swal.close();

                        document.getElementById("modal_id_reporte").value = id;
                        document.getElementById("modal_tipo").value = reporteData.tipo_crimen;
                        document.getElementById("modal_descripcion").value = reporteData.descripcion;
                        document.getElementById("modal_provincia").value = reporteData.provincia;
                        document.getElementById("modal_localidad").value = reporteData.localidad;

                        const dateObj = new Date(reporteData.fecha_hora);
                        document.getElementById('modal_fecha').value = dateObj.toISOString().substring(0, 10);
                        document.getElementById('modal_hora').value = dateObj.toTimeString().substring(0, 5);

                        const iluminacionVal = reporteData.iluminacion == 1 ? 'si' : 'no';
                        document.querySelector(`input[name="modal_iluminacion"][value="${iluminacionVal}"]`).checked = true;
                        const genteVal = reporteData.gente == 1 ? 'si' : 'no';
                        document.querySelector(`input[name="modal_gente"][value="${genteVal}"]`).checked = true;

                        const lat = Number(reporteData.lat || -34.6037);
                        const lon = Number(reporteData.lon || -58.3816);
                        document.getElementById("modal_lat").value = lat;
                        document.getElementById("modal_lon").value = lon;

                        initializeModalMap(lat, lon, id);

                        editModal.classList.remove("hidden");
                        setTimeout(() => {
                            if (modalMapInstance) modalMapInstance.invalidateSize();
                        }, 300);

                    } catch (err) {
                        console.error("Error al cargar datos de edición:", err);
                        Swal.fire({
                            ...swalConfig,
                            icon: 'error',
                            title: 'Error',
                            text: 'No se pudo cargar el reporte para edición.',
                            confirmButtonText: 'Entendido'
                        });
                    }
                });
            });

            // ------------------- ELIMINAR REPORTE -------------------
            document.querySelectorAll(".btn-eliminar").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    const id = e.currentTarget.dataset.id;

                    const result = await Swal.fire({
                        ...swalConfig,
                        icon: 'warning',
                        title: '¿Eliminar reporte?',
                        text: 'Esta acción no se puede deshacer',
                        showCancelButton: true,
                        confirmButtonText: 'Sí, eliminar',
                        cancelButtonText: 'Cancelar',
                        confirmButtonColor: '#d62839',
                        cancelButtonColor: '#5b3ea1',
                        reverseButtons: true
                    });

                    if (!result.isConfirmed) return;

                    Swal.fire({
                        ...swalConfig,
                        title: 'Eliminando...',
                        allowOutsideClick: false,
                        showConfirmButton: false,
                        didOpen: () => Swal.showLoading()
                    });

                    try {
                        const res = await fetch(`/reportes/eliminar/${id}`, { method: "DELETE" });
                        if (!res.ok) throw new Error("Error al eliminar");

                        await Swal.fire({
                            ...swalConfig,
                            icon: 'success',
                            title: 'Reporte eliminado',
                            text: 'El reporte se eliminó correctamente',
                            confirmButtonText: 'Aceptar',
                            timer: 2000,
                            timerProgressBar: true
                        });

                        await cargarReportes();
                    } catch (err) {
                        console.error(err);
                        Swal.fire({
                            ...swalConfig,
                            icon: 'error',
                            title: 'Error',
                            text: 'No se pudo eliminar el reporte.',
                            confirmButtonText: 'Entendido'
                        });
                    }
                });
            });

        } catch (err) {
            console.error('Error al cargar reportes:', err);
            tbody.innerHTML = `<tr><td colspan="5">Error al cargar los reportes.</td></tr>`;
        }
    }

    // ------------------- CERRAR MODAL -------------------
    closeModalBtn.addEventListener("click", () => {
        editModal.classList.add("hidden");
    });

    // ------------------- SUBMIT MODAL -------------------
    modalForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const id = document.getElementById("modal_id_reporte").value;

        const datos = {
            tipo_crimen: document.getElementById('modal_tipo').value,
            descripcion: document.getElementById('modal_descripcion').value,
            lat: parseFloat(document.getElementById('modal_lat').value),
            lon: parseFloat(document.getElementById('modal_lon').value),
            fecha_hora: `${document.getElementById('modal_fecha').value} ${document.getElementById('modal_hora').value}`,
            provincia: document.getElementById('modal_provincia').value,
            localidad: document.getElementById('modal_localidad').value,
            iluminacion: document.querySelector('input[name="modal_iluminacion"]:checked')?.value === 'si' ? 1 : 0,
            gente: document.querySelector('input[name="modal_gente"]:checked')?.value === 'si' ? 1 : 0
        };

        submitBtnModal.textContent = 'Actualizando...';
        submitBtnModal.disabled = true;

        try {
            const res = await fetch(`/reportes/actualizar/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datos)
            });

            if (!res.ok) throw new Error("Error en la respuesta del servidor.");

            await Swal.fire({
                ...swalConfig,
                icon: 'success',
                title: 'Reporte actualizado',
                text: 'Los cambios se guardaron correctamente',
                confirmButtonText: 'Aceptar',
                timer: 2000,
                timerProgressBar: true
            });

            editModal.classList.add("hidden");
            await cargarReportes();

        } catch (err) {
            console.error('Error al actualizar:', err);
            Swal.fire({
                ...swalConfig,
                icon: 'error',
                title: 'Error',
                text: 'No se pudo actualizar el reporte: ' + err.message,
                confirmButtonText: 'Entendido'
            });
        } finally {
            submitBtnModal.textContent = 'Actualizar';
            submitBtnModal.disabled = false;
        }
    });

    cargarReportes();
        
    // ------------------- BOTÓN VOLVER -------------------
    const btnVolver = document.getElementById("btnVolver");
    if (btnVolver) {
        btnVolver.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = '/perfil';
        });
    }
    
    // menú usuario
    document.getElementById("userBtn").addEventListener("click", () => {
      document.getElementById("dropdown").classList.toggle("hidden");
    });
    window.addEventListener("click", (e) => {
      if (!e.target.closest(".user-menu")) {
        document.getElementById("dropdown").classList.add("hidden");
      }
    });
});