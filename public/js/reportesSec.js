document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const idDestacado = params.get("id");

    try {
        const res = await fetch("/reportes/getall");
        if (!res.ok) throw new Error("No se pudieron cargar los reportes");

        const reportes = await res.json();

        // 🔹 AÑADE ESTA LÍNEA PARA ORDENAR POR FECHA MÁS RECIENTE 🔹
        reportes.sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));

        const container = document.getElementById("reportes-container");

        reportes.forEach(reporte => {
            const div = document.createElement("div");
            div.classList.add("reporte");

            if (idDestacado && Number(idDestacado) === reporte.id_reporte) {
                div.classList.add("destacado");
            }

            div.innerHTML = `
                <h3>${reporte.tipo_crimen}</h3>
                <p><strong>Ubicación:</strong> ${reporte.localidad}, ${reporte.provincia}</p>
                <p><strong>Fecha:</strong> ${new Date(reporte.fecha_hora).toLocaleString()}</p>
                <p><strong>Descripción:</strong> ${reporte.descripcion}</p>
            `;
            container.appendChild(div);
        });
    } catch (err) {
        console.error(err);
        alert("Error al cargar reportes");
    }
});