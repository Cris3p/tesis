document.addEventListener('DOMContentLoaded', function () {
  const formulario = document.querySelector('.formulario-contacto');

  formulario.addEventListener('submit', async function (e) {
    e.preventDefault();

    const nombre = document.querySelector('input[placeholder="Nombre"]').value;
    const email = document.querySelector('input[placeholder="Email"]').value;
    const asunto = document.querySelector('input[placeholder="Asunto"]').value;
    const mensaje = document.querySelector('textarea[placeholder="Mensaje"]').value;

    // Validaciones básicas
    if (!nombre || !email || !asunto || !mensaje) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor, completa todos los campos.',
        confirmButtonColor: 'var(--violeta-principal)',
        background: 'var(--negro-secundario)',
        color: 'var(--texto)',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Swal.fire({
        icon: 'error',
        title: 'Email inválido',
        text: 'Por favor, ingresa un email válido.',
        confirmButtonColor: 'var(--violeta-principal)',
        background: 'var(--negro-secundario)',
        color: 'var(--texto)',
      });
      return;
    }

    try {
      Swal.fire({
        title: 'Enviando...',
        html: 'Por favor espera un momento.',
        background: 'var(--negro-secundario)',
        color: 'var(--texto)',
        allowOutsideClick: false,
        didOpen: async () => {
          Swal.showLoading();

          const response = await fetch('https://tesis-f5ik.onrender.com/contacto', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email, asunto, mensaje }),
          });

          Swal.close();

          if (response.ok) {
            Swal.fire({
              icon: 'success',
              title: '¡Mensaje enviado!',
              text: 'Gracias por contactarte con nosotros. Te responderemos pronto.',
              confirmButtonColor: 'var(--violeta-vivo)',
              background: 'var(--negro-secundario)',
              color: 'var(--texto)',
              iconColor: 'var(--violeta-vivo)',
              customClass: {
                popup: 'swal-ontrack'
              }
            });
            formulario.reset();
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error al enviar',
              text: 'Hubo un problema. Intenta más tarde.',
              confirmButtonColor: 'var(--violeta-vivo)',
              background: 'var(--negro-secundario)',
              color: 'var(--texto)',
              iconColor: 'var(--violeta-vivo)',
            });
          }
        }
      });
    } catch (error) {
      Swal.close();
      Swal.fire({
        title: 'Error inesperado',
        text: 'Ocurrió un problema. Por favor, intenta de nuevo más tarde.',
        icon: 'error',
        confirmButtonText: 'Reintentar',
        confirmButtonColor: 'var(--violeta-vivo)',
        background: 'var(--negro-secundario)',
        color: 'var(--texto)',
        iconColor: 'var(--violeta-vivo)',
      });
    }
  });
});
