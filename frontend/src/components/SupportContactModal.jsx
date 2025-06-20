// frontend/src/components/SupportContactModal.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const SupportContactModal = ({ orderId, onClose }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      // Aquí deberías tener un endpoint en tu backend para manejar solicitudes de soporte
      // Por ahora, simularemos el envío y mostraremos un toast.
      // En un entorno real, enviarías subject, message y orderId al backend.
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/support/requests`, {
        orderId,
        subject,
        message,
      }, config);

      toast.success('Tu solicitud de soporte ha sido enviada. Te contactaremos pronto.');
      onClose(); // Cierra el modal al enviar
    } catch (error) {
      console.error('Error al enviar solicitud de soporte:', error);
      toast.error('Error al enviar tu solicitud de soporte. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal d-block"
      tabIndex="-1"
      role="dialog"
      style={{
        backgroundColor: 'rgba(0,0,0,0.5)',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1060 // Un z-index un poco más alto si aparece sobre otro modal
      }}
    >
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Contactar Soporte sobre Orden #{orderId}</h5>
            <button
              type="button"
              className="btn-close"
              aria-label="Cerrar"
              onClick={onClose}
              disabled={isSubmitting}
            ></button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="subject" className="form-label">Asunto:</label>
                <input
                  type="text"
                  className="form-control"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="message" className="form-label">Mensaje:</label>
                <textarea
                  className="form-control"
                  id="message"
                  rows="5"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  disabled={isSubmitting}
                ></textarea>
              </div>
              <div className="d-flex justify-content-end">
                <button
                  type="button"
                  className="btn btn-secondary me-2"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportContactModal;