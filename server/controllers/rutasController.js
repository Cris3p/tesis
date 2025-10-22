// server/controllers/rutasController.js
const { distanciaMetros, obtenerRutasOSRM, obtenerRiesgoTramos, evaluarRuta, dijkstra, buildGraphFromGeoJSON } = require('../models/rutasModel');
const fs = require('fs');
const path = require('path');


exports.obtenerRutaSegura = async (req, res) => {
 
    const { origen, destino, mode = 'foot' } = req.query; // Modo default foot

    if (!origen || !destino) {
      return res.status(400).json({ error: "Faltan parámetros: origen y destino." });
    }
   try {
    const basePath = path.join(process.cwd(), '..','public', 'data', 'tortuGB.geojson');
    console.log("Intentando leer archivo en:", basePath);
    const geojsonData = await fs.readFileSync(basePath, 'utf8');
    const geojson = JSON.parse(geojsonData);
    // Obtener rutas de OSRM con modo
    const rutas = await obtenerRutasOSRM(origen, destino, mode, 3);

    if (!rutas || rutas.length === 0) {
      // Fallback a GeoJSON si OSRM falla
      const [olat, olon] = origen.split(",").map(Number);
      const [dlat, dlon] = destino.split(",").map(Number);
      const startPoint = [olat, olon];
      const endPoint = [dlat, dlon];

      const graph = buildGraphFromGeoJSON(geojson);

      let startNode = null, endNode = null;
      geojson.features.forEach((feature, index) => {
        const coords = feature.geometry.coordinates[0];
        if (distanciaMetros(coords, startPoint) < 200) startNode = `node_${index}`;
        if (distanciaMetros(coords, endPoint) < 200) endNode = `node_${index}`;
      });

    if (!rutas || rutas.length === 0) {
      // Fallback a GeoJSON si OSRM falla
      const [olat, olon] = origen.split(",").map(Number);
      const [dlat, dlon] = destino.split(",").map(Number);
      const startPoint = [olat, olon];
      const endPoint = [dlat, dlon];

      const graph = buildGraphFromGeoJSON(geojson);

      let startNode = null, endNode = null;
      geojson.features.forEach((feature, index) => {
        const coords = feature.geometry.coordinates[0];
        if (distanciaMetros(coords, startPoint) < 200) startNode = `node_${index}`;
        if (distanciaMetros(coords, endPoint) < 200) endNode = `node_${index}`;
      });

      if (!startNode || !endNode) {
        return res.status(404).json({ error: "No se encontraron nodos cercanos." });
      }

      const path = dijkstra(graph, startNode, endNode);

      const ruta = {
        geometry: {
          coordinates: path.map(nodeId => geojson.features[parseInt(nodeId.split('_')[1])].geometry.coordinates[0])
        }
      };

      const tramos = await obtenerRiesgoTramos(ruta.geometry);
      const tiempoAjustado = tramos.reduce((acc, t) => acc + (t.tiempo || 0) * (1 + (t.riesgo || 0) * 0.3), 0);
      const distancia = tramos.reduce((acc, t) => acc + t.dist, 0); // Calcula distancia total

      res.json({
        mensaje: "Ruta segura calculada correctamente.",
        ruta: ruta.geometry,
        distancia_m: distancia,
        duracion_ajustada_s: tiempoAjustado,
      });
    } else {
      // Usar OSRM
      const mejorRuta = rutas[0]; // Toma la primera como mejor por ahora
      const tramos = await obtenerRiesgoTramos(mejorRuta.geometry);
      const tiempoAjustado = tramos.reduce((acc, t) => acc + (t.tiempo || 0) * (1 + (t.riesgo || 0) * 0.3), 0);
      const distancia = mejorRuta.distance || tramos.reduce((acc, t) => acc + t.dist, 0);

      res.json({
        mensaje: "Ruta segura calculada correctamente.",
        ruta: mejorRuta.geometry,
        distancia_m: distancia,
        duracion_ajustada_s: tiempoAjustado,
      });
    }
  }} catch (err) {
    console.error("Error al calcular ruta segura:", err);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};
