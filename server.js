const app = require ('./server/app');
const port = process.env.PORT || 4000;

app.get("/testdb", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT NOW() AS hora");
    res.json({ conexion: "ok", hora: rows[0].hora });
  } catch (err) {
    console.error("Error de conexión:", err);
    res.status(500).json({ error: "Error conectando a la base de datos" });
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});