const db = require("../config/db");

exports.agregarContacto = async (id_usuario, contacto, nombre) => {
    await db.query(
        "INSERT INTO contactos (FK_ID_usuarios, contacto, nombre) VALUES (?, ?, ?)",
        [id_usuario, contacto, nombre]
    );
};

exports.getContactosByUsuario = async (id_usuario) => {
    const [rows] = await db.query(
        "SELECT * FROM contactos WHERE FK_ID_usuarios = ? ORDER BY nombre ASC",
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

// NUEVAS FUNCIONES PARA VALIDACIONES

// Verificar si un contacto ya existe para un usuario (por teléfono)
exports.verificarContactoExistente = async (id_usuario, contacto) => {
    const [rows] = await db.query(
        "SELECT ID_contactos FROM contactos WHERE FK_ID_usuarios = ? AND contacto = ?",
        [id_usuario, contacto]
    );
    return rows.length > 0;
};

// Verificar si un contacto existe por ID
exports.verificarContactoExistePorId = async (id) => {
    const [rows] = await db.query(
        "SELECT ID_contactos FROM contactos WHERE ID_contactos = ?",
        [id]
    );
    return rows.length > 0;
};

// Obtener un contacto específico por ID
exports.obtenerContactoPorId = async (id) => {
    const [rows] = await db.query(
        "SELECT * FROM contactos WHERE ID_contactos = ?",
        [id]
    );
    return rows.length > 0 ? rows[0] : null;
};

// Contar cuántos contactos tiene un usuario
exports.contarContactos = async (id_usuario) => {
    const [rows] = await db.query(
        "SELECT COUNT(*) as total FROM contactos WHERE FK_ID_usuarios = ?",
        [id_usuario]
    );
    return rows[0].total;
};

module.exports = exports;