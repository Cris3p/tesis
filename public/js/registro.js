document.getElementById('idForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = document.getElementById('idForm');
    const data = {
        usuario: form.usuario.value,
        email: form.email.value,
        password: form.password.value,
        fecha: form.fecha.value,
        genero: form.genero.value
    };

    try {
        const res = await fetch('/usuarios/registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            // Muestra un mensaje al usuario en lugar de redirigir
            alert('Hemos enviado un correo de verificación a tu email. Por favor, verifica tu cuenta.');
        } else {
            const err = await res.json();
            alert('Error al registrar:');
        }
    } catch (error) {
        alert('Error al conectar con el servidor');
    }
});

// Toggle visibilidad de contraseña
const pass = document.getElementById('PsswRegis');
const icon = document.getElementById('IconPsswRegis');

icon.addEventListener('click', e => {
    {
        if (pass.type === "password") {
            pass.type = "text";
            icon.classList.remove("bxs-lock-alt");
            icon.classList.add("bxs-lock-open");
        } else {
            pass.type = "password";
            icon.classList.remove("bxs-lock-open");
            icon.classList.add("bxs-lock-alt");
        }
    }
});