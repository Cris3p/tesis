const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.setUsuarios = async (usuario, email, password, fecha, genero, localidad) => {
    // CORRECCIÓN: Se añade 'localidad' a la query y a los parámetros
    const [result] = await db.query(
        `INSERT INTO usuarios (usuario, email, password, fecha_nac, genero, localidad) VALUES (?, ?, ?, ?, ?, ?);`,
        [usuario, email, password, fecha, genero, localidad]
    );
    return result;
};

exports.getAllUsuarios = async () => {
    const [rows] = await db.query(`SELECT * FROM usuarios`);
    return rows;
};

exports.getUsuarioByEmailOrUsuario = async (valor) => {
    const [rows] = await db.query(
        `SELECT * FROM usuarios WHERE email = ? OR usuario = ?`,
        [valor, valor]
    );
    return rows;
};

exports.getUsuarioById = async (id) => {
    const [rows] = await db.query(`SELECT * FROM usuarios WHERE ID_usuarios = ?`, [id]);
    return rows[0];
};

exports.actualizarUsuario = async (nuevoUsuario, id) => {
    const [result] = await db.query(
        'UPDATE usuarios SET usuario = ? WHERE ID_usuarios = ?',
        [nuevoUsuario, id]
    );
    return result;
};

exports.actualizarPassword = async (nuevaPassword, id) => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(nuevaPassword, salt);
    const [result] = await db.query(
        'UPDATE usuarios SET password = ? WHERE ID_usuarios = ?',
        [passwordHash, id]
    );
    return result;
};

exports.eliminarCuenta = async (id) => {
    // La eliminación de la cuenta funciona gracias a la query simple.
    // **IMPORTANTE:** Si la base de datos no tiene 'ON DELETE CASCADE'
    // en tablas relacionadas (como 'reportes'), esto fallará.
    const [result] = await db.query(
        'DELETE FROM usuarios WHERE ID_usuarios = ?',
        [id]
    );
    return result;
};

exports.getAllUserEmails = async () => {
    const [rows] = await db.query(
        `SELECT ID_usuarios, email FROM usuarios WHERE verificado = 1`
    );
    return rows;
};

exports.verificarUsuario = async (id) => {
    const [result] = await db.query(
        `UPDATE usuarios SET verificado = 1 WHERE ID_usuarios = ?`,
        [id]
    );
    return result;
};

exports.updatePasswordToken = async (id, token) => {
    const [result] = await db.query(
        `UPDATE usuarios SET reset_password_token = ? WHERE ID_usuarios = ?`,
        [token, id]
    );
    return result;
};

exports.getUserByToken = async (token) => {
    const [rows] = await db.query(
        `SELECT * FROM usuarios WHERE reset_password_token = ?`,
        [token]
    );
    return rows[0];
};