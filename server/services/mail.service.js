import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

//por el momento esto es en produccion
// const transporte = nodemailer.createTransport({
//   host: "smtp.sendgrid.net" || process.env.MAIL_HOST,
//   port: 465,
//   secure: true,
//   auth: {
//     user: process.env.SENDGRID_USER,
//     pass: process.env.SENDGRID_PASS
//   }
// });

// Configuración del transporte SMTP usando nodemailer
const transporte = nodemailer.createTransport({
  host: process.env.MAIL_HOST,   // tu servidor SMTP local
  port: 587,                     // puerto STARTTLS
  secure: false,                 // STARTTLS usa false
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  },
  tls: {
    rejectUnauthorized: false    // ignora certificados autofirmados
  }
});

// No es neceasario mostrarlo por si acaso
// Verifica la conexión con el servidor SMTP
transporte.verify(function (error, success) {
  if (error) {
    console.log("Error al conectar con el servidor de correo:", error);
  } else {
    console.log("Servidor de correo listo para enviar mensajes");
  }
});

//Función para enviar el correo de verificación
export async function enviarverificacion(direccion, token) {
  transporte.sendMail({
    from: "ONTRACK <no-reply@ontrack0010.com>",
    to: direccion,
    subject: "Verificación de cuenta ONTRACK",
    html: crearMailVerificacion(token),
  });
}

// Función para crear el contenido HTML del correo de verificación
function crearMailVerificacion(token) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  media-src 'self' data:;
  connect-src 'self' http://localhost:3000;
">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>Verificación de cuenta - ONTRACK</title>
</head>
<body style="margin:0; padding:0; font-family: Arial, sans-serif; background:#1e1e2f; color:#f0f0f0;">
  <div style="max-width:600px; margin:40px auto; background:#111; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.6);">
    
    <!-- Header -->
    <div style="background:#7209b7; padding:30px; text-align:center;">
      <h1 style="margin:0; font-size:24px; color:#fff;">Verificación de cuenta ONTRACK</h1>
    </div>

    <!-- Body -->
    <div style="padding:30px; font-size:16px; line-height:1.6;">
      <p>Gracias por registrarte en <strong>ONTRACK</strong>. Para activar tu cuenta y comenzar a usar nuestros servicios, haz clic en el botón a continuación:</p>
      
      <p style="text-align:center; margin:30px 0;">
        <a href="http://localhost:3000/usuarios/verificar/${token}" 
           style="background:#9d4edd; color:#fff; text-decoration:none; padding:14px 28px; border-radius:8px; font-size:16px; font-weight:bold; display:inline-block;">
          Verificar cuenta
        </a>
      </p>

      <p>Si no solicitaste esta verificación, puedes ignorar este correo sin problema.</p>
      <p>Saludos,<br><strong>El equipo de ONTRACK</strong></p>
    </div>

    <!-- Footer -->
    <div style="background:#1e1e2f; color:#aaa; font-size:14px; text-align:center; padding:20px;">
      © 2025 ONTRACK. Todos los derechos reservados.
    </div>

  </div>
