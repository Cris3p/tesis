const express = require("express");
const router = express.Router();
const reportesController = require("../controllers/reportesController");

router.post("/generar", reportesController.generarReporte);
router.get("/getall", reportesController.obtenerReportes);

router.get("/usuario/:id", reportesController.obtenerReportesPorUsuario);
router.get("/:id", reportesController.obtenerReportePorId);
router.put("/actualizar/:id", reportesController.actualizarReporte); 
router.delete("/eliminar/:id", reportesController.eliminarReporte);

module.exports = router;