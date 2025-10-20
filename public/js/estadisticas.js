const swalConfig = {
  confirmButtonColor: '#5b3ea1',
  background: '#1f1c29',
  color: '#e4e6eb',
  iconColor: '#5b3ea1',
  heightAuto: false
};

// Función para obtener altura responsiva
function getChartHeight() {
  const width = window.innerWidth;
  if (width <= 360) return 200;
  if (width <= 480) return 240;
  if (width <= 768) return 260;
  return 280;
}

function getChartHeightLarge() {
  const width = window.innerWidth;
  if (width <= 360) return 220;
  if (width <= 480) return 260;
  if (width <= 768) return 300;
  return 320;
}

function getTendenciasHeight() {
  const width = window.innerWidth;
  if (width <= 360) return 250;
  if (width <= 480) return 290;
  if (width <= 768) return 330;
  return 380;
}

const themeApex = {
  chart: {
    toolbar: { show: false },
    foreColor: '#a991d4',
    background: 'transparent'
  },
  tooltip: {
    theme: 'dark',
    style: {
      background: '#1f1c29',
      color: '#e4e6eb'
    }
  },
  colors: ['#a991d4', '#8a75c9', '#5b3ea1'],
  legend: {
    labels: {
      colors: '#a991d4'
    }
  },
  xaxis: {
    labels: {
      style: {
        colors: '#a991d4',
        fontSize: '12px',
        fontWeight: 500
      }
    }
  },
  yaxis: {
    labels: {
      style: {
        colors: '#a991d4',
        fontSize: '12px',
        fontWeight: 500
      }
    }
  },
  grid: {
    borderColor: 'rgba(138, 117, 201, 0.2)',
    strokeDashArray: 4
  }
};

function styleApexToolbar() {
  setTimeout(() => {
    const toolbars = document.querySelectorAll('.apexcharts-toolbar');
    toolbars.forEach(toolbar => {
      toolbar.style.background = 'rgba(31, 28, 41, 0.95)';
      toolbar.style.borderRadius = '8px';
      toolbar.style.padding = '8px 12px';
      toolbar.style.margin = '8px';
      toolbar.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.4)';

      const buttons = toolbar.querySelectorAll('button');
      buttons.forEach(btn => {
        btn.style.color = '#a991d4';
        btn.style.transition = 'all 0.3s ease';
        btn.addEventListener('mouseover', () => {
          btn.style.color = '#8a75c9';
          btn.style.background = 'rgba(91, 62, 161, 0.3)';
          btn.style.borderRadius = '6px';
        });
        btn.addEventListener('mouseout', () => {
          btn.style.color = '#a991d4';
          btn.style.background = 'transparent';
        });
      });
    });

    const menus = document.querySelectorAll('.apexcharts-menu');
    menus.forEach(menu => {
      menu.style.background = '#1f1c29';
      menu.style.border = '1px solid #3e2c6d';
      menu.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.6)';
    });

    const menuItems = document.querySelectorAll('.apexcharts-menu-item');
    menuItems.forEach(item => {
      item.style.color = '#e4e6eb';
      item.addEventListener('mouseover', () => {
        item.style.background = 'rgba(91, 62, 161, 0.3)';
        item.style.color = '#a991d4';
      });
      item.addEventListener('mouseout', () => {
        item.style.background = 'transparent';
        item.style.color = '#e4e6eb';
      });
    });
  }, 300);
}

// Objetos globales para los gráficos
let chartIlum = null;
let chartAflu = null;
let chartHoras = null;
let chartTendencias = null;

// ============== MAPA ============== 
let chartMapa = echarts.init(document.getElementById('map'));
const info = document.getElementById('info');

let originalOption;
let botonRetroceder = null;

