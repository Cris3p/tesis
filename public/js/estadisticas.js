const themeApex = {
  chart: {
    toolbar: { show: false },
    foreColor: '#e4e6eb', // --texto
    background: '#14121a' // --negro-principal
  },
  tooltip: {
    theme: 'dark',
    style: {
      background: '#14121a', // --negro-principal
      color: '#e4e6eb' // --texto
    }
  },
  colors: ['#5b3ea1', '#3e2c6d', '#8a75c9'], // --violeta-vivo, --violeta-principal, --violeta-claro
  legend: {
    labels: {
      colors: '#e4e6eb' // --texto
    }
  },
  xaxis: {
    labels: {
      style: {
        colors: '#e4e6eb' // --texto
      }
    }
  },
  yaxis: {
    labels: {
      style: {
        colors: '#e4e6eb' // --texto
      }
    }
  }
};

// ---------------- MAPA DE PROVINCIAS ----------------
const chartMapa = echarts.init(document.getElementById('map'));
const info = document.getElementById('info');

async function cargarMapa() {
  try {
    const data = await fetch('/estadisticas/mapa').then(r => r.json());
    const geoJson = await fetch('../data/ar.json').then(r => r.json());

    echarts.registerMap('argentina', geoJson, { nameProperty: 'shapeName' });

    const option = {
      backgroundColor: '#14121a', // --negro-principal
      tooltip: {
        trigger: 'item',
        formatter: '{c} reportes',
        backgroundColor: '#14121a', // --negro-principal
        borderColor: '#3e2c6d', // --violeta-principal
        textStyle: {
          color: '#e4e6eb' // --texto
        }
      },
      visualMap: {
        min: 0,
        max: Math.max(...data.map(d => d.total)),
        left: 'right',
        top: 'bottom',
        text: ['Alto', 'Bajo'],
        calculable: true,
        inRange: {
          color: ['#8a75c9', '#5b3ea1'] // --violeta-claro a --violeta-vivo
        },
        formatter: '{value} reportes',
        textStyle: {
          color: '#e4e6eb' // --texto
        }
      },
      series: [{
        name: 'Reportes',
        type: 'map',
        map: 'argentina',
        roam: true,
        data: data.map(d => ({ name: d.provincia, value: d.total })),
        label: {
          color: '#e4e6eb', // --texto
          fontSize: 10,
          fontWeight: 'bold'
        },
        emphasis: {
          label: { show: true },
          itemStyle: { areaColor: '#5b3ea1' } // --violeta-vivo
        }
      }]
    };

    chartMapa.setOption(option);
    chartMapa.resize(); // Asegurar que el canvas se ajuste al contenedor

    window.addEventListener('resize', () => chartMapa.resize());

    chartMapa.on('click', params => {
      info.innerText = `Provincia: ${params.name}  |  Total reportes: ${params.value || 0}`;
    });
  } catch (err) {
    console.error("Error cargando mapa:", err);
  }
}

