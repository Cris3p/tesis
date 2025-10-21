const usuarios = require('../models/usuariosModel')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { enviarverificacion } = require('../services/mail.service');
const { enviarResetPassword } = require('../services/mail.service');

const cookieOption = {
    expires: new Date(Date.now() + process.env.COOKIE_EXPIRES * 24 * 60 * 60 * 1000), // La cookie expira en X días (definido en .env)
    path: '/', // La cookie es accesible desde cualquier ruta
    httpOnly: true, // La cookie no es accesible desde el JavaScript del cliente (seguridad)
    secure: true, // La cookie solo se envía con HTTP (en desarrollo, poner en true en producción con HTTPS)
    sameSite: 'Lax' // Previene ataques de falsificación de solicitudes entre sitios (CSRF)
};

exports.getAllUsuarios = async (req, res) => {
    try {
        const rows = await usuarios.getAllUsuarios();
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener los usuarios:', error);
        res.status(500).json({ error: 'Error al obtener los usuarios' });
    }
};

// MODIFICADO: Añadido 'localidad' y la verificación de existencia del usuario
exports.setUsuarios = async (req, res) => {
    try {
        // CORRECCIÓN: Se desestructura 'localidad'
        const { usuario, email, password, fecha, genero, localidad } = req.body; 

        // 1. Verificar si el usuario ya existe
        const userExist = await usuarios.getUsuarioByEmailOrUsuario(email);

        if (userExist.length > 0) {
            return res.status(409).json({ message: 'El correo electrónico o usuario ya están registrados.' });
        }

        // CORRECCIÓN: Se añade 'localidad' al objeto que se firma en el token
        const userData = { usuario, email, password, fecha, genero, localidad }; 

        // Creamos el token JWT con los datos del usuario para el proceso de verificación
        const token = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: '15m' });

        // Enviamos el correo con el token
        await enviarverificacion(email, token);

        res.status(200).json({ message: 'Se ha enviado un correo de verificación. Por favor, revisa tu bandeja de entrada.' });
    } catch (error) {
        console.error('Error al iniciar el proceso de registro:', error);
        res.status(500).json({ error: 'Error al iniciar el proceso de registro' });
    }
};

// MODIFICADO: Ahora maneja 'localidad' al verificar y guardar
exports.verificarUsuario = async (req, res) => {
    try {
        const { token } = req.params;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // CORRECCIÓN: Se desestructura 'localidad' del token decodificado
        const { usuario, email, password, fecha, genero, localidad } = decoded; 

        // Chequear si el usuario ya fue verificado para evitar duplicados/errores
        const userExist = await usuarios.getUsuarioByEmailOrUsuario(email);
        if (userExist.length > 0 && userExist[0].verificado === 1) {
            return res.redirect('/html/login.html?verificado=true');
        }

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        // CORRECCIÓN: Se pasa 'localidad' al modelo para guardarlo
        const result = await usuarios.setUsuarios(usuario, email, hashPassword, fecha, genero, localidad); 

        if (result.insertId) {
            // Si la inserción fue exitosa, no hace falta verificar (ya se guardó como verificado)
            return res.redirect('/html/login.html?verificado=true');
        } else {
            return res.status(500).send('Error al verificar y guardar el usuario.');
        }

    } catch (error) {
        console.error('Error de verificación:', error);
        // Maneja los errores de token (expiración, invalidez)
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            return res.status(400).send('Token de verificación inválido o expirado. Por favor, regístrate de nuevo.');
        }
        res.status(500).send('Error interno del servidor.');
    }
};

// iniciar sesion por email o usuario
exports.loginUsuario = async (req, res) => {
    try {
        const { usuario, password } = req.body;
        console.log('Intento de login con usuario:', usuario);

        const userRows = await usuarios.getUsuarioByEmailOrUsuario(usuario);
        const user = userRows[0];
        console.log('Usuario encontrado:', user ? user.email : 'No encontrado');

        if (!user) {
            return res.status(401).json({ error: 'Usuario incorrectos' });
        }

        const cont = await bcrypt.compare(password, user.password);
        console.log('Contraseña válida:', cont);

        if (!cont) {
            return res.status(401).json({ error: ' contraseña incorrectos' });
        }
        
        if (user.verificado !== 1) {
            console.log('Cuenta no verificada para:', user.email);
            return res.status(401).json({ error: 'Tu cuenta aún no ha sido verificada. Revisa tu email.' });
        }
        const token = jwt.sign({ id: user.ID_usuarios }, process.env.JWT_SECRET, {
            expiresIn: process.env.COOKIE_EXPIRES + 'd' // La cookie expira en X días (definido en .env)
        });

        res.cookie('jwt', token, cookieOption);
        
        res.status(200).json({
            message: 'Inicio de sesión exitoso',
            usuario: { id: user.ID_usuarios, email: user.email, usuario: user.usuario }
        });

    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ error: 'Error del servidor al iniciar sesión' });
    }
};