function normalizarNombre(nombre) {
  if (!nombre) return '';
  if (nombre.toLowerCase().includes('ciudad aut') || nombre.toLowerCase().includes('comuna') || nombre.toLowerCase() === 'caba') {
    return 'caba';
  }
  return nombre
    .toString()
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

function esCoordenadaValida(lon, lat) {
  return !isNaN(lon) && !isNaN(lat) && lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90;
}

async function cargarMapa() {
  try {
    const data = await fetch('/estadisticas/mapa').then(r => r.json());
    const geoJson = await fetch('../data/ar.json').then(r => r.json());

    geoJson.features.forEach(f => {
      const rawName = f.properties.name || f.properties.shapeName || f.properties.NOMBRE || f.properties.provincia || f.properties.PROVINCIA;
      f.properties.name = normalizarNombre(rawName);
    });

    const provinciasGeoJson = geoJson.features.map(f => f.properties.name);
    const totalesPorProvincia = {};
    data.forEach(d => {
      totalesPorProvincia[normalizarNombre(d.provincia)] = d.total;
    });

    const dataProvincias = provinciasGeoJson.map(nombre => ({
      name: nombre,
      value: totalesPorProvincia[nombre] || 0
    }));

    echarts.registerMap('argentina', geoJson, { nameProperty: 'name' });

    const maxProv = Math.max(...dataProvincias.map(d => d.value));
    const option = {
      backgroundColor: '#14121a',
      tooltip: {
        trigger: 'item',
        formatter: function (params) {
          if (!params.value || params.value === 0) return 'Sin reportes';
          return `<strong>${params.name}</strong><br/>${params.value} reportes`;
        },
        backgroundColor: '#1f1c29',
        borderColor: '#8a75c9',
        textStyle: { color: '#e4e6eb' },
        borderRadius: 8,
        padding: 10
      },
      visualMap: {
        min: 0,
        max: maxProv > 0 ? maxProv : 1,
        left: 'right',
        top: 'bottom',
        text: ['Alto', 'Bajo'],
        calculable: true,
        inRange: { color: ['#fffbff', '#9d6fc2ff', '#7e509eff', '#792eafff', '#621d93ff'] },
        outOfRange: { color: ['#fffbff'] },
        formatter: '{value} reportes',
        textStyle: { color: '#e4e6eb' }
      },
      series: [{
        name: 'Reportes',
        type: 'map',
        map: 'argentina',
        roam: true,
        data: dataProvincias,
        label: {
          color: '#e4e6eb',
          fontSize: 11,
          fontWeight: 'bold',
          show: false
        },
        itemStyle: {
          areaColor: '#f5f3f8',
          borderColor: '#8a75c9',
          borderWidth: 0.5
        },
        emphasis: {
          label: { show: true },
          itemStyle: {
            areaColor: '#8a75c9',
            borderColor: '#a991d4',
            borderWidth: 2
          }
        }
      }]
    };

    originalOption = option;
    chartMapa.setOption(option);
    chartMapa.resize();

    window.addEventListener('resize', () => chartMapa.resize());
  } catch (err) {
    console.error("Error cargando mapa:", err);
    info.innerText = `Error al cargar mapa`;
    Swal.fire({
      ...swalConfig,
      icon: 'error',
      title: 'Error al cargar mapa',
      text: 'No se pudieron cargar los datos del mapa: ' + err.message
    });
  }
}

function registrarEventoClic() {
  chartMapa.on('click', async params => {
    if (params.componentType !== 'series') return;

    const provincia = params.name;
    if (!provincia) {
      info.innerText = 'Provincia no válida';
      return;
    }

    const data = await fetch('/estadisticas/mapa').then(r => r.json());
    const provinciaOriginal = data.find(d => normalizarNombre(d.provincia) === provincia)?.provincia || provincia;
    info.innerText = `Provincia: ${provinciaOriginal} | Cargando departamentos...`;

    try {
      const dataDepartamentos = await fetch(`/estadisticas/departamentos/${encodeURIComponent(provinciaOriginal)}`).then(r => r.json());
      const geoJsonResponse = await fetch('/data/departamentos-argentina.json').then(r => r.json());

      geoJsonResponse.features.forEach(f => {
        f.properties.provincia = normalizarNombre(f.properties.provincia || f.properties.PROVINCIA || f.properties.shapeName);
        f.properties.name = normalizarNombre(f.properties.departamento || f.properties.name || 'CABA');
      });

      const geoJsonDepartamentos = geoJsonResponse.features.filter(f =>
        f.properties.provincia === normalizarNombre(provinciaOriginal) ||
        (provinciaOriginal === 'Buenos Aires' && f.properties.provincia === 'caba')
      );

      if (geoJsonDepartamentos.length === 0) {
        info.innerText = `Provincia: ${provinciaOriginal} | No hay departamentos en el GeoJSON`;
        return;
      }

      let finalGeoJsonDepartamentos = geoJsonDepartamentos;
      let cabaData = null;
      if (provinciaOriginal === 'Buenos Aires') {
        const cabaFeatures = geoJsonDepartamentos.filter(f => f.properties.provincia === 'caba');
        if (cabaFeatures.length > 0) {
          const cabaGeometry = {
            type: 'MultiPolygon',
            coordinates: cabaFeatures.reduce((acc, f) => {
              if (f.geometry.type === 'Polygon') {
                acc.push(f.geometry.coordinates);
              } else if (f.geometry.type === 'MultiPolygon') {
                acc.push(...f.geometry.coordinates);
              }
              return acc;
            }, [])
          };
          const cabaFeature = {
            type: 'Feature',
            properties: {
              name: 'CABA',
              provincia: 'caba'
            },
            geometry: cabaGeometry
          };
          finalGeoJsonDepartamentos = [
            ...geoJsonDepartamentos.filter(f => f.properties.provincia !== 'caba'),
            cabaFeature
          ];
        }
        cabaData = dataDepartamentos.find(d => normalizarNombre(d.departamento) === 'caba');
      }

      const featureCollection = {
        type: 'FeatureCollection',
        features: finalGeoJsonDepartamentos
      };

      echarts.registerMap(`departamentos_${provinciaOriginal}`, featureCollection, { nameProperty: 'name' });

      const totalesPorDepto = {};
      const tipoPorDepto = {};
      for (const d of dataDepartamentos) {
        if (provinciaOriginal === 'Buenos Aires' && normalizarNombre(d.departamento) === 'caba') {
          continue;
        }
        const coords = d.lats.map((lat, i) => [parseFloat(d.lons[i]), parseFloat(lat)]).filter(c => esCoordenadaValida(c[0], c[1]));
        if (coords.length === 0) continue;

        const point = turf.point(coords[0]);
        let matchedMunicipio = null;
        for (const f of finalGeoJsonDepartamentos) {
          if (f.properties.name === 'CABA') continue;
          try {
            const polygon = f.geometry.type === 'Polygon'
              ? turf.polygon(f.geometry.coordinates)
              : turf.multiPolygon(f.geometry.coordinates);
            if (turf.booleanPointInPolygon(point, polygon)) {
              matchedMunicipio = normalizarNombre(f.properties.name);
              break;
            }
          } catch (err) {
            console.error(`Error procesando geometría:`, err.message);
          }
        }
        if (matchedMunicipio) {
          totalesPorDepto[matchedMunicipio] = (totalesPorDepto[matchedMunicipio] || 0) + d.total;
          tipoPorDepto[matchedMunicipio] = d.tipoMasComun || tipoPorDepto[matchedMunicipio] || 'Sin datos';
        }
      }

      if (cabaData) {
        totalesPorDepto['caba'] = cabaData.total;
        tipoPorDepto['caba'] = cabaData.tipoMasComun || 'Sin datos';
      }

      const dataDepartamentosNormalizados = finalGeoJsonDepartamentos.map(f => {
        const nombreFeature = f.properties.name;
        const nombreNorm = normalizarNombre(nombreFeature);
        const value = totalesPorDepto[nombreNorm] || 0;
        const tipo = tipoPorDepto[nombreNorm] || 'Sin datos';
        return {
          name: nombreFeature,
          value: value,
          tipoMasComun: tipo,
          matchedKey: nombreNorm
        };
      });

      const maxDepto = Math.max(...dataDepartamentosNormalizados.map(d => d.value));
      if (maxDepto === 0) {
        info.innerText = `Provincia: ${provinciaOriginal} | No hay reportes en esta provincia`;
      } else {
        info.innerText = `Provincia: ${provinciaOriginal} | Departamentos cargados`;
      }

      const optionLocal = {
        backgroundColor: '#14121a',
        tooltip: {
          trigger: 'item',
          formatter: function (params) {
            if (!params.value || params.value === 0) return 'Sin reportes';
            return `<strong>${params.name}</strong><br/>${params.value} reportes<br/>Tipo: ${params.data.tipoMasComun || "Sin datos"}`;
          },
          backgroundColor: '#1f1c29',
          borderColor: '#8a75c9',
          textStyle: { color: '#e4e6eb' },
          borderRadius: 8,
          padding: 10
        },
        visualMap: {
          min: 0,
          max: maxDepto > 0 ? maxDepto : 1,
          text: ['Alto', 'Bajo'],
          inRange: { color: ['#fffbff', '#9d6fc2ff', '#7e509eff', '#792eafff', '#621d93ff'] },
          outOfRange: { color: ['#fffbff'] },
          textStyle: { color: '#e4e6eb' }
        },
        series: [{
          name: 'Reportes por Departamento',
          type: 'map',
          map: `departamentos_${provinciaOriginal}`,
          roam: true,
          data: dataDepartamentosNormalizados,
          label: {
            show: false,
            color: '#e4e6eb',
            fontSize: 8
          },
          itemStyle: {
            areaColor: '#f5f3f8',
            borderColor: '#8a75c9',
            borderWidth: 1
          },
          emphasis: {
            label: { show: true },
            itemStyle: {
              areaColor: '#8a75c9',
              borderColor: '#a991d4',
              borderWidth: 2
            }
          }
        }]
      };

      chartMapa.clear();
      chartMapa.setOption(optionLocal, true);
      agregarBotonRetroceder();
    } catch (err) {
      console.error("Error cargando departamentos:", err);
      info.innerText = `Provincia: ${provinciaOriginal} | Error al cargar datos: ${err.message}`;
    }
  });
}

function agregarBotonRetroceder() {
  if (botonRetroceder) return;
  botonRetroceder = document.createElement('button');
  botonRetroceder.innerHTML = '<img src="/img/volver1.png" alt="Retroceder" style="width: 30px; height: 30px;">';
  botonRetroceder.style.position = 'absolute';
  botonRetroceder.style.top = '10px';
  botonRetroceder.style.left = '10px';
  botonRetroceder.style.background = '#14121a';
  botonRetroceder.style.border = 'none';
  botonRetroceder.style.cursor = 'pointer';
  botonRetroceder.style.borderRadius = '8px';
  botonRetroceder.style.padding = '8px';
  botonRetroceder.style.transition = 'all 0.3s';
  botonRetroceder.onmouseover = () => {
    botonRetroceder.style.background = '#3e2c6d';
    botonRetroceder.style.boxShadow = '0 4px 12px rgba(91, 62, 161, 0.5)';
  };
  botonRetroceder.onmouseout = () => {
    botonRetroceder.style.background = '#14121a';
    botonRetroceder.style.boxShadow = 'none';
  };
  botonRetroceder.onclick = () => {
    chartMapa.clear();
    chartMapa.setOption(originalOption, true);
    info.innerText = 'Haz click en una provincia';
    botonRetroceder.remove();
    botonRetroceder = null;
  };
  document.getElementById('map').appendChild(botonRetroceder);
}

document.addEventListener("DOMContentLoaded", () => {
  cargarMapa();
  registrarEventoClic();
});

// ============== ESTADÍSTICAS ==============
async function cargarEstadisticas() {
  try {
    const { iluminacion, afluencia, horas } = await fetch('/estadisticas/obtener').then(r => r.json());

    // GRÁFICO ILUMINACIÓN
    const totalIlum = iluminacion.reduce((sum, i) => sum + i.total, 0);
    const porcentajesIlum = iluminacion.map(i => (i.total / totalIlum * 100).toFixed(1));
    
    if (chartIlum) chartIlum.destroy();
    
    chartIlum = new ApexCharts(document.querySelector("#graficoIluminacion"), {
      series: [{ name: 'Porcentaje', data: porcentajesIlum }],
      chart: {
        type: 'bar',
        height: getChartHeight(),
        background: 'transparent',
        toolbar: { show: true, tools: { download: true } }
      },
      plotOptions: {
        bar: {
          borderRadius: 6,
          columnWidth: '45%',
          distributed: true,
          dataLabels: {
            position: 'middle'
          }
        }
      },
      xaxis: {
        categories: iluminacion.map(i => i.iluminacion ? 'Iluminado' : 'Oscuro'),
        labels: {
          style: {
            colors: '#a991d4',
            fontSize: '13px',
            fontWeight: 600
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: '#a991d4',
            fontSize: '12px',
            fontWeight: 500
          },
          formatter: (val) => `${val}%`
        }
      },
      colors: ['#4a90e2', '#2ecc71'],
      tooltip: {
        theme: 'dark',
        style: {
          fontSize: '13px'
        },
        y: {
          formatter: (val) => `${val}%`
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (val) => `${val}%`,
        style: {
          colors: ['#ffffff'],
          fontSize: '14px',
          fontWeight: 700
        },
        offsetY: 0
      },
      fill: {
        opacity: 1
      },
      grid: {
        borderColor: 'rgba(138, 117, 201, 0.1)',
        strokeDashArray: 0
      },
      legend: {
        show: false
      }
    });
    chartIlum.render();

    // GRÁFICO AFLUENCIA
    const totalAflu = afluencia.reduce((sum, a) => sum + a.total, 0);
    const porcentajesAflu = afluencia.map(a => (a.total / totalAflu * 100).toFixed(1));
    
    if (chartAflu) chartAflu.destroy();
    
    chartAflu = new ApexCharts(document.querySelector("#graficoAfluencia"), {
      series: [{ name: 'Porcentaje', data: porcentajesAflu }],
      chart: {
        type: 'bar',
        height: getChartHeight(),
        background: 'transparent',
        toolbar: { show: true, tools: { download: true } }
      },
      plotOptions: {
        bar: {
          borderRadius: 6,
          columnWidth: '45%',
          distributed: true,
          dataLabels: {
            position: 'middle'
          }
        }
      },
      xaxis: {
        categories: afluencia.map(a => a.gente ? 'Había gente' : 'No había gente'),
        labels: {
          style: {
            colors: '#a991d4',
            fontSize: '13px',
            fontWeight: 600
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: '#a991d4',
            fontSize: '12px',
            fontWeight: 500
          },
          formatter: (val) => `${val}%`
        }
      },
      colors: ['#ff6b6b', '#ffa502'],
      tooltip: {
        theme: 'dark',
        style: {
          fontSize: '13px'
        },
        y: {
          formatter: (val) => `${val}%`
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (val) => `${val}%`,
        style: {
          colors: ['#ffffff'],
          fontSize: '14px',
          fontWeight: 700
        },
        offsetY: 0
      },
      fill: {
        opacity: 1
      },
      grid: {
        borderColor: 'rgba(138, 117, 201, 0.1)',
        strokeDashArray: 0
      },
      legend: {
        show: false
      }
    });
    chartAflu.render();

    // GRÁFICO HORAS
    if (chartHoras) chartHoras.destroy();
    
    chartHoras = new ApexCharts(document.querySelector("#graficoHoras"), {
      series: [{ name: 'Cantidad', data: horas.map(h => h.total) }],
      chart: {
        type: 'area',
        height: getChartHeightLarge(),
        toolbar: { show: true, tools: { download: true } },
        background: 'transparent'
      },
      xaxis: {
        categories: horas.map(h => `${h.hora}hs`),
        labels: {
          style: {
            colors: '#a991d4',
            fontSize: '12px',
            fontWeight: 500
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: '#a991d4',
            fontSize: '12px',
            fontWeight: 500
          }
        }
      },
      colors: ['#a991d4'],
      stroke: {
        curve: 'smooth',
        width: 3
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          type: 'vertical',
          shadeIntensity: 0.5,
          gradientToColors: ['#5b3ea1'],
          inverseColors: false,
          opacityFrom: 0.8,
          opacityTo: 0.2,
        }
      },
      dataLabels: {
        enabled: false
      },
      tooltip: {
        theme: 'dark',
        style: {
          fontSize: '13px'
        }
      },
      grid: {
        borderColor: 'rgba(138, 117, 201, 0.15)',
        strokeDashArray: 4
      },
      markers: {
        size: 4,
        colors: ['#a991d4'],
        strokeColors: '#ffffff',
        strokeWidth: 2,
        hover: {
          size: 7
        }
      }
    });
    chartHoras.render();

    styleApexToolbar();
  } catch (err) {
    console.error("Error cargando estadísticas:", err);
    Swal.fire({
      ...swalConfig,
      icon: 'error',
      title: 'Error al cargar estadísticas',
      text: 'No se pudieron cargar las estadísticas: ' + err.message
    });
  }
}

async function cargarTendencias() {
  const data = await fetch('/estadisticas/tendencias').then(r => r.json());
  
  if (chartTendencias) chartTendencias.destroy();
  
  chartTendencias = new ApexCharts(document.querySelector("#graficoTendencias"), {
    series: [{ name: 'Reportes', data: data.map(d => d.total) }],
    chart: {
      type: 'area',
      height: getTendenciasHeight(),
      background: 'transparent',
      toolbar: { show: true, tools: { download: true } }
    },
    xaxis: {
      categories: data.map(d => d.mesAnio),
      labels: {
        style: {
          colors: '#a991d4',
          fontSize: '12px',
          fontWeight: 500
        },
        rotate: -45,
        rotateAlways: false
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: '#a991d4',
          fontSize: '12px',
          fontWeight: 500
        }
      }
    },
    colors: ['#a991d4'],
    stroke: {
      curve: 'smooth',
      width: 3
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'vertical',
        shadeIntensity: 0.5,
        gradientToColors: ['#5b3ea1'],
        inverseColors: false,
        opacityFrom: 0.8,
        opacityTo: 0.2,
      }
    },
    dataLabels: {
      enabled: false
    },
    tooltip: {
      theme: 'dark',
      style: {
        fontSize: '13px'
      }
    },
    grid: {
      borderColor: 'rgba(138, 117, 201, 0.15)',
      strokeDashArray: 4
    },
    markers: {
      size: 4,
      colors: ['#a991d4'],
      strokeColors: '#ffffff',
      strokeWidth: 2,
      hover: {
        size: 7
      }
    }
  });
  chartTendencias.render();
  styleApexToolbar();
}

