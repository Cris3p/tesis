async function obtenerRutaSegura(origen, destino, mode = 'foot', retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    console.log(`Intento ${attempt} de ${retries} para /rutas/segura con origen: ${origen}, destino: ${destino}`);
    try {
      // Limpiar rutas anteriores antes de obtener la nueva
      map.eachLayer(layer => {
        if (layer instanceof L.Polyline) map.removeLayer(layer);
      });
      if (routingControl) {
        map.removeControl(routingControl);
        routingControl = null;
      }

      const res = await fetch(`/rutas/segura?origen=${encodeURIComponent(origen)}&destino=${encodeURIComponent(destino)}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      console.log("Datos de ruta recibidos:", data);

      const coords = data.ruta.coordinates.map(c => [c[1], c[0]]);
      L.polyline(coords, { color: "#b31877ff", weight: 5 }).addTo(map);

      const tiempo = (data.duracion_ajustada_s / 60).toFixed(1);
      let tiempoPanel = document.getElementById('tiempoPanel');
      if (!tiempoPanel) {
        tiempoPanel = document.createElement('div');
        tiempoPanel.id = 'tiempoPanel';
        document.getElementById('map').appendChild(tiempoPanel);
      }
      tiempoPanel.innerHTML = `<strong>Tiempo estimado:</strong> ${tiempo} minutos`;
      tiempoPanel.classList.add('visible');
      return; // Salir si funciona
    } catch (err) {
      console.error(`Intento ${attempt} falló:`, err);
      if (attempt === retries) {
        let tiempoPanel = document.getElementById('tiempoPanel');
        if (tiempoPanel) {
          tiempoPanel.innerHTML = `<strong>Error:</strong> No se pudo calcular la ruta.`;
          tiempoPanel.classList.add('visible');
        }
      }
      if (attempt < retries) await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
}