document.addEventListener('DOMContentLoaded', () => {
  // Configuración global de SweetAlert2
  const swalConfig = {
    confirmButtonColor: '#5b3ea1',
    background: '#1e202c',
    color: '#e4e6eb',
    iconColor: '#60519b',
    heightAuto: false
  };

  // Verificar token en la URL
  const params = new URLSearchParams(location.search);
  const token = params.get('token');
  
  if (token) {
    document.getElementById('resetToken').value = token;
  } else {
    Swal.fire({
      ...swalConfig,
      icon: 'error',
      title: 'Token inválido',
      text: 'Token inválido o expirado. Por favor, solicita un nuevo restablecimiento.',
      confirmButtonText: 'Ir al login'
    }).then(() => {
      location.href = '/html/login.html';
    });
    return;
  }

  // Toggle visibilidad contraseña nueva
  const pass = document.getElementById('newPssw');
  const icon = document.getElementById('TpL');

  icon.addEventListener('click', () => {
    if (pass.type === "password") {
      pass.type = "text";
      icon.classList.remove("bxs-lock-alt");
      icon.classList.add("bxs-lock-open");
    } else {
      pass.type = "password";
      icon.classList.remove("bxs-lock-open");
      icon.classList.add("bxs-lock-alt");
    }
  });

  // Toggle visibilidad confirmar contraseña
  const passConfir = document.getElementById('ConPssw');
  const iconConfir = document.getElementById('ConfPssw');

  iconConfir.addEventListener('click', () => {
    if (passConfir.type === "password") {
      passConfir.type = "text";
      iconConfir.classList.remove("bxs-lock-alt");
      iconConfir.classList.add("bxs-lock-open");
    } else {
      passConfir.type = "password";
      iconConfir.classList.remove("bxs-lock-open");
      iconConfir.classList.add("bxs-lock-alt");
    }
  });

  // Submit del formulario
  document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = document.getElementById('resetToken').value;
    const newPass = document.getElementById('newPssw').value.trim();
    const confirmPass = document.getElementById('ConPssw').value.trim();

    // Validaciones
    if (!newPass || !confirmPass) {
      Swal.fire({
        ...swalConfig,
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor, completa todos los campos'
      });
      return;
    }

    if (newPass !== confirmPass) {
      Swal.fire({
        ...swalConfig,
        icon: 'error',
        title: 'Contraseñas no coinciden',
        text: 'Las contraseñas ingresadas no son iguales'
      });
      return;
    }

    if (newPass.length < 6) {
      Swal.fire({
        ...swalConfig,
        icon: 'warning',
        title: 'Contraseña muy corta',
        text: 'La contraseña debe tener al menos 6 caracteres'
      });
      return;
    }

    try {
      // Mostrar loading
      Swal.fire({
        ...swalConfig,
        title: 'Restableciendo contraseña...',
        html: 'Por favor espera un momento.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const res = await fetch("/usuarios/Cambiarpssw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, nuevaPassword: newPass }),
      });

      Swal.close();

      if (res.ok) {
        Swal.fire({
          ...swalConfig,
          icon: 'success',
          title: '¡Contraseña restablecida!',
          text: 'Tu contraseña ha sido actualizada con éxito. Ya puedes iniciar sesión.',
          confirmButtonText: 'Ir al login'
        }).then(() => {
          location.href = '/html/login.html';
        });
      } else {
        const err = await res.json();
        Swal.fire({
          ...swalConfig,
          icon: 'error',
          title: 'Error al restablecer',
          text: err.error || `Error al restablecer la contraseña (código: ${res.status})`
        });
      }
    } catch (error) {
      console.error('Error detallado:', error);
      Swal.close();
      Swal.fire({
        ...swalConfig,
        icon: 'error',
        title: 'Error de conexión',
        text: `No se pudo conectar con el servidor: ${error.message}`
      });
    }
  });
});