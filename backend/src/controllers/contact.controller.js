import { sendEmail } from '../utils/email-sender.js';
import dotenv from 'dotenv';

dotenv.config();

export const sendContactMessage = async (req, res) => {
  const { fullName, email, message } = req.body;

  if (!fullName || !email || !message) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios: nombre, correo y mensaje.' });
  }

  try {
    const to = process.env.BUSINESS_EMAIL || process.env.EMAIL_USER;

    const subject = `Nuevo Mensaje de Contacto - SIGECOB: ${fullName}`;
    const html = `
      <h2>Nuevo mensaje de contacto</h2>
      <p><strong>Nombre:</strong> ${fullName}</p>
      <p><strong>Correo:</strong> ${email}</p>
      <hr>
      <p><strong>Mensaje:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
      <hr>
      <p>Este correo fue generado automáticamente desde el formulario de contacto de SIGECOB.</p>
    `;

    const text = `Nombre: ${fullName}\nCorreo: ${email}\n\nMensaje:\n${message}`;

    const success = await sendEmail(to, subject, text, html);

    if (success) {
      return res.status(200).json({ message: 'Mensaje enviado con éxito. Gracias por contactarnos.' });
    } else {
      return res.status(500).json({ message: 'No se pudo enviar el mensaje. Intenta de nuevo más tarde.' });
    }

  } catch (error) {
    console.error('Error en sendContactMessage:', error);
    return res.status(500).json({ message: 'Error interno del servidor al enviar el mensaje.' });
  }
};
