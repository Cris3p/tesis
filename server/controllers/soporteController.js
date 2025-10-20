import * as mailer from "../services/mail.service.js";

export const enviarContacto = async (req, res) => {
  try {
    const { nombre, email, asunto, mensaje } = req.body;

    if (!nombre || !email || !asunto || !mensaje) {
      return res.status(400).json({
        success: false,
        error: "Todos los campos son requeridos",
      });
    }

    await mailer.enviarContacto(nombre, email, asunto, mensaje);

    res.json({
      success: true,
      message: "Mensaje enviado correctamente",
    });
  } catch (error) {
    console.error("Error en endpoint de contacto:", error);
    res.status(500).json({
      success: false,
      error: "Error al enviar el mensaje",
    });
  }
};