</body>
</html>
    `;
}

// Función para enviar el correo de notificación de nuevo reporte
export async function enviarNotificacionReporte(destinatarios, reporte) {
  try {
    const mailOptions = {
      from: "ONTRACK <no-reply@ontrack0010.com>",
      to: destinatarios.join(','), // Separa los correos con comas
      subject: `¡Nuevo Reporte de Crimen en tu área!`,
      html: crearMailNotificacion(reporte),
    };

    await transporte.sendMail(mailOptions);
    console.log("Notificación de reporte enviada exitosamente a todos los usuarios.");
  } catch (error) {
    console.error("Error al enviar la notificación de reporte:", error);
    throw error;
  }
}

// Función para generar el HTML del correo de notificación
function crearMailNotificacion(reporte) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
   <meta http-equiv="Content-Security-Policy" content="default-src 'self'; connect-src 'self' http://localhost:3000">
  <title>Nuevo Reporte de Crimen</title>
  <style>
    
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
        border-radius: 0 !important;
      }
      .content {
        padding: 20px !important;
      }
      .cta {
        display: block !important;
        width: 100% !important;
        text-align: center !important;
      }
    }
  </style>
</head>
<body style="margin:0; padding:20px; font-family: Arial, sans-serif; background-color:#f4f4f9; color:#333;">

  <!-- Contenedor principal -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="100%" style="max-width:600px; margin:auto;" class="container">
    <tr>
      <td style="background:#ffffff; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.08); overflow:hidden;">
        
        <!-- Encabezado -->
        <div style="background: linear-gradient(135deg, #9d4edd, #6a0dad); padding:30px; text-align:center;">
          <h2 style="margin:0; font-size:22px; color:#ffffff; font-weight:600;">
            🔔 Alerta de Seguridad ONTRACK
          </h2>
        </div>

        <!-- Cuerpo -->
        <div style="padding:30px; font-size:15px; line-height:1.6; color:#444;" class="content">
          <p>Se ha registrado un nuevo reporte de crimen en tu área. La seguridad es nuestra prioridad.</p>

          <!-- Caja de datos -->
          <div style="background-color:#f8f6fb; border-left:5px solid #9b5de5; padding:15px 20px; margin:20px 0; border-radius:6px;">
            <p style="margin:6px 0;"><strong>Tipo de Crimen:</strong> ${reporte.tipo_crimen}</p>
            <p style="margin:6px 0;"><strong>Ubicación:</strong> ${reporte.localidad}, ${reporte.provincia}</p>
            <p style="margin:6px 0;"><strong>Fecha y Hora:</strong> ${new Date(reporte.fecha_hora).toLocaleString()}</p>
            <p style="margin:6px 0;"><strong>Descripción:</strong> ${reporte.descripcion}</p>
          </div>

          <!-- Botón CTA -->
          <div style="text-align:center; margin-top:30px;">
           <a href="http://localhost:3000/html/seccionreportes.html?id=${reporte.id_reporte}" 
              class="cta"
              style="background: linear-gradient(135deg, #9d4edd, #6a0dad); 
              color:#fff; padding:12px 26px; 
              text-decoration:none; border-radius:6px; 
              font-weight:bold; display:inline-block; 
              font-size:15px;">
              Ver el reporte en ONTRACK
            </a>
          </div>

          <p style="margin-top:30px; font-size:13px; color:#777; text-align:center;">
            Este es un correo automático, por favor no respondas a esta dirección.
          </p>
        </div>

        <!-- Footer -->
        <div style="background:#f0f0f5; color:#666; font-size:12px; text-align:center; padding:15px;">
          © 2025 ONTRACK. Todos los derechos reservados.
        </div>

      </td>
    </tr>
  </table>

</body>
</html>`;
}


// Notificar correo de restablecimiento de contraseña

export async function enviarResetPassword(direccion, token) {
  try {
    await transporte.sendMail({
      from: "ONTRACK <no-reply@ontrack0010.com>",
      to: direccion,
      subject: "Restablecer contraseña - ONTRACK",
      html: crearMailResetPassword(token),
    });
    console.log(`Correo de recuperación enviado a ${direccion}`);
  } catch (error) {
    console.error("Error al enviar correo de recuperación:", error);
    throw error;
  }
}

function crearMailResetPassword(token) {
  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>Restablecer contraseña - ONTRACK</title>
  </head>
  <body style="font-family: Arial, sans-serif; background:#f4f4f9; color:#333;">
    <div style="max-width:600px; margin:auto; background:#fff; padding:20px; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
      <h2 style="color:#6a0dad;">Restablecimiento de contraseña</h2>
      <p>Recibimos una solicitud para restablecer tu contraseña en <strong>ONTRACK</strong>.</p>
      <p>Haz clic en el siguiente botón para continuar:</p>
      <p style="text-align:center; margin:20px 0;">
        <a href="http://localhost:3000/html/NuevaContraseña.html?token=${token}" 
           style="background:#6a0dad; color:#fff; padding:12px 24px; text-decoration:none; border-radius:6px; font-weight:bold;">
           Crear nueva contraseña
        </a>
      </p>
      <p>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
      <p>El enlace expirará en 15 minutos por tu seguridad.</p>
    </div>
  </body>
  </html>
  `;
}
