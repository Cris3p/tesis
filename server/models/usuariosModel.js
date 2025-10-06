const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.setUsuarios = async (usuario, email, password, fecha, genero) => {
    // Inserta usuarios
    const [result] = await db.query(
        `INSERT INTO usuarios (usuario, email, password, fecha_nac, genero) VALUES (?, ?, ?, ?, ?);`,
        [usuario, email, password, fecha, genero]
    );
    return result;
};

exports.getAllUsuarios = async () => {
    // Trae todos los usuarios
    const [rows] = await db.query(`SELECT * FROM usuarios`);
    return rows;
};

exports.getUsuarioByEmailOrUsuario = async (valor) => {
    // Busca un usuario por email o usuario
    const [rows] = await db.query(
        `SELECT * FROM usuarios WHERE email = ? OR usuario = ?`,
        [valor, valor]
    );
    return rows;
};

exports.getUsuarioById = async (id) => {
    const [rows] = await db.query(`SELECT * FROM usuarios WHERE id_usuario = ?`, [id]);
    return rows[0];
};

exports.actualizarUsuario = async (nuevoUsuario, id) => {
    // Actualiza un usuario
    const [result] = await db.query(
        'UPDATE usuarios SET usuario = ? WHERE id_usuario = ?',
        [nuevoUsuario, id]
    );
    return result;
};

exports.actualizarPassword = async (nuevaPassword, id) => {
    // Actualiza la contraseña de un usuario
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(nuevaPassword, salt);
    const [result] = await db.query(
        'UPDATE usuarios SET password = ? WHERE id_usuario = ?',
        [passwordHash, id]
    );
    return result;
};

exports.eliminarCuenta = async (id) => {
    // Elimina un usuario
    const [result] = await db.query(
        'DELETE FROM usuarios WHERE id_usuario = ?',
        [id]
    );
    return result;
};

exports.verificarUsuario = async (verificado,id) => {
    const [result] = await db.query(
        'UPDATE usuarios SET verificado = 1 WHERE id_usuario = ?',
        [verificado,id]
    );
    return result;
};

exports.getAllUserEmails = async () => {
    const [rows] = await db.query(`SELECT email FROM usuarios`);
    // Mapea los resultados para devolver un array simple de correos
    return rows.map(row => row.email);
};

