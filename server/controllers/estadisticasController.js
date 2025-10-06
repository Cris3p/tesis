const estadisticasModel = require("../models/estadisticasModel");

exports.obtenerDatosMapa = async (req, res) => {
  try {
    const data = await estadisticasModel.obtenerDatosMapa();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al obtener datos del mapa" });
  }
};

exports.obtenerEstadisticas = async (req, res) => {
  try {
    const data = await estadisticasModel.obtenerEstadisticas();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al obtener estadísticas" });
  }
};

exports.obtenerProvincias = async (req, res) => {
  try {
    const data = await estadisticasModel.obtenerProvincias();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al obtener provincias" });
  }
};

exports.obtenerLocalidades = async (req, res) => {
  try {
    const provincia = req.query.provincia || '';
    const data = await estadisticasModel.obtenerLocalidades(provincia);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al obtener localidades" });
  }
};

exports.obtenerReportes = async (req, res) => {
  try {
    const offset = Number(req.query.offset) || 0;
    const limit = Number(req.query.limit) || 5;
    const provincia = req.query.provincia || '';
    const localidad = req.query.localidad || '';
    const tipo = req.query.tipo || '';
    const year = req.query.anio || '';
    const month = req.query.mes || '';
    const day = req.query.dia || '';
    const hora = req.query.hora || '';

    const data = await estadisticasModel.obtenerReportes(
      offset, limit, provincia, localidad, tipo, year, month, day, hora
    );

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al obtener reportes recientes" });
  }
};
