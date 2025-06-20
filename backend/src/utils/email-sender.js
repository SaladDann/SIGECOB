import nodemailer from 'nodemailer';

// Configuración del transportador de Nodemailer
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE, // 'gmail' o cualquier otro servicio
    auth: {
        user: process.env.EMAIL_USER,    // Tu correo electrónico
        pass: process.env.EMAIL_PASS,    // Tu contraseña o App Password
    },
});

/**
 * Envía un correo electrónico.
 * @param {string} to - Dirección de correo del destinatario.
 * @param {string} subject - Asunto del correo.
 * @param {string} text - Contenido del correo en texto plano.
 * @param {string} [html] - Contenido del correo en HTML (opcional).
 */
export const sendEmail = async (to, subject, text, html) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER, // Remitente
            to: to,                      // Destinatario
            subject: subject,            // Asunto
            text: text,                  // Cuerpo en texto plano
            html: html || text,          // Cuerpo en HTML (usa texto si no hay HTML)
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Correo enviado: %s', info.messageId);
        // console.log('Vista previa URL: %s', nodemailer.getTestMessageUrl(info)); // Útil para Ethereal Mail
        return true; // Éxito
    } catch (error) {
        console.error('Error al enviar correo:', error);
        return false; // Fallo
    }
};