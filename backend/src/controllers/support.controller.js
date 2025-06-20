// backend/src/controllers/support.controller.js
import { PrismaClient } from '@prisma/client';
import { sendEmail } from '../utils/email-sender.js';

const prisma = new PrismaClient();

export const createSupportRequest = async (req, res) => {
  const { orderId, subject, message } = req.body;
  const userId = req.user.id; // Asume que el ID del usuario viene del token JWT

  if (!orderId || !subject || !message) {
    return res.status(400).json({ message: 'Todos los campos son requeridos: orderId, subject, message.' });
  }

  try {
    // 1. Obtener el email del usuario que envía la solicitud
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, fullName: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // 2. Opcional pero recomendado: Validar si la orden existe y pertenece al usuario
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      select: { userId: true }
    });

    if (!order || order.userId !== userId) {
      return res.status(403).json({ message: 'Orden no encontrada o no pertenece a este usuario.' });
    }

    // 3. Preparar el contenido del correo electrónico
    const supportReceiverEmail = process.env.SUPPORT_EMAIL_RECEIVER || process.env.EMAIL_USER;

    const emailSubject = `Nueva Solicitud de Soporte para Orden #${orderId}: ${subject}`;
    const emailHtml = `
      <h2>Nueva Solicitud de Soporte de Cliente</h2>
      <p><strong>Cliente:</strong> ${user.fullName || user.email}</p>
      <p><strong>Email del Cliente:</strong> ${user.email}</p>
      <p><strong>ID de Orden:</strong> ${orderId}</p>
      <p><strong>Asunto:</strong> ${subject}</p>
      <hr>
      <h3>Mensaje del Cliente:</h3>
      <p>${message.replace(/\n/g, '<br>')}</p>
      <hr>
      <p>Este es un mensaje de soporte automatizado. Por favor, responde directamente al cliente.</p>
    `;
    const emailText = `Nueva Solicitud de Soporte de Cliente:\n\nCliente: ${user.fullName || user.email}\nEmail del Cliente: ${user.email}\nID de Orden: ${orderId}\nAsunto: ${subject}\n\nMensaje del Cliente:\n${message}\n\nEste es un mensaje de soporte automatizado.`;

    // 4. Enviar el correo electrónico
    const emailSent = await sendEmail(
      supportReceiverEmail,
      emailSubject,
      emailText,
      emailHtml
    );

    if (emailSent) {
      res.status(201).json({ message: 'Solicitud de soporte enviada exitosamente.' });
    } else {
      res.status(500).json({ message: 'Error al enviar la solicitud de soporte por correo. Por favor, intenta de nuevo.' });
    }

  } catch (error) {
    console.error('Error en createSupportRequest:', error);
    res.status(500).json({ message: 'Error interno del servidor al procesar la solicitud de soporte.' });
  }
};