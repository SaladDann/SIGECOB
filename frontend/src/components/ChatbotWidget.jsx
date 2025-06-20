import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, Form, InputGroup } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext.jsx'; // Make sure this path is correct

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL_CHATBOT;

const ChatbotWidget = () => {
    const { isAuthenticated, user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const messagesEndRef = useRef(null);
    const recommendedQuestionsRef = useRef(null); // Ref for the scrollable container

    // Preguntas recomendadas
    const recommendedQuestions = [
        "¿Qué productos venden?",
        "¿Tienen disponibilidad de productos ahora?",
        "¿Cómo puedo hacer una compra?",
        "¿Qué formas de pago aceptan?",
        "¿Hacen entregas a domicilio?",
        "¿Cuánto cuesta el envío?",
        "¿En cuánto tiempo llega el pedido?",
        "¿Puedo pagar en cuotas?",
        "¿Tienen garantía los productos?",
        "¿Puedo cambiar o devolver un producto?",
        "¿Dónde están ubicados?",
        "¿Cuáles son sus horarios de atención?",
        "¿Puedo retirar el producto en la tienda?",
        "¿El producto es nuevo?",
        "¿El precio incluye impuestos?",
        "¿Hay promociones disponibles?",
        "¿Tienen atención por WhatsApp o teléfono?",
        "¿Cómo sé si un producto es compatible conmigo?",
        "¿Qué hago si tengo problemas con mi compra?",
        "¿Dónde puedo ver los detalles de un producto?"
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                { sender: 'bot', text: '¡Hola! Soy tu asistente virtual de SIGECOB. ¿En qué puedo ayudarte hoy? Puedes preguntar sobre nuestros productos, compras, pagos, envíos, devoluciones, garantías y más.' }
            ]);
        }
    }, [isOpen, messages.length]);

    // Auto-scroll al inicio de las preguntas recomendadas cuando se abre el chat
    useEffect(() => {
        if (isOpen && recommendedQuestionsRef.current) {
            recommendedQuestionsRef.current.scrollLeft = 0; // Asegura que empiece desde el inicio
        }
    }, [isOpen]);

    // Función para desplazar las preguntas
    const scrollQuestions = (direction) => {
        if (recommendedQuestionsRef.current) {
            const container = recommendedQuestionsRef.current;
            const scrollAmount = 200; // Puedes ajustar este valor según cuánto quieras desplazar
            if (direction === 'left') {
                container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };


    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (inputMessage.trim() === '') return;

        const userMessage = inputMessage.trim();
        setMessages((prevMessages) => [...prevMessages, { sender: 'user', text: userMessage }]);
        setInputMessage('');

        try {
            const response = await axios.post(`${BACKEND_BASE_URL}/chatbot/message`, {
                message: userMessage,
                userId: isAuthenticated ? user.id : null,
                userRole: isAuthenticated ? user.role : null,
            });

            const botReplyText = response.data.reply;
            setMessages((prevMessages) => [...prevMessages, { sender: 'bot', text: botReplyText }]);

        } catch (error) {
            console.error('Error al comunicarse con el chatbot backend:', error);
            const errorMessage = error.response?.data?.reply || 'Lo siento, no pude comunicarme con el servidor. Por favor, intenta de nuevo más tarde.';
            setMessages((prevMessages) => [...prevMessages, { sender: 'bot', text: errorMessage }]);
            toast.error('Error de conexión con el chatbot. Por favor, inténtalo más tarde.', {
                position: "bottom-right", autoClose: 3000, hideProgressBar: true, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light",
            });
        }
    };

    const handleRecommendedQuestionClick = (question) => {
        setInputMessage(question);
        // Opcional: También podrías enviar la pregunta al bot automáticamente aquí
        // handleSendMessage({ preventDefault: () => {} }); // Simular evento para enviar
    };

    return (
        <div className="chatbot-widget-container" style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1000,
            fontFamily: 'Arial, sans-serif',
        }}>
            {!isOpen && (
                <Button
                    variant="primary"
                    onClick={() => setIsOpen(true)}
                    className="rounded-circle shadow-lg"
                    style={{
                        width: '60px',
                        height: '60px',
                        fontSize: '1.5em',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#007bff',
                        borderColor: '#007bff',
                        transition: 'background-color 0.2s, transform 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    aria-label="Abrir Chatbot"
                >
                    💬
                </Button>
            )}

            {isOpen && (
                <Card className="shadow-lg border-0" style={{
                    width: '380px',
                    height: '500px',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    backgroundColor: '#ffffff',
                }}>
                    <Card.Header className="d-flex justify-content-between align-items-center text-white py-3 px-4 border-0" style={{
                        borderRadius: '12px 12px 0 0',
                        background: 'linear-gradient(to right, #007bff, #0056b3)',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                    }}>
                        <h5 className="mb-0 fs-5" style={{ fontWeight: '600' }}>Asistente SIGECOB</h5>
                        <Button variant="link" onClick={() => { setIsOpen(false); setMessages([]); }} className="text-white fs-4 p-0" aria-label="Cerrar Chatbot">
                            &times;
                        </Button>
                    </Card.Header>
                    <Card.Body className="d-flex flex-column gap-3 p-3" style={{ flexGrow: 1, overflowY: 'auto', backgroundColor: '#e9ecef' }}>
                        {messages.map((msg, index) => (
                            <div key={index} className={`p-3 rounded-lg shadow-sm ${msg.sender === 'user' ? 'bg-primary text-white align-self-end' : 'bg-light text-dark align-self-start'}`}
                                style={{
                                    maxWidth: '85%',
                                    wordBreak: 'break-word',
                                    borderRadius: '15px',
                                    fontSize: '0.95em',
                                    lineHeight: '1.4',
                                }}>
                                {msg.text}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </Card.Body>
                    <Card.Footer className="bg-light border-top py-3 px-3">
                        {/* Contenedor de Preguntas Recomendadas con botones de navegación */}
                        <div className="mb-3">
                            <small className="text-muted d-block mb-1">Preguntas rápidas:</small>
                            <div className="d-flex align-items-center"> {/* Contenedor para flechas y preguntas */}
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    className="rounded-circle d-flex align-items-center justify-content-center p-0"
                                    style={{ width: '30px', height: '30px', flexShrink: 0, marginRight: '8px' }}
                                    onClick={() => scrollQuestions('left')}
                                    aria-label="Desplazar preguntas a la izquierda"
                                >
                                    &lt;
                                </Button>
                                <div ref={recommendedQuestionsRef} className="d-flex flex-nowrap gap-2 overflow-hidden pb-2" style={{
                                    flexGrow: 1, // Permite que ocupe el espacio restante
                                    WebkitOverflowScrolling: 'touch',
                                    // Ocultar scrollbar nativo
                                    msOverflowStyle: 'none',  // IE and Edge
                                    scrollbarWidth: 'none',   // Firefox
                                    '&::-webkit-scrollbar': { display: 'none' }, // Chrome, Safari
                                }}>
                                    {recommendedQuestions.map((q, index) => (
                                        <Button
                                            key={index}
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={() => handleRecommendedQuestionClick(q)}
                                            className="rounded-pill px-3 py-2 text-nowrap flex-shrink-0"
                                            aria-label={`Pregunta recomendada: ${q}`}
                                            style={{
                                                borderColor: '#ced4da',
                                                color: '#495057',
                                                transition: 'all 0.2s ease',
                                                fontSize: '0.85em',
                                                backgroundColor: '#fff',
                                                minWidth: 'fit-content',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e9ecef'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}
                                        >
                                            {q}
                                        </Button>
                                    ))}
                                </div>
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    className="rounded-circle d-flex align-items-center justify-content-center p-0"
                                    style={{ width: '30px', height: '30px', flexShrink: 0, marginLeft: '8px' }}
                                    onClick={() => scrollQuestions('right')}
                                    aria-label="Desplazar preguntas a la derecha"
                                >
                                    &gt;
                                </Button>
                            </div>
                        </div>

                        <Form onSubmit={handleSendMessage}>
                            <InputGroup>
                                <Form.Control
                                    type="text"
                                    placeholder="Escribe tu mensaje..."
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    aria-label="Escribe tu mensaje para el chatbot"
                                    className="border-primary py-2"
                                    style={{ borderRadius: '25px 0 0 25px' }}
                                />
                                <Button variant="primary" type="submit" style={{ borderRadius: '0 25px 25px 0' }}>
                                    Enviar
                                </Button>
                            </InputGroup>
                        </Form>
                    </Card.Footer>
                </Card>
            )}
        </div>
    );
};

export default ChatbotWidget;
