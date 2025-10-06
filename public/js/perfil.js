//-----------------------CRUD--------------------------------//

document.addEventListener("DOMContentLoaded", () => {
  const idUsuario = Number(localStorage.getItem('usuarioId'));

  if (!idUsuario) {
    alert("No se encontró el usuario. Iniciá sesión primero.");
    window.location.href = "login.html";
    return;
  }

  document.getElementById("actualizar-Usuario-Form").addEventListener("submit", async (e) => {//crud actualizar usuario
    e.preventDefault();
    const idUsuario = localStorage.getItem('usuarioId');
    const nuevoUsuario = document.getElementById("usuario").value;

    const res = await fetch("/usuarios/actualizarUsuario", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: idUsuario, nuevoUsuario }),
    });

    const data = await res.json();
    if (res.ok) {
      alert("Usuario actualizado");
    } else {
      alert(data.error || "Error al actualizar usuario");
    }
  });

  document.getElementById("actualizar-Password-Form").addEventListener("submit", async (e) => {//crud actualizar contraseña
    e.preventDefault();
  const idUsuario = Number(localStorage.getItem('usuarioId'));
    const nueva = document.getElementById("nueva-password").value;
    const confirmar = document.getElementById("confirmar-password").value;

    if (nueva !== confirmar) {
      alert("Las contraseñas no coinciden");
      return;
    }

    const res = await fetch("/usuarios/actualizarPassword", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: idUsuario, nuevaPassword: nueva }),
    });

    const data = await res.json();
    if (res.ok) {
      alert("Contraseña actualizada");
    } else {
      alert(data.error || "Error al actualizar contraseña");
    }
  });

  document.getElementById("borrar-Cuenta-Form").addEventListener("submit", async (e) => {// Crud eliminar 
    e.preventDefault();

  const idUsuario = Number(localStorage.getItem('usuarioId'));

    if (!confirm("¿Estás seguro/a de que querés eliminar tu cuenta? Esta acción no se puede deshacer.")) {
      return;
    }

    const res = await fetch("/usuarios/eliminar", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: idUsuario }),
    });

    const data = await res.json();
    if (res.ok) {
      alert("Cuenta eliminada");
      localStorage.clear();
      window.location.href = "registro.html";
    } else {
      alert(data.error || "Error al eliminar la cuenta");
    }
  });
});


//-------------------CONTACTOS------------------------------------//
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contacto-emergencia-form");
  const inputContacto = document.getElementById("contacto-input");
  const listaContactos = document.getElementById("lista-contactos");
  const idUsuario = Number(localStorage.getItem("usuarioId"));

  if (!idUsuario) {
    alert("No se encontró el usuario. Iniciá sesión primero.");
    window.location.href = "login.html";
    return;
  }

  async function cargarContactos() {
    try {
      const res = await fetch(`/contactos/${idUsuario}`);
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error al cargar contactos");
        return;
      }

      listaContactos.innerHTML = data
        .map(
          (c) => `
          <div data-id="${c.id}">
            <span>${c.contacto}</span>
            <button class="btn-eliminar" data-id="${c.id}">Eliminar</button>
          </div>
        `
        )
        .join("");
    } catch (err) {
      alert("Error de conexión al cargar contactos");
      console.error(err);
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const contacto = inputContacto.value.trim();

    if (!contacto) {
      alert("Ingresá un número de contacto válido.");
      return;
    }

    try {
      const res = await fetch("/contactos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_usuario: idUsuario, contacto }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error al guardar contacto");
        return;
      }

      alert("Contacto guardado");
      inputContacto.value = ""; 
      cargarContactos(); 
    } catch (err) {
      alert("Error de conexión al guardar contacto");
      console.error(err);
    }
  });

  listaContactos.addEventListener("click", async (e) => {
    if (e.target.classList.contains("btn-eliminar")) {
      const idContacto = e.target.getAttribute("data-id");

      if (!confirm("¿Querés eliminar este contacto?")) return;

      try {
        const res = await fetch(`/contactos/${idContacto}`, {
          method: "DELETE",
        });
        const data = await res.json();

        if (res.ok) {
          alert("Contacto eliminado");
          cargarContactos();
        } else {
          alert(data.error || "Error al eliminar contacto");
        }
      } catch (err) {
        alert("Error de conexión al eliminar contacto");
        console.error(err);
      }
    }
  });

  cargarContactos();
});
