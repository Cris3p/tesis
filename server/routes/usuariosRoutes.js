const express = require('express')
const router = express.Router()
const usuariosController = require('../controllers/usuariosController')

router.get('/getall', usuariosController.getAllUsuarios);
router.put('/registro', usuariosController.setUsuarios);
router.post('/registro', usuariosController.setUsuarios);
router.get('/verificar/:token', usuariosController.verificarUsuario);
router.post('/login', usuariosController.loginUsuario);
router.post('/logout', usuariosController.logoutUsuario); 

router.post('/solicitud', usuariosController.solicitarResetPassword);
router.post('/Cambiarpssw', usuariosController.confirmarResetPassword);

//rutas del crud y proteccion con cookies:
router.put('/actualizarPassword', usuariosController.revisarCookie ,usuariosController.actualizarPassword);
router.put('/actualizarUsuario', usuariosController.revisarCookie ,usuariosController.actualizarUsuario);
// El middleware revisa la cookie y pone el ID en req.idUsuario, que el controller usará.
router.delete('/eliminar', usuariosController.revisarCookie ,usuariosController.eliminarCuenta); 


module.exports = router;