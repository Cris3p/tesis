const usuarios = require('../models/usuariosModel')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { enviarverificacion } = require('../services/mail.service');
const { enviarResetPassword } = require('../services/mail.service');

const cookieOption = {
    expires: new Date(Date.now() + process.env.COOKIE_EXPIRES * 24 * 60 * 60 * 1000), // La cookie expira en X días (definido en .env)
    path: '/', // La cookie es accesible desde cualquier ruta
    httpOnly: true, // La cookie no es accesible desde el JavaScript del cliente (seguridad)
    secure: false, // La cookie solo se envía con HTTP (en desarrollo, poner en true en producción con HTTPS)
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

exports.setUsuarios = async (req, res) => {
    try {
        const { usuario, email, password, fecha, genero } = req.body;

        const userData = { usuario, email, password, fecha, genero };

        // Creamos el token JWT con los datos del usuario
        const token = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: '15m' });

        // Enviamos el correo con el token
        await enviarverificacion(email, token);

        res.status(200).json({ message: 'Se ha enviado un correo de verificación. Por favor, revisa tu bandeja de entrada.' });
    } catch (error) {
        console.error('Error al iniciar el proceso de registro:', error);
        res.status(500).json({ error: 'Error al iniciar el proceso de registro' });
    }
};

exports.verificarUsuario = async (req, res) => {
    try {
        const { token } = req.params;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const { usuario, email, password, fecha, genero } = decoded;

        // Hasheamos la contraseña antes de guardarla en la DB
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        // Guardamos el usuario en la base de datos AHORA
        const result = await usuarios.setUsuarios(usuario, email, hashPassword, fecha, genero);

        if (result.affectedRows > 0) {
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

//no se borra por el momento
// exports.setUsuarios = async (req, res) => {

//     try {
//         const { usuario, email, password, fecha, genero } = req.body;

//         // Creamos un objeto con los datos del usuario
//         const userData = { usuario, email, password, fecha, genero };

//         // Creamos el token JWT con los datos del usuario
//         const token = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

//         // Enviamos el correo con el token
//         await enviarverificacion(email, token);

//         // Enviamos una respuesta exitosa, pero sin guardar en la DB todavía
//         res.status(200).json({ message: 'Se ha enviado un correo de verificación. Por favor, revisa tu bandeja de entrada.' });
//     } catch (error) {
//         console.error('Error al iniciar el proceso de registro:', error);
//         res.status(500).json({ error: 'Error al iniciar el proceso de registro' });
//     }
// };


// //enviar correo de verificacion
// exports.verificarUsuario = async (req, res) => {
//     try {
//         const token = req.params.token;

//         // Verifica y decodifica el token. Si el token es inválido o expiró, lanzará un error.
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);

//         // Guarda al usuario en la base de datos
//         const result = await usuarios.setUsuarios(
//             usuario,
//             email,
//             decoded.password,
//             fecha,
//             genero
//         );

//         if (result.affectedRows === 0) {
//              return res.status(404).send('No se pudo verificar la cuenta. Intente registrarse de nuevo.');
//         }

//         // Redirige al login con un mensaje de éxito
//         res.status(200).redirect('/html/login.html?verificado=true');

//     } catch (error) {
//         console.error('Error al verificar el token:', error);
//         res.status(400).send('Token de verificación inválido o expirado. Por favor, regístrate de nuevo.');
//     }
// };

// iniciar sesion por email o usuario
exports.loginUsuario = async (req, res) => {
    try {
        const { usuario, password } = req.body;

        const userRows = await usuarios.getUsuarioByEmailOrUsuario(usuario);
        const user = userRows[0];

        const cont = await bcrypt.compare(password, user.password);

        if (!cont) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        const token = jwt.sign({ id: user.id_usuario }, process.env.JWT_SECRET, {
            expiresIn: process.env.COOKIE_EXPIRES + 'd' // La cookie expira en X días (definido en .env)
        });

        res.cookie('jwt', token, cookieOption);
        if (!user) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        // // Asumiendo que la columna 'verificado' existe
        // if (user.verificado === 0) {
        //     console.log('6. Usuario no verificado, enviando error JSON.');
        //     return res.status(401).json({ error: 'Por favor, verifica tu cuenta a través del correo electrónico.' });
        // }

        res.status(200).json({
            message: 'Inicio de sesión exitoso',
            usuario: { id: user.id_usuario, email: user.email, usuario: user.usuario }
        });

    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        // Asegura que en caso de error interno, también envías JSON
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
        console.log("ID recibido para actualizar:", id);


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

//elimina el usuario
exports.eliminarCuenta = async (req, res) => {
    try {
        const { id } = req.body;
        console.log("ID recibido para eliminar:", id);
        const result = await usuarios.eliminarCuenta(id);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.status(200).json({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar el usuario:', error);
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
        // La clave es `jwt` porque así la nombramos al iniciar sesión
        res.clearCookie('jwt');

        // Puedes enviar un mensaje de éxito para que el cliente lo reciba
        res.status(200).json({ message: 'Sesión cerrada correctamente.' });

    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        res.status(500).json({ error: 'Error del servidor al cerrar sesión.' });
    }
};

exports.solicitarResetPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Verificar si el usuario existe
        const userRows = await usuarios.getUsuarioByEmailOrUsuario(email);
        const user = userRows[0];
        if (!user) {
            return res.status(404).json({ error: 'No existe un usuario con ese correo' });
        }

        // Crear token JWT corto con el ID del usuario
        const token = jwt.sign(
            { id: user.id_usuario },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        // Enviar correo de recuperación con el token
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

        // Buscar usuario por ID del token
        const user = await usuarios.getUsuarioById(decoded.id);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Actualizar contraseña
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