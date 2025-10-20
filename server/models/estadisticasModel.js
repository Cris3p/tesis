const db = require("../config/db");

exports.obtenerDatosMapa = async () => {
  const [rows] = await db.query(`
    SELECT 
      CASE 
        WHEN provincia = 'Ciudad Autónoma de Buenos Aires' THEN 'Buenos Aires'
        ELSE provincia
      END AS provincia,
      COUNT(*) AS total
    FROM reportes
    WHERE provincia IS NOT NULL AND provincia <> ''
    GROUP BY 
      CASE 
        WHEN provincia = 'Ciudad Autónoma de Buenos Aires' THEN 'Buenos Aires'
        ELSE provincia
      END
  `);
  return rows;
};

exports.obtenerEstadisticas = async () => {
  const [iluminacion] = await db.query(`
    SELECT iluminacion, COUNT(*) AS total
    FROM reportes
    GROUP BY iluminacion
  `);

  const [afluencia] = await db.query(`
    SELECT gente, COUNT(*) AS total
    FROM reportes
    GROUP BY gente
  `);

  const [horas] = await db.query(`
    SELECT HOUR(fecha_hora) AS hora, COUNT(*) AS total
    FROM reportes
    GROUP BY hora
    ORDER BY hora
  `);

  return { iluminacion, afluencia, horas };
};

exports.obtenerProvincias = async () => {
  const [rows] = await db.query(`
    SELECT DISTINCT provincia 
    FROM reportes 
    WHERE provincia IS NOT NULL AND provincia <> ''
    ORDER BY provincia
  `);
  return rows;
};

exports.obtenerLocalidades = async (provincia = '') => {
  let query = `
    SELECT DISTINCT 
      CASE 
        WHEN provincia = 'Ciudad Autónoma de Buenos Aires' THEN 'CABA'
        ELSE localidad
      END AS localidad
    FROM reportes 
    WHERE localidad IS NOT NULL AND localidad <> ''
  `;
  const params = [];
  if (provincia) { 
    query += ' AND (provincia = ? OR (provincia = \'Ciudad Autónoma de Buenos Aires\' AND ? = \'Buenos Aires\'))'; 
    params.push(provincia, provincia); 
  }
  query += ' ORDER BY localidad';
  const [rows] = await db.query(query, params);
  return rows;
};

exports.obtenerDepartamentosConEstadisticas = async (provincia) => {
  const params = [provincia, provincia];
  let query = `
    SELECT 
      CASE 
        WHEN r.provincia = 'Ciudad Autónoma de Buenos Aires' THEN 'CABA'
        ELSE r.localidad
      END AS departamento,
      COUNT(*) AS total,
      (
        SELECT r2.tipo_crimen
        FROM reportes r2
        WHERE 
          (r2.localidad = r.localidad AND r2.provincia = r.provincia)
          OR (r2.provincia = 'Ciudad Autónoma de Buenos Aires' AND r.provincia = 'Ciudad Autónoma de Buenos Aires')
        GROUP BY r2.tipo_crimen
        ORDER BY COUNT(*) DESC
        LIMIT 1
      ) AS tipoMasComun,
      GROUP_CONCAT(r.lat) AS lats,
      GROUP_CONCAT(r.lon) AS lons
    FROM reportes r
    WHERE (
      r.provincia = ? OR
      (r.provincia = 'Ciudad Autónoma de Buenos Aires' AND ? = 'Buenos Aires')
    )
    AND r.localidad IS NOT NULL AND r.localidad <> ''
    GROUP BY 
      CASE 
        WHEN r.provincia = 'Ciudad Autónoma de Buenos Aires' THEN 'CABA'
        ELSE r.localidad
      END, r.provincia
  `;
  
  const [rows] = await db.query(query, params);

  return rows.map(row => ({
    departamento: row.departamento,
    total: row.total,
    tipoMasComun: row.tipoMasComun,
    lats: row.lats ? row.lats.split(',') : [],
    lons: row.lons ? row.lons.split(',') : []
  }));
};

exports.obtenerReportes = async (offset = 0, limit = 5, provincia = '', localidad = '', tipo = '', year = '', month = '', day = '', hora = '') => {
  let query = `
    SELECT r.*, u.usuario
    FROM reportes r
    JOIN usuarios u ON r.FK_ID_usuarios = u.ID_usuarios
    WHERE 1
  `;
  const params = [];

  if (provincia) { query += ' AND r.provincia = ?'; params.push(provincia); }
  if (localidad) { query += ' AND r.localidad = ?'; params.push(localidad); }
  if (tipo) { query += ' AND r.tipo_crimen LIKE ?'; params.push(`%${tipo}%`); }

  if (year) {
    query += ' AND YEAR(r.fecha_hora) = ?';
    params.push(year);
  }
  if (month) {
    query += ' AND MONTH(r.fecha_hora) = ?';
    params.push(month);
  }
  if (day) {
    query += ' AND DAY(r.fecha_hora) = ?';
    params.push(day);
  }
  if (hora !== '') {
    query += ' AND HOUR(r.fecha_hora) = ?';
    params.push(hora);
  }

  query += ' ORDER BY r.fecha_hora DESC LIMIT ?, ?';
  params.push(offset, limit);

  const [rows] = await db.query(query, params);
  return rows;
};

exports.obtenerTendencias = async () => {
  const [rows] = await db.query(`
    SELECT DATE_FORMAT(fecha_hora, '%Y-%m') AS mesAnio, COUNT(*) AS total
    FROM reportes
    GROUP BY mesAnio
    ORDER BY mesAnio
  `);
  return rows;
};