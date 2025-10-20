const express = require("express");
const router = express.Router();
const soporteController = require("../controllers/soporteController");

router.post("/contacto", soporteController.enviarContacto);

module.exports = router;