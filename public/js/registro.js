document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('idForm');
  const selectLocalidad = document.getElementById('localidad'); 

  Swal.mixin({
    confirmButtonColor: 'var(--violeta-vivo)',
    background: 'var(--negro-tres)',
    color: 'var(--texto)',
    iconColor: 'var(--violeta-vivo)',
    heightAuto: false
  }); 

  // FUNCIÓN ACTUALIZADA PARA CARGAR CIUDADES/LOCALIDADES
  async function cargarLocalidades() {
      try {
          // Usamos la ruta corregida del paso anterior
          const response = await fetch(
            "https://tesis-f5ik.onrender.com/data/localidades.geojson"
          ); 
          const data = await response.json();
          
          const localidadesUnicas = new Set();
          
          data.features.forEach(feature => {
              const provNombre = feature.properties.provincia.nombre;
              
              // 1. Filtramos por Buenos Aires y CABA.
              if (provNombre === 'Buenos Aires' || provNombre === 'Ciudad Autónoma de Buenos Aires') {
                  
                  // 2. Usamos el campo 'nombre', que contiene la ciudad/localidad específica (ej: Tortuguitas)
                  const nombreLocalidad = feature.properties.nombre; 
                  
                  if (nombreLocalidad) {
                      localidadesUnicas.add(nombreLocalidad.toUpperCase()); // Usar MAYÚSCULAS para estandarizar
                  }
              }
          });

          // 3. Ordenar alfabéticamente
          const sortedLocalidades = Array.from(localidadesUnicas).sort();
          
          // Limpiar y añadir la opción por defecto
          selectLocalidad.innerHTML = '<option value="" disabled selected>Selecciona tu Localidad/Ciudad</option>'; 
          
          // 4. Llenar el select con las ciudades/localidades
          sortedLocalidades.forEach(localidad => {
              const option = document.createElement('option');
              option.value = localidad; // Valor estandarizado
              option.textContent = localidad;
              selectLocalidad.appendChild(option);
          });

          // Verificación rápida para asegurarnos que la lista no esté vacía por error
          if (sortedLocalidades.length === 0) {
              selectLocalidad.innerHTML = '<option value="" disabled selected>Lista de localidades vacía</option>';
              console.warn("La lista de localidades de BA/CABA está vacía. Revisa el filtro en el GeoJSON.");
          }

      } catch (error) {
          console.error('Error al cargar las localidades:', error);
          selectLocalidad.innerHTML = '<option value="" disabled selected>Error al cargar lista</option>';
      }
  }

  cargarLocalidades(); // Iniciar la carga

  // --- RESTO DEL EVENT LISTENER DE SUBMIT (sin cambios funcionales) ---

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      usuario: form.usuario.value,
      email: form.email.value,
      password: form.password.value,
      // Se captura la Localidad/Ciudad seleccionada
      localidad: selectLocalidad.value, 
      fecha: form.fecha.value,
      genero: form.querySelector('input[name="genero"]:checked')?.value || ''
    };

    // Validación rápida (incluyendo localidad)
    if (!data.usuario || !data.email || !data.password || !data.fecha || !data.genero || !data.localidad) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor, completa todos los campos, incluyendo tu Localidad/Ciudad.',
        heightAuto: false
      });
      return;
    }

    try {
      Swal.fire({
        title: 'Registrando usuario...',
        html: 'Por favor espera un momento.',
          heightAuto: false,
        allowOutsideClick: false,
        didOpen: async () => {
          Swal.showLoading();
          const res = await fetch('/usuarios/registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          Swal.close();
          if (res.ok) {
            Swal.fire({
              icon: 'success',
              title: '¡Registro exitoso!',
              text: 'Hemos enviado un correo de verificación a tu email. Por favor, verifica tu cuenta.',
              heightAuto: false
            });
            form.reset();
          } else {
            const err = await res.json();
            Swal.fire({
              icon: 'error',
              title: 'Error al registrar',
              text: err.message || 'Hubo un problema al crear tu cuenta.',
              heightAuto: false
            });
          }
        },
        scrollLock: false
      });
    } catch (error) {
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor. Intenta nuevamente más tarde.',
        confirmButtonText: 'Reintentar',
        heightAuto: false
      });
    }
  });

  const pass = document.getElementById('PsswRegis');
  const icon = document.getElementById('IconPsswRegis');

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
});