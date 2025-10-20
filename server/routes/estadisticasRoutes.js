const express = require("express");
const router = express.Router();
const estadisticasController = require("../controllers/estadisticasController");

router.get("/mapa", estadisticasController.obtenerDatosMapa);
router.get("/obtener", estadisticasController.obtenerEstadisticas);
router.get("/reportes/recientes", estadisticasController.obtenerReportes);
router.get("/provincias", estadisticasController.obtenerProvincias);
router.get("/localidades", estadisticasController.obtenerLocalidades);
router.get("/tendencias", estadisticasController.obtenerTendencias);
router.get('/departamentos/:provincia', estadisticasController.obtenerDepartamentos);


module.exports = router;