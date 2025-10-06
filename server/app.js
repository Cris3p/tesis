const express = require('express');
require('dotenv').config();
const mysql = require('mysql2');
const cookieParser = require('cookie-parser');
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));//Le indica a Express que sirva archivos estáticos desde la carpeta public.
// app.use(express.urlencoded({ extended: true })); //esto procesaba formularios que envían datos asi: <form action="..." method="POST">.

const usuariosRoutes = require('./routes/usuariosRoutes')
const contactosRoutes = require('./routes/contactosRoutes');
const reportesRoutes = require('./routes/reportesRoutes');
const estadisticasRoutes = require('./routes/estadisticasRoutes');

app.use('/reportes', reportesRoutes);
app.use('/contactos', contactosRoutes);
app.use('/usuarios', usuariosRoutes)
app.use('/estadisticas', estadisticasRoutes);

module.exports = app;