//actualiza el nombre de usuario
exports.actualizarUsuario = async (req, res) => {
    try {
        const { nuevoUsuario } = req.body;
        const id = req.idUsuario;

        if (!id) {
            return res.status(500).json({ error: 'ID de usuario no disponible.' });
        }

        const result = await usuarios.actualizarUsuario(nuevoUsuario, id);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado o sin cambios' });
        }

        res.status(200).json({ message: "Usuario actualizado correctamente" });
    } catch (error) {
        console.error("Error en actualizarUsuario:", error);
        res.status(500).json({ error: 'Error al actualizar el usuario' });
    }
};

//actualiza la contraseña del usuario
exports.actualizarPassword = async (req, res) => {
    try {
        const { nuevaPassword } = req.body;
        const id = req.idUsuario;
        
        const result = await usuarios.actualizarPassword(nuevaPassword, id);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.status(200).json({ message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
        console.error('Error al actualizar la contraseña:', error);
        res.status(500).json({ error: 'Error al actualizar la contraseña' });
    }
}

// FUNCIÓN DE ELIMINACIÓN CORREGIDA Y COMPLETA
exports.eliminarCuenta = async (req, res) => {
    try {
        // CLAVE: Usamos el ID del usuario autenticado (del token JWT)
        const id = req.idUsuario; 

        if (!id) {
            return res.status(401).json({ error: 'No autorizado. ID de sesión no encontrado.' });
        }
        
        // Limpiamos la cookie inmediatamente para desloguear al cliente
        res.clearCookie('jwt'); 

        const result = await usuarios.eliminarCuenta(id);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado en la base de datos.' });
        }

        res.status(200).json({ message: 'Usuario eliminado exitosamente y sesión cerrada.' });
    } catch (error) {
        console.error('Error al eliminar el usuario:', error);
        
        // Si el error es una restricción de clave foránea (el principal problema)
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
             return res.status(409).json({ 
                error: 'Error de base de datos: La cuenta tiene datos relacionados (reportes) que bloquean la eliminación. Debes configurar ON DELETE CASCADE en la clave foránea de la tabla "reportes".' 
            });
        }
        
        res.status(500).json({ error: 'Error al eliminar el usuario' });
    }
}

exports.revisarCookie = async (req, res, next) => {
    const token = req.cookies.jwt;

    if (!token) {
        return res.status(401).json({ error: 'Sesión no válida o expirada. Por favor, inicie sesión.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error("Error de verificación JWT:", err.message);
            return res.status(401).json({ error: 'Sesión expirada. Vuelve a iniciar.' });
        }

        req.idUsuario = decoded.id; // Asume que al crear el JWT usaste { id: user.id_usuario }

        next();
    });
};

exports.logoutUsuario = (req, res) => {
    try {
        res.clearCookie('jwt');

        res.status(200).json({ message: 'Sesión cerrada correctamente.' });

    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        res.status(500).json({ error: 'Error del servidor al cerrar sesión.' });
    }
};

exports.solicitarResetPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const userRows = await usuarios.getUsuarioByEmailOrUsuario(email);
        const user = userRows[0];
        if (!user) {
            return res.status(404).json({ error: 'No existe un usuario con ese correo' });
        }

        const token = jwt.sign(
            { id: user.ID_usuarios },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        await enviarResetPassword(email, token);

        res.json({ ok: true, msg: 'Correo de recuperación enviado' });
    } catch (error) {
        console.error("Error al solicitar reset:", error);
        res.status(500).json({ error: 'Error interno al solicitar reset' });
    }
};

exports.confirmarResetPassword = async (req, res) => {
    try {
        const { token, nuevaPassword } = req.body;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await usuarios.getUsuarioById(decoded.id);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const result = await usuarios.actualizarPassword(nuevaPassword, decoded.id);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ ok: true, msg: 'Contraseña actualizada correctamente' });
    } catch (error) {
        console.error("Error al confirmar reset:", error);
        if (error.name === 'TokenExpiredError') {
            return res.status(400).json({ error: 'Token expirado, vuelve a solicitar recuperación' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(400).json({ error: 'Token inválido' });
        }
        res.status(500).json({ error: 'Error al restablecer contraseña' });
    }
};