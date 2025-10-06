const { rawListeners } = require("../config/db");
const mailService = require("../services/mail.service"); 
const reportesModel = require("../models/reportesModel");
const usuariosModel = require("../models/usuariosModel"); 

exports.generarReporte = async (req, res) => {
    try {
        const { id_usuario, tipo_crimen, lat, lon, fecha_hora, localidad, provincia, descripcion, iluminacion, gente } = req.body;

        let id_reporte;
        try {
            id_reporte = await reportesModel.generarReporte(
                Number(id_usuario), tipo_crimen, Number(lat), Number(lon), fecha_hora, localidad, provincia, descripcion, iluminacion, gente
            );
            console.log("Reporte guardado en la base de datos con ID:", id_reporte);
        } catch (dbError) {
            console.error("ERROR: Falló la inserción en la base de datos:", dbError);
            return res.status(500).json({ error: "Error al guardar el reporte en la base de datos." });
        }

        try {
            const allUserEmails = await usuariosModel.getAllUserEmails();
            const reporteData = { 
                id_reporte, // 🔹 incluimos ID
                tipo_crimen, 
                localidad, 
                provincia, 
                fecha_hora, 
                descripcion 
            };
            await mailService.enviarNotificacionReporte(allUserEmails, reporteData);
            console.log("Notificaciones enviadas por correo.");
        } catch (mailError) {
            console.error("ADVERTENCIA: Falló el envío de correo de notificación:", mailError);
            return res.status(201).json({ 
                message: "Reporte generado, pero falló el envío de notificaciones por correo.",
                id_reporte
            });
        }

        res.status(201).json({ 
            message: "Reporte generado y notificaciones enviadas correctamente.",
            id_reporte // 🔹 lo devolvemos al frontend
        });
    } catch (finalError) {
        console.error("ERROR: Error inesperado en el controlador:", finalError);
        res.status(500).json({ error: "Error inesperado del servidor." });
    }
};


exports.obtenerReportes = async (req, res) => {
    try {
        const rows = await reportesModel.obtenerReportes();
        res.status(200).json(rows);
        
    } catch (error) {
        console.error('Error al obtener los reportes:', error);
        res.status(500).json({ error: 'Error al obtener los reportes' });
    }    
}

// Nuevo controlador para obtener un solo reporte por su ID
exports.obtenerReportePorId = async (req, res) => {
    try {
        const { id_reporte } = req.params; // Obtener el id del reporte de la URL
        const reporte = await reportesModel.obtenerReportePorId(id_reporte);

        if (!reporte) {
            return res.status(404).json({ error: "Reporte no encontrado." });
        }

        res.status(200).json(reporte);
    } catch (error) {
        console.error('Error al obtener el reporte por ID:', error);
        res.status(500).json({ error: 'Error al obtener el reporte' });
    }
};