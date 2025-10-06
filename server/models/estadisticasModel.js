const db = require("../config/db");

exports.obtenerDatosMapa = async () => {
  const [rows] = await db.query(`
    SELECT provincia, COUNT(*) AS total
    FROM reportes
    GROUP BY provincia
  `);
  return rows;
};

exports.obtenerEstadisticas = async () => {
  const [usuarios] = await db.query(`
    SELECT genero, YEAR(CURDATE()) - YEAR(fecha_nac) AS edad
    FROM usuarios
  `);

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

  return { usuarios, iluminacion, afluencia, horas };
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
  let query = `SELECT DISTINCT localidad FROM reportes WHERE localidad IS NOT NULL AND localidad <> ''`;
  const params = [];
  if (provincia) { query += ' AND provincia = ?'; params.push(provincia); }
  query += ' ORDER BY localidad';
  const [rows] = await db.query(query, params);
  return rows;
};

exports.obtenerReportes = async (offset = 0, limit = 5, provincia = '', localidad = '', tipo = '', year = '', month = '', day = '', hora = '') => {
  let query = `
    SELECT r.*, u.usuario
    FROM reportes r
    JOIN usuarios u ON r.id_usuario = u.id_usuario
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