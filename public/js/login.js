document.addEventListener('DOMContentLoaded', () => {
  // Configuración global de SweetAlert2
  const swalConfig = {
    confirmButtonColor: '#5b3ea1',
    background: '#1e202c',
    color: '#e4e6eb',
    iconColor: '#60519b',
    heightAuto: false
  };

  // Verificar si la cuenta fue verificada
  const params = new URLSearchParams(window.location.search);
  if (params.get('verificado') === 'true') {
    Swal.fire({
      ...swalConfig,
      icon: 'success',
      title: '¡Cuenta verificada!',
      text: 'Ya puedes iniciar sesión.'
    });
  }

  // Login form
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = document.getElementById('loginForm');
    const data = {
      usuario: form.usuario.value.trim(),
      password: form.password.value.trim()
    };

    if (!data.usuario || !data.password) {
      Swal.fire({
        ...swalConfig,
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor, completa todos los campos'
      });
      return;
    }

    try {
      console.log('Enviando solicitud a:', 'https://tesis-f5ik.onrender.com/usuarios/login');
      console.log('Datos enviados:', JSON.stringify(data));
      
      const res = await fetch('https://tesis-f5ik.onrender.com/usuarios/solicitud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        const datos = await res.json();
        console.log('Respuesta del servidor:', datos);
        localStorage.setItem('usuarioId', datos.usuario.id);
        
        Swal.fire({
          ...swalConfig,
          icon: 'success',
          title: '¡Bienvenido!',
          text: 'Iniciando sesión...',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          window.location.href = '/inicio';
        });
      } else {
        const err = await res.json();
        console.error('Error del servidor:', err);
        Swal.fire({
          ...swalConfig,
          icon: 'error',
          title: 'Error al iniciar sesión',
          text: err.error || `Error (código: ${res.status})`
        });
      }
    } catch (error) {
      console.error('Error detallado:', error);
      Swal.fire({
        ...swalConfig,
        icon: 'error',
        title: 'Error de conexión',
        text: `No se pudo conectar con el servidor: ${error.message}`
      });
    }
  });

  // Visibilidad de contraseña
  const pass = document.getElementById('PsswLogin');
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

  // Modal para restablecer contraseña
  const Modal = document.getElementById("Modal");
  const openBtn = document.getElementById("olvide");
  const closeBtn = document.querySelector(".close");

  openBtn.onclick = () => { Modal.style.display = "block"; }
  closeBtn.onclick = () => { Modal.style.display = "none"; }
  window.onclick = (e) => { if (e.target === Modal) Modal.style.display = "none"; }

  // Enviar correo de restablecimiento
  document.getElementById("enviar").addEventListener("click", async () => {
    const email = document.getElementById("Email").value;
    
    if (!email) {
      Swal.fire({
        ...swalConfig,
        icon: 'warning',
        title: 'Campo vacío',
        text: 'Por favor ingresa tu correo.'
      });
      return;
    }

    try {
      const res = await fetch(
        "https://tesis-f5ik.onrender.com/usuarios/solicitud",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        Modal.style.display = "none";
        Swal.fire({
          ...swalConfig,
          icon: 'success',
          title: '¡Correo enviado!',
          text: data.msg || 'Revisa tu correo para continuar con el restablecimiento.'
        });
      } else {
        const err = await res.json();
        Swal.fire({
          ...swalConfig,
          icon: 'error',
          title: 'Error',
          text: err.error || 'Error al enviar el correo de restablecimiento.'
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        ...swalConfig,
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo enviar el correo, intenta más tarde.'
      });
    }
  });
});