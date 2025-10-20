const db = require("../config/db");

exports.generarReporte = async (id_usuario, tipo_crimen, lat, lon, fecha_hora, localidad, provincia, descripcion, iluminacion, gente, id_estado = 1) => {
    try {
        const [result] = await db.query(
            `INSERT INTO reportes 
            (FK_ID_usuarios, FK_ID_estado, tipo_crimen, lat, lon, fecha_hora, localidad, provincia, descripcion, iluminacion, gente) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id_usuario, id_estado, tipo_crimen, lat, lon, fecha_hora, localidad, provincia, descripcion, iluminacion, gente]
        );
        return result.insertId;
    } catch (error) {
        console.error("Error en generarReporte Model:", error);
        throw error;
    }
};

exports.obtenerReportes = async () => {
    const [rows] = await db.query(`
        SELECT 
            ID_reportes,
            FK_ID_usuarios,
            FK_ID_estado,
            tipo_crimen,
            lat,
            lon,
            fecha_hora,
            localidad,
            provincia,
            descripcion,
            iluminacion,
            gente
        FROM reportes
        ORDER BY fecha_hora DESC
    `);
    return rows;
};

exports.getAllUserEmails = async () => {
    const [rows] = await db.query(`SELECT email FROM usuarios`);
    return rows.map(row => row.email);
}

exports.obtenerReportePorId = async (id_reporte) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                ID_reportes,
                FK_ID_usuarios,
                FK_ID_estado,
                tipo_crimen,
                lat,
                lon,
                fecha_hora,
                localidad,
                provincia,
                descripcion,
                iluminacion,
                gente
            FROM reportes 
            WHERE ID_reportes = ?
        `, [id_reporte]);
        return rows[0];
    } catch (error) {
        console.error("Error en obtenerReportePorId Model:", error);
        throw error;
    }
};

exports.obtenerReportesPorUsuario = async (id_usuario) => {
    const [rows] = await db.query(`
        SELECT 
            r.ID_reportes,  
            r.fecha_hora, 
            r.tipo_crimen, 
            r.localidad, 
            r.provincia, 
            r.descripcion,
            r.lat,
            r.lon,
            r.iluminacion,
            r.gente
        FROM reportes r
        WHERE r.FK_ID_usuarios = ?
        ORDER BY r.fecha_hora DESC
    `, [id_usuario]);
    return rows;
};

exports.actualizarReporte = async (id_reporte, datos) => {
    try {
        const { tipo_crimen, descripcion, lat, lon, fecha_hora, provincia, localidad, iluminacion, gente } = datos;
        const query = `
            UPDATE reportes 
            SET 
                tipo_crimen = ?, 
                descripcion = ?, 
                lat = ?, 
                lon = ?, 
                fecha_hora = ?, 
                provincia = ?, 
                localidad = ?, 
                iluminacion = ?, 
                gente = ?
            WHERE ID_reportes = ?
        `;
        const [result] = await db.query(query, [
            tipo_crimen, descripcion, lat, lon, fecha_hora, provincia, localidad, iluminacion, gente, id_reporte
        ]);
        return result.affectedRows > 0;
    } catch (error) {
        console.error("Error en actualizarReporte Model:", error);
        throw error;
    }
};

exports.eliminarReporte = async (id_reporte) => {
    try {
        const query = 'DELETE FROM reportes WHERE ID_reportes = ?';
        const [result] = await db.query(query, [id_reporte]);
        return result.affectedRows > 0;
    } catch (error) {
        console.error("Error en eliminarReporte Model:", error);
        throw error;
    }
};