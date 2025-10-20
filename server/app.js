const express = require('express');
require('dotenv').config();
const mysql = require('mysql2');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const Peach = require('../lib/peach/Peach.js');
const path = require('path');
const fs = require('fs');

const app = express();

// Configuración de Middlewares
app.use(cors()); // Permite peticiones de métodos complejos (PUT, DELETE) desde el navegador
app.use(express.json()); // Permite a Express leer JSON en el cuerpo de las peticiones
app.use(cookieParser()); // Habilita el manejo de cookies
app.use(express.static(path.join(__dirname, '../public'))); // Sirve archivos estáticos (HTML, CSS, JS)


// Importación de rutas
const usuariosRoutes = require('./routes/usuariosRoutes')
const contactosRoutes = require('./routes/contactosRoutes');
const reportesRoutes = require('./routes/reportesRoutes');
const estadisticasRoutes = require('./routes/estadisticasRoutes');
const soporteRoutes = require("./routes/soporteRoutes");

// Definición de rutas
app.use('/reportes', reportesRoutes);
app.use('/contactos', contactosRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/estadisticas', estadisticasRoutes);
app.use('/soporte', soporteRoutes);


function handleController(section, req, res) {
    const controllerPath = path.join(__dirname, 'controllers', `${section}Controller.js`);
    
    if (!fs.existsSync(controllerPath)) {
        section = "error";
    }

    try {
        const Controller = require(`./controllers/${section}Controller.js`);
        Controller.show(req, res);
    } catch (error) {
        console.error("Error loading controller:", error);
        const errorController = require('./controllers/errorController.js');
        errorController.show(req, res);
    }
}

app.get("/", (req, res) => {
    try {
        const view = new Peach("landing");
        res.send(view.bufferTpl);
    } catch (error) {
        console.error("Error loading template:", error);
        res.status(500).send("Error loading page");
    }
});

// Solo rutas con un único segmento (sin barras adicionales)
app.get(/^\/([a-zA-Z0-9_-]+)$/, (req, res) => {
    let section = req.params[0];
    handleController(section, req, res);
});

module.exports = app;