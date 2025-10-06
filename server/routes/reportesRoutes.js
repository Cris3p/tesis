const express = require("express");
const router = express.Router();
const reportesController = require("../controllers/reportesController");

router.post("/generar", reportesController.generarReporte);
router.get("/getall", reportesController.obtenerReportes);

// Nueva ruta para ver un solo reporte por su ID
router.get("/:id_reporte", reportesController.obtenerReportePorId); 
module.exports = router;