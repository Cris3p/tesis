const express = require("express");
const router = express.Router();
const contactosController = require("../controllers/contactosController");

router.post("/", contactosController.agregarContacto);
router.get("/:id_usuario", contactosController.getContactosByUsuario);
router.delete("/eliminar/:id", contactosController.eliminarContacto);
router.put("/actualizar/:id", contactosController.actualizarContacto);

module.exports = router;