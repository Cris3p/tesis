const db = require("../config/db");

exports.generarReporte = async (id_usuario, tipo_crimen, lat, lon, fecha_hora, localidad, provincia, descripcion, iluminacion, gente, id_estado = 1
) => {
    try {
        const [result] = await db.query(
            `INSERT INTO reportes 
            (id_usuario, id_estado, tipo_crimen, lat, lon, fecha_hora, localidad, provincia, descripcion, iluminacion, gente) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id_usuario, id_estado, tipo_crimen, lat, lon, fecha_hora, localidad, provincia, descripcion, iluminacion, gente]
        );
        // 🔹 Aquí se captura el resultado y se devuelve el ID
        return result.insertId;
    } catch (error) {
        console.error("Error en generarReporte Model:", error);
        throw error;
    }
};
exports.obtenerReportes = async () => {
    const [rows] = await db.query (`SELECT * FROM reportes`) //los trae
    return rows;
}

exports.getAllUserEmails = async () => {
    //Esta función obtiene solo las direcciones de correo electrónico de todos los usuarios verificados
    const [rows] = await db.query(`SELECT email FROM usuarios WHERE verificado = 1`);
    //Mapea los resultados para devolver un array simple de correos
    return rows.map(row => row.email);
}

exports.obtenerReportePorId = async (id_reporte) => {
    try {
        const [rows] = await db.query(`SELECT * FROM reportes WHERE id_reporte = ?`, [id_reporte]);
        return rows[0]; // Retorna el primer y único reporte encontrado
    } catch (error) {
        console.error("Error en obtenerReportePorId Model:", error);
        throw error;
    }
};