// ============== REPORTES RECIENTES ================
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

  const localidadWrapper = localidadSelect.parentElement;
  localidadWrapper.addEventListener('click', (e) => {
    if (!provinciaSelect.value) {
      e.preventDefault();
      e.stopPropagation();
      Swal.fire({
        ...swalConfig,
        icon: 'info',
        title: 'Selecciona una provincia primero',
        text: 'Para filtrar por localidad, primero debes seleccionar una provincia',
        confirmButtonText: 'Entendido'
      });
    }
  });
  
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
    } catch (err) {
      console.error(err);
      Swal.fire({
        ...swalConfig,
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las provincias'
      });
    }
  }

  async function cargarLocalidades() {
    const provincia = provinciaSelect.value;
    localidadSelect.innerHTML = '<option value="">Todas</option>';
    if (!provincia) { 
      localidadSelect.disabled = true;
      localidadSelect.style.pointerEvents = 'none';
      localidadSelect.style.opacity = '0.5';
      return; 
    }
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
      localidadSelect.style.pointerEvents = 'auto';
      localidadSelect.style.opacity = '1';
      
    } catch (err) {
      console.error(err);
      Swal.fire({
        ...swalConfig,
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las localidades'
      });
    }
  }

  function cargarSelectsFecha() {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 2000; y--) {
      const option = document.createElement("option");
      option.value = y;
      option.textContent = y;
      anioSelect.appendChild(option);
    }
    for (let m = 1; m <= 12; m++) {
      const option = document.createElement("option");
      option.value = m;
      option.textContent = m;
      mesSelect.appendChild(option);
    }
    for (let d = 1; d <= 31; d++) {
      const option = document.createElement("option");
      option.value = d;
      option.textContent = d;
      diaSelect.appendChild(option);
    }
    for (let h = 0; h <= 23; h++) {
      const option = document.createElement("option");
      option.value = h;
      option.textContent = h;
      horaSelect.appendChild(option);
    }
  }

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
      Swal.fire({
        ...swalConfig,
        icon: 'error',
        title: 'Error al cargar reportes',
        text: 'No se pudieron cargar los reportes recientes: ' + err.message
      });
    }
  }

  provinciaSelect.addEventListener("change", async () => { await cargarLocalidades(); cargarReportes(true); });
  localidadSelect.addEventListener("change", () => cargarReportes(true));
  tipoSelect.addEventListener("change", () => cargarReportes(true));
  anioSelect.addEventListener("change", () => cargarReportes(true));
  mesSelect.addEventListener("change", () => cargarReportes(true));
  diaSelect.addEventListener("change", () => cargarReportes(true));
  horaSelect.addEventListener("change", () => cargarReportes(true));
  verMasBtn.addEventListener("click", () => cargarReportes(false));

  cargarMapa();
  registrarEventoClic();
  cargarEstadisticas();
  cargarProvincias();
  cargarLocalidades();
  cargarSelectsFecha();
  cargarReportes(true);
  cargarTendencias();
});

document.getElementById("userBtn").addEventListener("click", () => {
  document.getElementById("dropdown").classList.toggle("hidden");
});

window.addEventListener("click", (e) => {
  if (!e.target.closest(".user-menu")) {
    document.getElementById("dropdown").classList.add("hidden");
  }
});

// Redibujar gráficos al cambiar tamaño de ventana
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    // Redibujar gráficos con nuevas alturas
    cargarEstadisticas();
    cargarTendencias();
    if (chartMapa) chartMapa.resize();
  }, 500);
});