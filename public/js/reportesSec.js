// Configuración de SweetAlert2
const swalConfig = {
  confirmButtonColor: '#5b3ea1',
  cancelButtonColor: '#d62839',
  background: '#1f1c29',
  color: '#e4e6eb',
  iconColor: '#5b3ea1',
  heightAuto: false
};

// Función para cargar reportes del usuario
async function cargarMisReportes() {
  const idUsuario = localStorage.getItem('usuarioId');
  
  if (!idUsuario) {
    await Swal.fire({
      ...swalConfig,
      icon: 'error',
      title: 'Error',
      text: 'No se encontró el usuario. Por favor, iniciá sesión.',
      confirmButtonText: 'Entendido'
    });
    return;
  }

  // Mostrar loading
  Swal.fire({
    ...swalConfig,
    title: 'Cargando tus reportes...',
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  try {
    const res = await fetch(`/reportes/usuario/${idUsuario}`);
    
    if (!res.ok) {
      throw new Error("No se pudieron cargar los reportes");
    }

    const reportes = await res.json();
    Swal.close();

    if (reportes.length === 0) {
      await Swal.fire({
        ...swalConfig,
        icon: 'info',
        title: 'Sin reportes',
        text: 'Aún no has realizado ningún reporte',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    mostrarReportes(reportes);

  } catch (err) {
    console.error(err);
    await Swal.fire({
      ...swalConfig,
      icon: 'error',
      title: 'Error al cargar reportes',
      text: 'No se pudieron cargar tus reportes. Por favor, intentá nuevamente.',
      confirmButtonText: 'Entendido'
    });
  }
}

// Función para mostrar reportes con botones de editar/eliminar
function mostrarReportes(reportes) {
  const container = document.getElementById("reportes-container");
  container.innerHTML = '';

  reportes.forEach(reporte => {
    const div = document.createElement("div");
    div.classList.add("reporte");
    div.setAttribute('data-id', reporte.ID_reportes);

    const fecha = new Date(reporte.fecha_hora);
    const fechaFormateada = fecha.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const horaFormateada = fecha.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const iconosCrimen = {
      'robo': '🚨',
      'vandalismo': '🔨',
      'asalto': '⚠️',
      'hurto': '👜',
      'otro': '📍'
    };

    const icono = iconosCrimen[reporte.tipo_crimen.toLowerCase()] || iconosCrimen['otro'];

    div.innerHTML = `
      <div class="reporte-header">
        <span class="reporte-icono">${icono}</span>
        <h3>${reporte.tipo_crimen}</h3>
      </div>
      <div class="reporte-info">
        <p><strong>📍 Ubicación:</strong> ${reporte.localidad}, ${reporte.provincia}</p>
        <p><strong>📅 Fecha:</strong> ${fechaFormateada}</p>
        <p><strong>🕐 Hora:</strong> ${horaFormateada}</p>
        <p class="descripcion"><strong>📝 Descripción:</strong> ${reporte.descripcion}</p>
      </div>
      <div class="reporte-footer">
        <span class="badge ${reporte.iluminacion ? 'badge-si' : 'badge-no'}">
          ${reporte.iluminacion ? '💡 Con iluminación' : '🌑 Sin iluminación'}
        </span>
        <span class="badge ${reporte.gente ? 'badge-si' : 'badge-no'}">
          ${reporte.gente ? '👥 Con gente' : '🚶 Sin gente'}
        </span>
      </div>
      <div class="reporte-acciones">
        <button class="btn-editar" onclick="editarReporte(${reporte.ID_reportes})">
          ✏️ Editar
        </button>
        <button class="btn-eliminar" onclick="eliminarReporte(${reporte.ID_reportes})">
          🗑️ Eliminar
        </button>
      </div>
    `;

    container.appendChild(div);
  });
}

// Función para eliminar reporte
async function eliminarReporte(idReporte) {
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

  // Mostrar loading
  Swal.fire({
    ...swalConfig,
    title: 'Eliminando...',
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  try {
    const res = await fetch(`/reportes/eliminar/${idReporte}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Error al eliminar');
    }

    await Swal.fire({
      ...swalConfig,
      icon: 'success',
      title: 'Reporte eliminado',
      text: 'El reporte se eliminó correctamente',
      confirmButtonText: 'Aceptar',
      timer: 2000,
      timerProgressBar: true
    });

    // Recargar reportes
    cargarMisReportes();

  } catch (err) {
    console.error(err);
    await Swal.fire({
      ...swalConfig,
      icon: 'error',
      title: 'Error al eliminar',
      text: err.message || 'No se pudo eliminar el reporte',
      confirmButtonText: 'Entendido'
    });
  }
}

// Función para editar reporte
async function editarReporte(idReporte) {
  // Mostrar loading
  Swal.fire({
    ...swalConfig,
    title: 'Cargando datos...',
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  try {
    // Obtener datos del reporte
    const res = await fetch(`/reportes/${idReporte}`);
    
    if (!res.ok) {
      throw new Error('No se pudo cargar el reporte');
    }

    const reporte = await res.json();
    
    // Formatear la fecha para el input datetime-local
    const fecha = new Date(reporte.fecha_hora);
    const fechaISO = fecha.toISOString().slice(0, 16);

    const { value: formValues } = await Swal.fire({
      ...swalConfig,
      title: 'Editar Reporte',
      html: `
        <div style="text-align: left; padding: 10px;">
          <label style="display: block; margin-bottom: 5px; color: #e4e6eb;">Tipo de crimen:</label>
          <select id="swal-tipo" class="swal2-input" style="width: 100%;">
            <option value="robo" ${reporte.tipo_crimen === 'robo' ? 'selected' : ''}>Robo</option>
            <option value="vandalismo" ${reporte.tipo_crimen === 'vandalismo' ? 'selected' : ''}>Vandalismo</option>
            <option value="asalto" ${reporte.tipo_crimen === 'asalto' ? 'selected' : ''}>Asalto</option>
            <option value="hurto" ${reporte.tipo_crimen === 'hurto' ? 'selected' : ''}>Hurto</option>
            <option value="otro" ${reporte.tipo_crimen === 'otro' ? 'selected' : ''}>Otro</option>
          </select>

          <label style="display: block; margin-top: 10px; margin-bottom: 5px; color: #e4e6eb;">Descripción:</label>
          <textarea id="swal-descripcion" class="swal2-textarea" style="width: 100%;" rows="3">${reporte.descripcion}</textarea>

          <label style="display: block; margin-top: 10px; margin-bottom: 5px; color: #e4e6eb;">Fecha y hora:</label>
          <input id="swal-fecha" type="datetime-local" class="swal2-input" value="${fechaISO}" style="width: 100%;">

          <label style="display: block; margin-top: 10px; margin-bottom: 5px; color: #e4e6eb;">Provincia:</label>
          <input id="swal-provincia" type="text" class="swal2-input" value="${reporte.provincia}" style="width: 100%;">

          <label style="display: block; margin-top: 10px; margin-bottom: 5px; color: #e4e6eb;">Localidad:</label>
          <input id="swal-localidad" type="text" class="swal2-input" value="${reporte.localidad}" style="width: 100%;">

          <div style="display: flex; gap: 20px; margin-top: 15px;">
            <label style="color: #e4e6eb;">
              <input id="swal-iluminacion" type="checkbox" ${reporte.iluminacion ? 'checked' : ''}>
              Había iluminación
            </label>
            <label style="color: #e4e6eb;">
              <input id="swal-gente" type="checkbox" ${reporte.gente ? 'checked' : ''}>
              Había gente
            </label>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar cambios',
      cancelButtonText: 'Cancelar',
      width: '600px',
      preConfirm: () => {
        const tipo = document.getElementById('swal-tipo').value;
        const descripcion = document.getElementById('swal-descripcion').value;
        const fecha = document.getElementById('swal-fecha').value;
        const provincia = document.getElementById('swal-provincia').value;
        const localidad = document.getElementById('swal-localidad').value;
        const iluminacion = document.getElementById('swal-iluminacion').checked;
        const gente = document.getElementById('swal-gente').checked;

        if (!tipo || !descripcion || !fecha || !provincia || !localidad) {
          Swal.showValidationMessage('Por favor, completá todos los campos');
          return false;
        }

        return { tipo, descripcion, fecha, provincia, localidad, iluminacion, gente };
      }
    });

    if (!formValues) return;

    // Mostrar loading
    Swal.fire({
      ...swalConfig,
      title: 'Guardando cambios...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Actualizar reporte
    const updateRes = await fetch(`/reportes/actualizar/${idReporte}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tipo_crimen: formValues.tipo,
        descripcion: formValues.descripcion,
        fecha_hora: formValues.fecha,
        provincia: formValues.provincia,
        localidad: formValues.localidad,
        iluminacion: formValues.iluminacion ? 1 : 0,
        gente: formValues.gente ? 1 : 0,
        lat: reporte.lat,
        lon: reporte.lon
      })
    });

    const updateData = await updateRes.json();

    if (!updateRes.ok) {
      throw new Error(updateData.error || 'Error al actualizar');
    }

    await Swal.fire({
      ...swalConfig,
      icon: 'success',
      title: 'Reporte actualizado',
      text: 'Los cambios se guardaron correctamente',
      confirmButtonText: 'Aceptar',
      timer: 2000,
      timerProgressBar: true
    });

    // Recargar reportes
    cargarMisReportes();

  } catch (err) {
    console.error(err);
    await Swal.fire({
      ...swalConfig,
      icon: 'error',
      title: 'Error',
      text: err.message || 'No se pudo editar el reporte',
      confirmButtonText: 'Entendido'
    });
  }
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', cargarMisReportes);