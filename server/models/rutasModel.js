// server/models/rutasModel.js
const db = require("../config/db");

// Calcular distancia (Haversine)
function distanciaMetros(a, b) {
  const R = 6371e3;
  const rad = x => (x * Math.PI) / 180;
  const φ1 = rad(a[1]);
  const φ2 = rad(b[1]);
  const Δφ = rad(b[1] - a[1]);
  const Δλ = rad(b[0] - a[0]);
  const d =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(d), Math.sqrt(1 - d));
}

// Función para obtener rutas desde OSRM
async function obtenerRutasOSRM(origen, destino, mode = 'foot', alternativas = 3) {
  const fetch = (await require('node-fetch')).default;
  const [olat, olon] = origen.split(",");
  const [dlat, dlon] = destino.split(",");
  const url = `http://router.project-osrm.org/route/v1/${mode}/${olon},${olat};${dlon},${dlat}?alternatives=${alternativas}&geometries=geojson&overview=full`;
  const res = await fetch(url);
  const data = await res.json();
  return data.routes || [];
}

async function obtenerRiesgoTramos(geometry) {
  const coords = geometry.coordinates;
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;

  // Calcular bounding box
  coords.forEach(c => {
    minLon = Math.min(minLon, c[0]);
    maxLon = Math.max(maxLon, c[0]);
    minLat = Math.min(minLat, c[1]);
    maxLat = Math.max(maxLat, c[1]);
  });

  const buffer = 0.001; // ~100m en lat/lon
  const [rows] = await db.query(
    `SELECT lat, lon FROM reportes 
     WHERE lat BETWEEN ? AND ? AND lon BETWEEN ? AND ?`,
    [minLat - buffer, maxLat + buffer, minLon - buffer, maxLon + buffer]
  );

  const tramos = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const a = coords[i];
    const b = coords[i + 1];
    const dist = distanciaMetros(a, b); // Distancia en metros
    const mid = [(a[1] + b[1]) / 2, (a[0] + b[0]) / 2]; // Punto medio

    // Filtrar reportes cercanos
    const cercanos = rows.filter(r => distanciaMetros([r.lon, r.lat], [mid[1], mid[0]]) < 100).length;
    const riesgo = Math.min(1, cercanos / 5); // Riesgo basado en cercanía (máx 1)

    // Estimaciones basadas en datos disponibles
    const iluminacion = 1 - Math.min(0.8, cercanos / 10); // Menor iluminación con más reportes (0 a 1)
    const gente = Math.min(1, cercanos / 5); // Densidad de gente proporcional a reportes (0 a 1)
    const tiempo = dist / 1.4; // Tiempo en segundos (velocidad caminando ~1.4 m/s)

    tramos.push({ dist, riesgo, iluminacion, gente, tiempo });
  }

  return tramos;
}

// Calcular el "fitness" de una ruta según los tramos
function evaluarRuta(tramos, pesos) {
  const { alpha, beta, gamma, delta } = pesos;
  let total = 0;
  for (const t of tramos) {
    const penalizacion =
      alpha * t.dist +
      beta * t.riesgo -
      gamma * t.iluminacion -
      delta * t.gente;
    total += penalizacion;
  }
  return total;
}
class PriorityQueue {
  constructor() {
    this.elements = [];
  }
  enqueue(element, priority) {
    this.elements.push({ element, priority });
    this.elements.sort((a, b) => a.priority - b.priority);
  }
  dequeue() {
    return this.elements.shift();
  }
  isEmpty() {
    return this.elements.length === 0;
  }
}

function dijkstra(graph, start, end) {
  const distances = { [start]: 0 };
  const prev = {};
  const pq = new PriorityQueue();
  pq.enqueue(start, 0);

  while (!pq.isEmpty()) {
    const u = pq.dequeue().element;
    if (u === end) break;
    for (let neighbor in graph[u]) {
      const alt = distances[u] + graph[u][neighbor];
      if (!distances[neighbor] || alt < distances[neighbor]) {
        distances[neighbor] = alt;
        prev[neighbor] = u;
        pq.enqueue(neighbor, alt);
      }
    }
  }

  // Reconstruir ruta
  let path = [];
  let u = end;
  while (u !== undefined) { path.push(u); u = prev[u]; }
  return path.reverse();
}

// Función para convertir GeoJSON en grafo
function buildGraphFromGeoJSON(geojson) {
  const graph = {};
  geojson.features.forEach((feature, index) => {
    const coords = feature.geometry.coordinates;
    const id = `node_${index}`;
    graph[id] = {};

    // Conectar con nodos cercanos (simplificación: asume intersecciones básicas)
    geojson.features.forEach((otherFeature, otherIndex) => {
      if (index !== otherIndex) {
        const otherCoords = otherFeature.geometry.coordinates;
        const dist = distanciaMetros(coords[0], otherCoords[0]);
        if (dist < 100) { // Umbral de conexión (ajustable)
          graph[id][`node_${otherIndex}`] = dist;
        }
      }
    });
  });
  return graph;
}

module.exports = {
  distanciaMetros,
  obtenerRutasOSRM,
  obtenerRiesgoTramos,
  evaluarRuta,
  dijkstra,
  buildGraphFromGeoJSON
};