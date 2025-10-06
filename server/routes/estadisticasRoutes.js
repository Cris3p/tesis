const express = require("express");
const router = express.Router();
const estadisticasController = require("../controllers/estadisticasController");

router.get("/mapa", estadisticasController.obtenerDatosMapa);
router.get("/", estadisticasController.obtenerEstadisticas);
router.get("/reportes/recientes", estadisticasController.obtenerReportes);
router.get("/provincias", estadisticasController.obtenerProvincias);
router.get("/localidades", estadisticasController.obtenerLocalidades);

module.exports = router;