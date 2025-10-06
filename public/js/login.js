document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('verificado') === 'true') {
        alert('¡Cuenta verificada exitosamente! Ya puedes iniciar sesión.');
    }
});

// document.getElementById('loginForm').addEventListener('submit', async (e) => {
//     e.preventDefault();
//     const form = document.getElementById('loginForm');
//     const data = {
//         usuario: form.usuario.value,
//         password: form.password.value
//     };

//     try {
//         const res = await fetch('/app/usuarios/login', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(data)
//         });

//         if (res.ok) {
//             const datos = await res.json();
//             console.log(datos);
//             localStorage.setItem("usuarioId", datos.usuario.id);
//             window.location.href = '/html/inicio.html';
//         } else {
//             const err = await res.json();
//             alert(err.error || 'Error al iniciar sesión');
//         }
//     } catch (error) {
//         alert('Error al conectar con el servidor');
//     }
// });

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = document.getElementById('loginForm');
    const data = {
        usuario: form.usuario.value.trim(),
        password: form.password.value.trim()
    };

    if (!data.usuario || !data.password) {
        alert('Por favor, completa todos los campos');
        return;
    }
    try {
        console.log('Enviando solicitud a:', 'http://localhost:3000/usuarios/login');
        console.log('Datos enviados:', JSON.stringify(data));
        
        const res = await fetch('/usuarios/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            const datos = await res.json();
            console.log('Respuesta del servidor:', datos);
            localStorage.setItem('usuarioId', datos.usuario.id);
            window.location.href = '/html/inicio.html';
        } else {
            const err = await res.json();
            console.error('Error del servidor:', err);
            alert(err.error || `Error al iniciar sesión (código: ${res.status})`);
        }
    } catch (error) {
        console.error('Error detallado:', error);
        alert(`Error al conectar con el servidor: ${error.message}`);
    }
});

// visibilidad de contraseña
const pass = document.getElementById('PsswLogin');
const icon = document.getElementById('TpL');

icon.addEventListener('click',e=>{ {
      if ( pass.type === "password") {
        pass.type = "text";
        icon.classList.remove("bxs-lock-alt");
        icon.classList.add("bxs-lock-open");
    } else {
        pass.type = "password";
        icon.classList.remove("bxs-lock-open");
        icon.classList.add("bxs-lock-alt");
    }   
}});

const Modal = document.getElementById("Modal");
const openBtn = document.getElementById("olvide");
const closeBtn = document.querySelector(".close");

openBtn.onclick = () => { Modal.style.display = "block"; }
closeBtn.onclick = () => { Modal.style.display = "none"; }
window.onclick = (e) => { if (e.target === Modal) Modal.style.display = "none"; }

// Enviar correo
document.getElementById("enviar").addEventListener("click", async () => {
  const email = document.getElementById("Email").value;
  if (!email) {
    alert("Por favor ingresa tu correo.");
    return;
  }

  try {
    const res = await fetch("/usuarios/solicitud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    if (res.ok) {
      const data = await res.json();
      alert(data.msg || "Revisa tu correo para continuar con el restablecimiento.");
      Modal.style.display = "none";
    } else {
      const err = await res.json();
      alert(err.error || "Error al enviar el correo de restablecimiento.");
    }
  } catch (err) {
    console.error(err);
    alert("No se pudo enviar el correo, intenta más tarde.");
  }
});