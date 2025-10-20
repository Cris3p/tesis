const db = require("../config/db");

exports.agregarContacto = async (id_usuario, contacto, nombre) => {
    await db.query(
        "INSERT INTO contactos (FK_ID_usuarios, contacto, nombre) VALUES (?, ?, ?)",
        [id_usuario, contacto, nombre]
    );
};

exports.getContactosByUsuario = async (id_usuario) => {
    const [rows] = await db.query(
        "SELECT * FROM contactos WHERE FK_ID_usuarios = ?",
        [id_usuario]
    );
    return rows;
};

exports.eliminarContacto = async (id) => {
    await db.query("DELETE FROM contactos WHERE ID_contactos = ?", [id]);
};

exports.actualizarContacto = async (id, contacto, nombre) => {
    await db.query(
        "UPDATE contactos SET contacto = ?, nombre = ? WHERE ID_contactos = ?",
        [contacto, nombre, id]
    );
};