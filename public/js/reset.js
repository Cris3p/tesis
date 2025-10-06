document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
        document.getElementById('resetToken').value = token;
    } else {
        alert('Token inválido o expirado. Por favor, solicita un nuevo restablecimiento.');
        location.href = '/html/login.html';
    }

    const pass = document.getElementById('newPssw');
    const icon = document.getElementById('TpL');
    const passConfir = document.getElementById('ConPssw');
    const iconConfir = document.getElementById('ConfPssw');

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

    iconConfir.addEventListener('click', e => {
        {
            if (passConfir.type === "password") {
                passConfir.type = "text";
                iconConfir.classList.remove("bxs-lock-alt");
                iconConfir.classList.add("bxs-lock-open");
            } else {
                passConfir.type = "password";
                iconConfir.classList.remove("bxs-lock-open");
                iconConfir.classList.add("bxs-lock-alt");
            }
        }
    });

    document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const token = document.getElementById('resetToken').value;
        const newPass = document.getElementById('newPssw').value.trim();
        const confirmPass = document.getElementById('ConPssw').value.trim();

        if (!newPass || !confirmPass) {
            alert('Por favor, completa todos los campos');
            return;
        }
        if (newPass !== confirmPass) {
            alert('Las contraseñas no coinciden');
            return;
        }

        try {
            const res = await fetch('/usuarios/Cambiarpssw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, nuevaPassword: newPass })
            });

            if (res.ok) {
                alert('Contraseña restablecida con éxito. Puedes iniciar sesión ahora.');
                location.href = '/html/login.html';
            } else {
                const err = await res.json();
                alert(err.error || `Error al restablecer la contraseña (código: ${res.status})`);
            }
        } catch (error) {
            console.error('Error detallado:', error);
            alert(`Error al conectar con el servidor: ${error.message}`);
        }
    });
});