// ---------------- ESTADÍSTICAS ----------------
async function cargarEstadisticas() {
  try {
    const { usuarios, iluminacion, afluencia, horas } = await fetch('/estadisticas/').then(r => r.json());

    // ---------------- GÉNERO ----------------
    console.log('Datos de usuarios:', usuarios); // Depuración
    if (!usuarios || !Array.isArray(usuarios) || usuarios.length === 0) {
      console.error('Error: datos de usuarios inválidos o vacíos');
      document.querySelector('#graficoGenero').innerHTML = '<p style="text-align: center; color: #e4e6eb;">No hay datos de género disponibles</p>';
      return;
    }

    const conteoGenero = usuarios.reduce((acc, u) => {
      if (u.genero) { // Verificar que u.genero exista
        acc[u.genero] = (acc[u.genero] || 0) + 1;
      }
      return acc;
    }, {});
    console.log('Datos de género:', conteoGenero); // Depuración
    const totalGenero = Object.values(conteoGenero).reduce((sum, val) => sum + val, 0);
    if (totalGenero === 0) {
      console.error('Error: no se encontraron géneros válidos');
      document.querySelector('#graficoGenero').innerHTML = '<p style="text-align: center; color: #e4e6eb;">No hay datos de género disponibles</p>';
      return;
    }
    const porcentajesGenero = Object.values(conteoGenero).map(val => (val / totalGenero * 100).toFixed(1));
    console.log('Porcentajes de género:', porcentajesGenero); // Depuración
    console.log('Contenedor gráfico género:', document.querySelector("#graficoGenero")); // Depuración
    const chartGenero = new ApexCharts(document.querySelector("#graficoGenero"), {
      series: Object.values(conteoGenero),
      chart: { type: 'pie', height: 250, background: '#14121a' },
      labels: Object.keys(conteoGenero),
      colors: ['#5b3ea1', '#3e2c6d', '#8a75c9'], // --violeta-vivo, --violeta-principal, --violeta-claro
      legend: { position: 'bottom', labels: { colors: '#e4e6eb' } },
      tooltip: { theme: 'dark' }
    });
    try {
      chartGenero.render();
    } catch (err) {
      console.error('Error renderizando gráfico de género:', err);
      document.querySelector('#graficoGenero').innerHTML = '<p style="text-align: center; color: #e4e6eb;">Error al cargar el gráfico de género</p>';
    }

    // ---------------- EDADES ----------------
    const conteoEdad = usuarios.reduce((acc, u) => {
      acc[u.edad] = (acc[u.edad] || 0) + 1;
      return acc;
    }, {});
    const totalEdad = Object.values(conteoEdad).reduce((sum, val) => sum + val, 0);
    const porcentajesEdad = Object.values(conteoEdad).map(val => (val / totalEdad * 100).toFixed(1));
    const edades = Object.keys(conteoEdad).sort((a, b) => a - b);
    const chartEdad = new ApexCharts(document.querySelector("#graficoEdad"), {
      series: [{ name: 'Porcentaje', data: porcentajesEdad }],
      chart: { type: 'bar', height: 250, background: '#14121a' },
      xaxis: { categories: edades, labels: { style: { colors: '#e4e6eb' } } },
      yaxis: {
        labels: {
          style: { colors: '#e4e6eb' },
          formatter: (val) => `${val}%`
        }
      },
      colors: ['#5b3ea1'],
      tooltip: {
        theme: 'dark',
        y: {
          formatter: (val) => `${val}%`
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (val) => `${val}%`
      },
      fill: { opacity: 1 } // Evitar cambio de opacidad en hover
    });
    chartEdad.render();

    // ---------------- ILUMINACIÓN ----------------
    const totalIlum = iluminacion.reduce((sum, i) => sum + i.total, 0);
    const porcentajesIlum = iluminacion.map(i => (i.total / totalIlum * 100).toFixed(1));
    const chartIlum = new ApexCharts(document.querySelector("#graficoIluminacion"), {
      series: [{ name: 'Porcentaje', data: porcentajesIlum }],
      chart: { type: 'bar', height: 250, background: '#14121a' },
      xaxis: {
        categories: iluminacion.map(i => i.iluminacion ? 'Iluminado' : 'Oscuro'),
        labels: { style: { colors: '#e4e6eb' } }
      },
      yaxis: {
        labels: {
          style: { colors: '#e4e6eb' },
          formatter: (val) => `${val}%`
        }
      },
      colors: ['#5b3ea1'],
      tooltip: {
        theme: 'dark',
        y: {
          formatter: (val) => `${val}%`
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (val) => `${val}%`
      },
      fill: { opacity: 1 } // Evitar cambio de opacidad en hover
    });
    chartIlum.render();

    // ---------------- AFLUENCIA ----------------
    const totalAflu = afluencia.reduce((sum, a) => sum + a.total, 0);
    const porcentajesAflu = afluencia.map(a => (a.total / totalAflu * 100).toFixed(1));
    const chartAflu = new ApexCharts(document.querySelector("#graficoAfluencia"), {
      series: [{ name: 'Porcentaje', data: porcentajesAflu }],
      chart: { type: 'bar', height: 250, background: '#14121a' },
      xaxis: {
        categories: afluencia.map(a => a.gente ? 'Había gente' : 'No había gente'),
        labels: { style: { colors: '#e4e6eb' } }
      },
      yaxis: {
        labels: {
          style: { colors: '#e4e6eb' },
          formatter: (val) => `${val}%`
        }
      },
      colors: ['#8a75c9'],
      tooltip: {
        theme: 'dark',
        y: {
          formatter: (val) => `${val}%`
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (val) => `${val}%`
      },
      fill: { opacity: 1 } // Evitar cambio de opacidad en hover
    });
    chartAflu.render();

    // ---------------- HORAS ----------------
    const chartHoras = new ApexCharts(document.querySelector("#graficoHoras"), {
      series: [{ name: 'Cantidad', data: horas.map(h => h.total) }],
      chart: {
        type: 'line',
        height: 250,
        toolbar: { show: true },
        background: '#14121a' // --negro-principal
      },
      xaxis: {
        categories: horas.map(h => `${h.hora}hs`), // Añadir "hs" a las horas
        labels: { style: { colors: '#e4e6eb' } }
      },
      yaxis: { labels: { style: { colors: '#e4e6eb' } } },
      colors: ['#3e2c6d'],
      stroke: { curve: 'smooth' },
      tooltip: { theme: 'dark' },
      theme: {
        monochrome: { enabled: false },
        mode: 'dark'
      }
    });
    chartHoras.render();
  } catch (err) {
    console.error("Error cargando estadísticas:", err);
  }
}

// ---------------- REPORTES RECIENTES ----------------
document.addEventListener("DOMContentLoaded", () => {
  const provinciaSelect = document.getElementById("provinciaSelect");
  const localidadSelect = document.getElementById("localidadSelect");
  const tipoSelect = document.getElementById("tipoSelect");
  const anioSelect = document.getElementById("anioSelect");
  const mesSelect = document.getElementById("mesSelect");
  const diaSelect = document.getElementById("diaSelect");
  const horaSelect = document.getElementById("horaSelect");
  const reportesBody = document.getElementById("reportesBody");
  const verMasBtn = document.getElementById("verMasBtn");

  let offset = 0;
  const limit = 5;
  let filtros = { provincia: '', localidad: '', tipo: '', anio: '', mes: '', dia: '', hora: '' };

  //------------------- Cargar provincias ----------------
  async function cargarProvincias() {
    try {
      const res = await fetch("/estadisticas/provincias");
      const provincias = await res.json();
      provinciaSelect.innerHTML = '<option value="">Todas</option>';
      provincias.forEach(prov => {
        const option = document.createElement("option");
        option.value = prov.provincia;
        option.textContent = prov.provincia;
        provinciaSelect.appendChild(option);
      });
    } catch (err) { console.error(err); }
  }

  //------------------- Cargar localidades ----------------
  async function cargarLocalidades() {
    const provincia = provinciaSelect.value;
    localidadSelect.innerHTML = '<option value="">Todas</option>';
    if (!provincia) { localidadSelect.disabled = true; return; }
    try {
      const res = await fetch(`/estadisticas/localidades?provincia=${provincia}`);
      const localidades = await res.json();
      localidades.forEach(loc => {
        const option = document.createElement("option");
        option.value = loc.localidad;
        option.textContent = loc.localidad;
        localidadSelect.appendChild(option);
      });
      localidadSelect.disabled = false;
    } catch (err) { console.error(err); }
  }

  //------------------- Llenar selects de fecha ----------------
  function cargarSelectsFecha() {
    // Año
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 2000; y--) {
      const option = document.createElement("option");
      option.value = y;
      option.textContent = y;
      anioSelect.appendChild(option);
    }
    // Mes
    for (let m = 1; m <= 12; m++) {
      const option = document.createElement("option");
      option.value = m;
      option.textContent = m;
      mesSelect.appendChild(option);
    }
    // Día
    for (let d = 1; d <= 31; d++) {
      const option = document.createElement("option");
      option.value = d;
      option.textContent = d;
      diaSelect.appendChild(option);
    }
    // Hora
    for (let h = 0; h <= 23; h++) {
      const option = document.createElement("option");
      option.value = h;
      option.textContent = h;
      horaSelect.appendChild(option);
    }
  }

  //------------------- Cargar reportes ----------------
  async function cargarReportes(reset = true) {
    if (reset) { reportesBody.innerHTML = ''; offset = 0; verMasBtn.style.display = "block"; }

    filtros.provincia = provinciaSelect.value;
    filtros.localidad = localidadSelect.value;
    filtros.tipo = tipoSelect.value;
    filtros.anio = anioSelect.value;
    filtros.mes = mesSelect.value;
    filtros.dia = diaSelect.value;
    filtros.hora = horaSelect.value;

    const query = new URLSearchParams({
      provincia: filtros.provincia,
      localidad: filtros.localidad,
      tipo: filtros.tipo,
      anio: filtros.anio,
      mes: filtros.mes,
      dia: filtros.dia,
      hora: filtros.hora,
      offset,
      limit
    });

    try {
      const res = await fetch(`/estadisticas/reportes/recientes?${query}`);
      const data = await res.json();

      if (reset && data.length === 0) {
        reportesBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No hay reportes</td></tr>`;
        verMasBtn.style.display = "none";
        return;
      }

      data.forEach(r => {
        const fechaObj = new Date(r.fecha_hora);
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${fechaObj.toLocaleDateString()}</td>
          <td>${fechaObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
          <td>${r.provincia}</td>
          <td>${r.localidad}</td>
          <td>${r.tipo_crimen}</td>
        `;
        reportesBody.appendChild(tr);
      });

      if (data.length < limit) verMasBtn.style.display = "none";
      offset += data.length;
    } catch (err) {
      console.error(err);
      reportesBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Error al cargar reportes</td></tr>`;
    }
  }

  function mostrarToast(mensaje) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerText = mensaje;
    document.body.appendChild(toast);

    setTimeout(() => { toast.style.opacity = "0"; }, 2000);
    setTimeout(() => { document.body.removeChild(toast); }, 2500);
  }

  //------------------- EVENTOS ----------------
  provinciaSelect.addEventListener("change", async () => { await cargarLocalidades(); cargarReportes(true); });
  localidadSelect.addEventListener("change", () => cargarReportes(true));
  tipoSelect.addEventListener("change", () => cargarReportes(true));
  anioSelect.addEventListener("change", () => cargarReportes(true));
  mesSelect.addEventListener("change", () => cargarReportes(true));
  diaSelect.addEventListener("change", () => cargarReportes(true));
  horaSelect.addEventListener("change", () => cargarReportes(true));
  verMasBtn.addEventListener("click", () => cargarReportes(false));

  //------------------- INICIO ----------------
  cargarMapa();
  cargarEstadisticas();
  cargarProvincias();
  cargarLocalidades();
  cargarSelectsFecha();
  cargarReportes(true);
});