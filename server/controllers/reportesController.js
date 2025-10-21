const { rawListeners } = require("../config/db");
const mailService = require("../services/mail.service"); 
const reportesModel = require("../models/reportesModel");
const usuariosModel = require("../models/usuariosModel"); 
const filtroLenguajeService = require("../services/filtroLenguajesService.js");
const Peach = require("../../lib/peach/Peach.js");

exports.show = (req, res) => {
    try {
        const view = new Peach("reportes");
        res.status(200).send(view.bufferTpl);
    } catch (error) {
        res.status(404).send('Página no encontrada');
    }
}

exports.generarReporte = async (req, res) => {
    try {
        const { id_usuario, tipo_crimen, lat, lon, fecha_hora, localidad, provincia, descripcion, iluminacion, gente } = req.body;
        
        if (descripcion && filtroLenguajeService.contieneLenguajeOfensivo(descripcion)) {
            return res.status(400).json({ 
                error: "La descripción contiene lenguaje ofensivo. Por favor, se respetuoso." 
            });
        }
        let id_reporte;
        try {
            id_reporte = await reportesModel.generarReporte(
                Number(id_usuario), tipo_crimen, Number(lat), Number(lon), fecha_hora, localidad, provincia, descripcion || null, iluminacion, gente
            );
            console.log("Reporte guardado en la base de datos con ID:", id_reporte);
        } catch (dbError) {
            console.error("ERROR: Falló la inserción en la base de datos:", dbError);
            return res.status(500).json({ error: "Error al guardar el reporte en la base de datos." });
        }

        try {
            const allUserEmails = await usuariosModel.getAllUserEmails();
            const reporteData = { 
                id_reporte,
                tipo_crimen, 
                localidad, 
                provincia, 
                fecha_hora, 
                descripcion: descripcion || 'Sin descripción adicional'

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
            id_reporte
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

exports.obtenerReportePorId = async (req, res) => {
    try {
        const { id } = req.params;
        const reporte = await reportesModel.obtenerReportePorId(id);

        if (!reporte) {
            return res.status(404).json({ error: "Reporte no encontrado." });
        }

        res.status(200).json(reporte);
    } catch (error) {
        console.error('Error al obtener el reporte por ID:', error);
        res.status(500).json({ error: 'Error al obtener el reporte' });
    }
};

exports.obtenerReportesPorUsuario = async (req, res) => {
    try {
        
        const { id } = req.params; 
        
        const reportes = await reportesModel.obtenerReportesPorUsuario(id); 
        
        res.status(200).json(reportes); 
    } catch (error) {
        console.error('Error al obtener reportes del usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener el historial.' });
    }
};

exports.actualizarReporte = async (req, res) => {
    try {
        const { id } = req.params; 
        const datos = req.body;

        const actualizado = await reportesModel.actualizarReporte(id, datos);

        if (!actualizado) {
            return res.status(404).json({ error: "Reporte no encontrado o no actualizado." });
        }

        return res.status(200).json({ message: "Reporte actualizado correctamente." });
    } catch (error) {
        console.error("Error al actualizar reporte:", error);
        return res.status(500).json({ error: "Error interno al actualizar el reporte." });
    }
};

exports.eliminarReporte = async (req, res) => {
    try {
        const { id } = req.params;
        const eliminado = await reportesModel.eliminarReporte(id);
        
        if (!eliminado) {
            return res.status(404).json({ error: 'No se pudo eliminar el reporte o ID no encontrado.' });
        }

        res.status(200).json({ message: 'Reporte eliminado con éxito.', id_reporte: id }); 
    } catch (error) {
        console.error('Error al eliminar reporte:', error);
        res.status(500).json({ error: 'Error interno del servidor al eliminar.' });
    }
};