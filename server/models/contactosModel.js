const db = require("../config/db");

exports.agregarContacto = async (id_usuario, contacto) => {
    await db.query(
        "INSERT INTO contactos (id_usuario, contacto) VALUES (?, ?)",
        [id_usuario, contacto]
    );
};

exports.getContactosByUsuario = async (id_usuario) => {
    const [rows] = await db.query(
        "SELECT * FROM contactos WHERE id_usuario = ?",
        [id_usuario]
    );
    return rows;
};

exports.eliminarContacto = async (id) => {
    await db.query("DELETE FROM contactos WHERE id = ?", [id]);
};
