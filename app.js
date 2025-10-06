const express = require('express');
require('dotenv').config();
const mysql = require('mysql2');
const app = express();
app.use(express.json());

module.exports = app;
