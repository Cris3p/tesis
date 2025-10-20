//-----------------------CRUD--------------------------------//

// Configuración de SweetAlert2
const swalConfig = {
  confirmButtonColor: '#5b3ea1',
  cancelButtonColor: '#d62839',
  background: '#1f1c29',
  color: '#e4e6eb',
  iconColor: '#5b3ea1',
  heightAuto: false
};

document.addEventListener("DOMContentLoaded", () => {
  const idUsuario = Number(localStorage.getItem('usuarioId'));

  if (!idUsuario) {
    Swal.fire({
      ...swalConfig,
      icon: 'warning',
      title: 'Sesión no encontrada',
      text: 'No se encontró el usuario. Por favor, iniciá sesión primero.',
      confirmButtonText: 'Ir a Login'
    }).then(() => {
      window.location.href = 'login';
    });
    return;
  }

  // CRUD actualizar usuario
  document.getElementById("actualizar-Usuario-Form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const idUsuario = localStorage.getItem('usuarioId');
    const nuevoUsuario = document.getElementById("usuario").value;

    const result = await Swal.fire({
      ...swalConfig,
      icon: 'question',
      title: '¿Cambiar nombre de usuario?',
      text: `Tu nuevo nombre de usuario será: ${nuevoUsuario}`,
      showCancelButton: true,
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch("/usuarios/actualizarUsuario", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: idUsuario, nuevoUsuario }),
      });

      const data = await res.json();
      if (res.ok) {
        await Swal.fire({
          ...swalConfig,
          icon: 'success',
          title: '¡Usuario actualizado!',
          text: 'Tu nombre de usuario ha sido cambiado exitosamente',
          confirmButtonText: 'Aceptar'
        });
        document.getElementById("usuario").value = '';
      } else {
        Swal.fire({
          ...swalConfig,
          icon: 'error',
          title: 'Error al actualizar',
          text: data.error || 'No se pudo actualizar el nombre de usuario',
          confirmButtonText: 'Entendido'
        });
      }
    } catch (err) {
      Swal.fire({
        ...swalConfig,
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor',
        confirmButtonText: 'Entendido'
      });
    }
  });

  // CRUD actualizar contraseña
  document.getElementById("actualizar-Password-Form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const idUsuario = Number(localStorage.getItem('usuarioId'));
    const nueva = document.getElementById("nueva-password").value;
    const confirmar = document.getElementById("confirmar-password").value;

    if (nueva !== confirmar) {
      Swal.fire({
        ...swalConfig,
        icon: 'error',
        title: 'Contraseñas no coinciden',
        text: 'La nueva contraseña y la confirmación deben ser iguales',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    if (nueva.length < 6) {
      Swal.fire({
        ...swalConfig,
        icon: 'warning',
        title: 'Contraseña muy corta',
        text: 'La contraseña debe tener al menos 6 caracteres',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const result = await Swal.fire({
      ...swalConfig,
      icon: 'question',
      title: '¿Cambiar contraseña?',
      text: 'Se actualizará tu contraseña',
      showCancelButton: true,
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch("/usuarios/actualizarPassword", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: idUsuario, nuevaPassword: nueva }),
      });

      const data = await res.json();
      if (res.ok) {
        await Swal.fire({
          ...swalConfig,
          icon: 'success',
          title: '¡Contraseña actualizada!',
          text: 'Tu contraseña ha sido cambiada exitosamente',
          confirmButtonText: 'Aceptar'
        });
        document.getElementById("actualizar-Password-Form").reset();
      } else {
        Swal.fire({
          ...swalConfig,
          icon: 'error',
          title: 'Error al actualizar',
          text: data.error || 'No se pudo actualizar la contraseña',
          confirmButtonText: 'Entendido'
        });
      }
    } catch (err) {
      Swal.fire({
        ...swalConfig,
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor',
        confirmButtonText: 'Entendido'
      });
    }
  });

  // CRUD eliminar cuenta
  document.getElementById("borrar-Cuenta-Form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const idUsuario = Number(localStorage.getItem('usuarioId'));

    const result = await Swal.fire({
      ...swalConfig,
      icon: 'warning',
      title: '⚠️ ¿Eliminar cuenta permanentemente?',
      html: `
        <p style="margin-bottom: 15px;">Esta acción es <strong>irreversible</strong>.</p>
        <p style="color: #d62839; font-weight: 600;">Se eliminarán todos tus datos, reportes y contactos.</p>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar definitivamente',
      cancelButtonText: 'No, conservar mi cuenta',
      confirmButtonColor: '#d62839',
      cancelButtonColor: '#5b3ea1',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    const confirmacion = await Swal.fire({
      ...swalConfig,
      icon: 'error',
      title: '¿Estás completamente seguro/a?',
      text: 'Esta es tu última oportunidad para cancelar',
      showCancelButton: true,
      confirmButtonText: 'Eliminar mi cuenta',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d62839',
      cancelButtonColor: '#5b3ea1',
      reverseButtons: true
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const res = await fetch("/usuarios/eliminar", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: idUsuario }),
      });

      const data = await res.json();
      if (res.ok) {
        await Swal.fire({
          ...swalConfig,
          icon: 'success',
          title: 'Cuenta eliminada',
          text: 'Tu cuenta ha sido eliminada exitosamente',
          confirmButtonText: 'Aceptar',
          allowOutsideClick: false
        });
        localStorage.clear();
        window.location.href = 'registro';
      } else {
        Swal.fire({
          ...swalConfig,
          icon: 'error',
          title: 'Error al eliminar',
          text: data.error || 'No se pudo eliminar la cuenta',
          confirmButtonText: 'Entendido'
        });
      }
    } catch (err) {
      Swal.fire({
        ...swalConfig,
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor',
        confirmButtonText: 'Entendido'
      });
    }
  });

  //-------------------CONTACTOS------------------------------------//
  const form = document.getElementById("contacto-emergencia-form");
  const inputNombre = document.getElementById("nombre-input");
  const inputContacto = document.getElementById("contacto-input");
  const listaContactos = document.getElementById("lista-contactos");

  async function cargarContactos() {
    try {
      const res = await fetch(`/contactos/${idUsuario}`);
      const data = await res.json();
      console.log("Datos recibidos:", data);

      if (!res.ok) {
        Swal.fire({
          ...swalConfig,
          icon: 'error',
          title: 'Error al cargar contactos',
          text: data.error || 'No se pudieron cargar los contactos',
          confirmButtonText: 'Entendido'
        });
        return;
      }

      // Verificar si no hay contactos
      if (!data || data.length === 0) {
        listaContactos.innerHTML = `
          <div class="sin-contactos">
            <p>Aún no tenés contactos designados</p>
          </div>
        `;
        console.log("No hay contactos cargados");
        return;
      }

      listaContactos.innerHTML = data
        .map((c) => {
          const nombre = String(c.nombre || '').replace(/"/g, '&quot;');
          const contacto = String(c.contacto || '').replace(/"/g, '&quot;');
          return `
          <div data-id="${c.ID_contactos}" class="contacto-item">
            <div class="contacto-info">
              <span class="contacto-nombre">${c.nombre || 'Sin nombre'}</span>
              <span class="contacto-telefono">${c.contacto}</span>
            </div>
            <div class="contacto-acciones">
              <button class="btn-editar" data-id="${c.ID_contactos}" data-nombre="${nombre}" data-contacto="${contacto}">Editar</button>
              <button class="btn-eliminar" data-id="${c.ID_contactos}">Eliminar</button>
            </div>
          </div>
        `;
        })
        .join("");

      console.log("Contactos cargados, HTML actualizado");
    } catch (err) {
      Swal.fire({
        ...swalConfig,
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor al cargar contactos',
        confirmButtonText: 'Entendido'
      });
      console.error(err);
    }
  }

  // Agregar contacto
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = inputNombre.value.trim();
    const contacto = inputContacto.value.trim();

    if (!nombre) {
      Swal.fire({
        ...swalConfig,
        icon: 'warning',
        title: 'Nombre requerido',
        text: 'Por favor, ingresá un nombre para el contacto',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    if (!contacto) {
      Swal.fire({
        ...swalConfig,
        icon: 'warning',
        title: 'Número inválido',
        text: 'Por favor, ingresá un número de contacto válido',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    try {
      const res = await fetch("/contactos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_usuario: idUsuario, contacto, nombre }),
      });

      const data = await res.json();

      if (!res.ok) {
        Swal.fire({
          ...swalConfig,
          icon: 'error',
          title: 'Error al guardar',
          text: data.error || 'No se pudo guardar el contacto',
          confirmButtonText: 'Entendido'
        });
        return;
      }

      await Swal.fire({
        ...swalConfig,
        icon: 'success',
        title: '¡Contacto guardado!',
        text: 'El contacto de emergencia se guardó exitosamente',
        confirmButtonText: 'Aceptar',
        timer: 2000,
        timerProgressBar: true
      });
      inputNombre.value = "";
      inputContacto.value = "";
      cargarContactos();
    } catch (err) {
      Swal.fire({
        ...swalConfig,
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor al guardar el contacto',
        confirmButtonText: 'Entendido'
      });
      console.error(err);
    }
  });

  // Event delegation para botones de editar y eliminar
  listaContactos.addEventListener("click", async (e) => {
    console.log("Click detectado en:", e.target);

    // Botón EDITAR
    if (e.target.classList.contains("btn-editar")) {
      console.log("Botón editar clickeado");
      const idContacto = e.target.getAttribute("data-id");
      const nombreActual = e.target.getAttribute("data-nombre");
      const contactoActual = e.target.getAttribute("data-contacto");

      console.log("Datos a editar:", { idContacto, nombreActual, contactoActual });

      const { value: formValues } = await Swal.fire({
        ...swalConfig,
        title: 'Editar Contacto',
        html: `
          <input id="swal-nombre" class="swal2-input" placeholder="Nombre" value="${nombreActual}">
          <input id="swal-contacto" class="swal2-input" placeholder="Número de teléfono" value="${contactoActual}">
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Guardar cambios',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
          const nombre = document.getElementById('swal-nombre').value.trim();
          const contacto = document.getElementById('swal-contacto').value.trim();

          if (!nombre || !contacto) {
            Swal.showValidationMessage('Ambos campos son obligatorios');
            return false;
          }

          return { nombre, contacto };
        }
      });

      if (formValues) {
        try {
          const res = await fetch(`/contactos/actualizar/${idContacto}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nombre: formValues.nombre,
              contacto: formValues.contacto
            }),
          });

          const data = await res.json();

          if (res.ok) {
            await Swal.fire({
              ...swalConfig,
              icon: 'success',
              title: 'Contacto actualizado',
              text: 'Los cambios se guardaron exitosamente',
              confirmButtonText: 'Aceptar',
              timer: 2000,
              timerProgressBar: true
            });
            cargarContactos();
          } else {
            Swal.fire({
              ...swalConfig,
              icon: 'error',
              title: 'Error al actualizar',
              text: data.error || 'No se pudo actualizar el contacto',
              confirmButtonText: 'Entendido'
            });
          }
        } catch (err) {
          Swal.fire({
            ...swalConfig,
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo conectar con el servidor al actualizar el contacto',
            confirmButtonText: 'Entendido'
          });
          console.error(err);
        }
      }
    }

    // Botón ELIMINAR
    if (e.target.classList.contains("btn-eliminar")) {
      console.log("Botón eliminar clickeado");
      const idContacto = e.target.getAttribute("data-id");

      const result = await Swal.fire({
        ...swalConfig,
        icon: 'question',
        title: '¿Eliminar contacto?',
        text: '¿Querés eliminar este contacto de emergencia?',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (!result.isConfirmed) return;

      try {
        const res = await fetch(`/contactos/eliminar/${idContacto}`, {
          method: "DELETE",
        });
        const data = await res.json();

        if (res.ok) {
          await Swal.fire({
            ...swalConfig,
            icon: 'success',
            title: 'Contacto eliminado',
            text: 'El contacto se eliminó exitosamente',
            confirmButtonText: 'Aceptar',
            timer: 2000,
            timerProgressBar: true
          });
          cargarContactos();
        } else {
          Swal.fire({
            ...swalConfig,
            icon: 'error',
            title: 'Error al eliminar',
            text: data.error || 'No se pudo eliminar el contacto',
            confirmButtonText: 'Entendido'
          });
        }
      } catch (err) {
        Swal.fire({
          ...swalConfig,
          icon: 'error',
          title: 'Error de conexión',
          text: 'No se pudo conectar con el servidor al eliminar el contacto',
          confirmButtonText: 'Entendido'
        });
        console.error(err);
      }
    }
  });

  // Cargar contactos al iniciar
  cargarContactos();

  // Cerrar sesión
  document.getElementById('logoutBtn').addEventListener('click', async (e) => {
    e.preventDefault();

    const result = await Swal.fire({
      ...swalConfig,
      icon: 'question',
      title: '¿Cerrar sesión?',
      text: '¿Querés salir de tu cuenta?',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

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

        localStorage.removeItem('usuarioId');

        await Swal.fire({
          ...swalConfig,
          icon: 'success',
          title: 'Sesión cerrada',
          text: 'Hasta pronto',
          confirmButtonText: 'Aceptar',
          timer: 1500,
          timerProgressBar: true,
          allowOutsideClick: false
        });

        window.location.href = 'login';
      } else {
        const err = await res.json();
        Swal.fire({
          ...swalConfig,
          icon: 'error',
          title: 'Error al cerrar sesión',
          text: err.error || 'No se pudo cerrar la sesión',
          confirmButtonText: 'Entendido'
        });
      }
    } catch (error) {
      console.error('Error detallado:', error);
      Swal.fire({
        ...swalConfig,
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor para cerrar sesión',
        confirmButtonText: 'Entendido'
      });
    }
  });

  // Dropdown menu
  document.getElementById("userBtn").addEventListener("click", () => {
    document.getElementById("dropdown").classList.toggle("hidden");
  });

  window.addEventListener("click", (e) => {
    if (!e.target.closest(".user-menu")) {
      document.getElementById("dropdown").classList.add("hidden");
    }
  });

  // Sistema de pestañas
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(targetTab).classList.add('active');
    });
  });

  // Toggle Zona Peligrosa
  document.getElementById('toggleZonaPeligrosa').addEventListener('click', () => {
    const content = document.getElementById('zonaPeligrosaContent');
    const toggle = document.getElementById('toggleZonaPeligrosa');

    content.classList.toggle('open');
    toggle.classList.toggle('open');
  });
});