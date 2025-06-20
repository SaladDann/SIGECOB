// src/controllers/chatbotController.js
import prisma from '../config/prisma.js';
import { auditLog } from '../utils/audit-logger.js';
import dotenv from 'dotenv';

dotenv.config();

export const sendMessage = async (req, res) => {
    const { message, userId, userRole } = req.body;
    const ipAddress = req.ip;

    if (!message) {
        return res.status(400).json({ reply: 'Por favor, envía un mensaje.' });
    }

    let reply = 'Lo siento, no entendí tu pregunta. Mi conocimiento se limita a información sobre productos, compras, pagos, envíos, devoluciones, garantías, horarios, ubicaciones y contacto.';

    const lowerCaseMessage = message.toLowerCase();

    // Obtener datos de contacto desde las variables de entorno
    const contactEmail = process.env.VITE_CORREO_INFO || 'info@sigecob.com';
    const contactNumber = process.env.VITE_CONTACT_NUMBER || '+593 99 999 9999';
    const businessAddress = process.env.VITE_BUSINESS_ADDRESS || 'nuestra oficina principal';

    try {
        // --- Lógica de reglas para el chatbot (20 respuestas básicas) ---

        // 1. ¿Qué productos venden?
        if (lowerCaseMessage.includes('qué productos venden') || lowerCaseMessage.includes('productos tienen') || lowerCaseMessage.includes('qué ofrecen')) {
            reply = 'En SIGECOB ofrecemos una amplia variedad de productos electrónicos, desde laptops y smartphones hasta componentes de PC y accesorios. Puedes explorar nuestro catálogo en la web.';
        }
        // 2. ¿Tienen disponibilidad de productos ahora?
        else if (lowerCaseMessage.includes('disponibilidad de productos') || lowerCaseMessage.includes('stock ahora') || lowerCaseMessage.includes('hay productos disponibles')) {
            reply = 'Sí, la disponibilidad de nuestros productos se actualiza en tiempo real en nuestra página web. Si un producto aparece en stock, está disponible para compra.';
        }
        // 3. ¿Cómo puedo hacer una compra?
        else if (lowerCaseMessage.includes('cómo hago una compra') || lowerCaseMessage.includes('comprar') || lowerCaseMessage.includes('proceso de compra')) {
            reply = 'Comprar en SIGECOB es muy fácil. Simplemente navega por nuestra web, añade los productos que te interesan al carrito y sigue los pasos para finalizar la compra.';
        }
        // 4. ¿Qué formas de pago aceptan?
        else if (lowerCaseMessage.includes('formas de pago') || lowerCaseMessage.includes('métodos de pago') || lowerCaseMessage.includes('aceptan tarjetas') || lowerCaseMessage.includes('pagar con')) {
            reply = 'Aceptamos pagos con tarjetas de crédito y débito (Visa, MasterCard, American Express), transferencias bancarias y pagos en efectivo en nuestras oficinas.';
        }
        // 5. ¿Hacen entregas a domicilio?
        else if (lowerCaseMessage.includes('entregas a domicilio') || lowerCaseMessage.includes('envían a casa') || lowerCaseMessage.includes('delivery')) {
            reply = 'Sí, realizamos entregas a domicilio en Guayaquil y a nivel nacional. Puedes seleccionar la opción de envío durante el proceso de compra.';
        }
        // 6. ¿Cuánto cuesta el envío?
        else if (lowerCaseMessage.includes('cuánto cuesta el envío') || lowerCaseMessage.includes('costo de envío') || lowerCaseMessage.includes('precio del envío')) {
            reply = 'Nuestros envíos estándar tienen un costo fijo de $5 dentro de Guayaquil y a nivel nacional el costo varía según el peso y destino. Puedes ver el costo exacto al finalizar tu compra.';
        }
        // 7. ¿En cuánto tiempo llega el pedido?
        else if (lowerCaseMessage.includes('en cuánto tiempo llega') || lowerCaseMessage.includes('tiempo de entrega') || lowerCaseMessage.includes('cuándo llega mi pedido')) {
            reply = 'Los pedidos dentro de Guayaquil suelen llegar en 1 a 2 días hábiles, y a nivel nacional entre 3 y 5 días hábiles. Recibirás un número de seguimiento para tu pedido.';
        }
        // 8. ¿Puedo pagar en cuotas?
        else if (lowerCaseMessage.includes('pagar en cuotas') || lowerCaseMessage.includes('meses sin intereses') || lowerCaseMessage.includes('financiamiento')) {
            reply = 'Sí, ofrecemos opciones de pago en cuotas con tarjetas de crédito participantes. Consulta las opciones disponibles al momento de pagar.';
        }
        // 9. ¿Tienen garantía los productos?
        else if (lowerCaseMessage.includes('garantía los productos') || lowerCaseMessage.includes('los productos tienen garantía') || lowerCaseMessage.includes('cuánta garantía')) {
            reply = 'Sí, todos nuestros productos cuentan con garantía. El período y las condiciones de la garantía varían según el producto y el fabricante. Consulta la descripción de cada producto para más detalles.';
        }
        // 10. ¿Puedo cambiar o devolver un producto?
        else if (lowerCaseMessage.includes('cambiar un producto') || lowerCaseMessage.includes('devolver un producto') || lowerCaseMessage.includes('política de devolución') || lowerCaseMessage.includes('reembolso')) {
            reply = 'Sí, aceptamos cambios y devoluciones dentro de los 30 días posteriores a la compra, siempre que el producto esté en su estado original y con su empaque. Consulta nuestra política de devoluciones en la web para más detalles.';
        }
        // 11. ¿Dónde están ubicados?
        else if (lowerCaseMessage.includes('dónde están ubicados') || lowerCaseMessage.includes('dirección') || lowerCaseMessage.includes('sucursales')) {
            reply = `Nuestras oficinas están en **${businessAddress}**. Puedes ver la dirección completa y un mapa en la sección de Contacto de nuestra web.`;
        }
        // 12. ¿Cuáles son sus horarios de atención?
        else if (lowerCaseMessage.includes('horarios de atención') || lowerCaseMessage.includes('horario de atención') || lowerCaseMessage.includes('abren') || lowerCaseMessage.includes('cierran')) {
            reply = 'Nuestro horario de atención al cliente es de **Lunes a Viernes de 9:00 AM a 6:00 PM (hora de Guayaquil)**. Los sábados y domingos estamos cerrados.';
        }
        // 13. ¿Puedo retirar el producto en la tienda?
        else if (lowerCaseMessage.includes('retirar en tienda') || lowerCaseMessage.includes('recoger en tienda') || lowerCaseMessage.includes('pickup')) {
            reply = 'Sí, ofrecemos la opción de retiro en tienda. Puedes seleccionar "Retiro en Tienda" al finalizar tu compra y recoger tu pedido en nuestras oficinas durante el horario de atención.';
        }
        // 14. ¿El producto es nuevo?
        else if (lowerCaseMessage.includes('el producto es nuevo') || lowerCaseMessage.includes('son productos nuevos') || lowerCaseMessage.includes('usados')) {
            reply = 'Sí, todos los productos que vendemos en SIGECOB son completamente nuevos y vienen sellados en su empaque original de fábrica.';
        }
        // 15. ¿El precio incluye impuestos?
        else if (lowerCaseMessage.includes('precio incluye impuestos') || lowerCaseMessage.includes('iva incluido') || lowerCaseMessage.includes('impuestos')) {
            reply = 'Sí, todos los precios mostrados en nuestra página web incluyen los impuestos correspondientes (IVA) aplicables en Ecuador.';
        }
        // 16. ¿Hay promociones disponibles?
        else if (lowerCaseMessage.includes('promociones disponibles') || lowerCaseMessage.includes('hay ofertas') || lowerCaseMessage.includes('descuentos')) {
            reply = 'Sí, siempre tenemos promociones y ofertas especiales. Te invitamos a visitar la sección de "Ofertas" en nuestra página principal para ver las promociones actuales.';
        }
        // 17. ¿Tienen atención por WhatsApp o teléfono?
        else if (lowerCaseMessage.includes('atención por whatsapp') || lowerCaseMessage.includes('atención por teléfono') || lowerCaseMessage.includes('número de whatsapp') || lowerCaseMessage.includes('llamar')) {
            reply = `Sí, puedes contactarnos por WhatsApp o teléfono al **${contactNumber}**, y por correo electrónico a **${contactEmail}**.`;
        }
        // 18. ¿Cómo sé si un producto es compatible conmigo?
        else if (lowerCaseMessage.includes('compatible conmigo') || lowerCaseMessage.includes('compatibilidad de producto') || lowerCaseMessage.includes('funciona con mi')) {
            reply = 'Para saber si un producto es compatible, te recomendamos revisar las especificaciones técnicas detalladas en la página de cada producto. Si tienes dudas, puedes consultar a nuestro equipo de soporte.';
        }
        // 19. ¿Qué hago si tengo problemas con mi compra?
        else if (lowerCaseMessage.includes('problemas con mi compra') || lowerCaseMessage.includes('reclamo') || lowerCaseMessage.includes('ayuda con mi pedido')) {
            reply = 'Si tienes algún problema con tu compra, por favor contáctanos directamente a través de nuestro teléfono, correo electrónico o el formulario de contacto en la web. Estaremos encantados de ayudarte a resolverlo.';
        }
        // 20. ¿Dónde puedo ver los detalles de un producto?
        else if (lowerCaseMessage.includes('detalles de un producto') || lowerCaseMessage.includes('especificaciones de producto') || lowerCaseMessage.includes('ficha técnica')) {
            reply = 'Puedes ver todos los detalles, especificaciones y características de cada producto en su página individual dentro de nuestro catálogo en línea.';
        }
        // Regla de Fallback: Si ninguna regla coincide
        else {
            reply = 'Lo siento, no tengo una respuesta específica para eso. Mi conocimiento se limita a información sobre **productos, compras, pagos, envíos, devoluciones, garantías, horarios, ubicaciones y contacto**.';
        }

        // Registrar la interacción del chatbot
        await auditLog('CHATBOT_INTERACTION', {
            userId,
            details: { question: message, reply: reply },
            ipAddress
        });

        res.status(200).json({ reply });

    } catch (error) {
        console.error('Error en el chatbot:', error);
        await auditLog('CHATBOT_ERROR', {
            userId,
            details: { question: message, error: error.message },
            ipAddress
        });
        res.status(500).json({ reply: 'Lo siento, hubo un error interno al procesar tu solicitud. Por favor, inténtalo de nuevo más tarde.' });
    }
};