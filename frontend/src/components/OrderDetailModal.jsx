// frontend/src/components/OrderDetailModal.jsx

import React from 'react';

// Si no estás usando Bootstrap 5, podrías necesitar importar el Modal de 'react-bootstrap'
// si lo tienes instalado. Para un modal básico solo con CSS de Bootstrap, esto es suficiente.

const OrderDetailModal = ({ order, onClose }) => {
  if (!order) return null; // No renderizar si no hay orden

  return (
    // Overlay del modal
    // d-flex, justify-content-center, align-items-center centran el contenido
    // bg-dark bg-opacity-50 para el fondo oscuro (clase de Bootstrap)
    // position-fixed, top-0, left-0, w-100, h-100 para cubrir toda la pantalla
    // z-index-1050 (o un valor alto para asegurar que esté encima)
    <div 
      className="modal d-block" // 'd-block' para que Bootstrap lo muestre (por defecto está 'display: none')
      tabIndex="-1" 
      role="dialog" 
      style={{ 
        backgroundColor: 'rgba(0,0,0,0.5)', // Fallback si bg-opacity-50 no funciona perfectamente
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1050 // Valor de z-index típico para modales de Bootstrap
      }}
    >
      {/* Contenido del modal */}
      <div className="modal-dialog modal-lg" role="document"> {/* modal-lg para un tamaño grande */}
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Detalles de la Orden #{order.id}</h5>
            <button 
              type="button" 
              className="btn-close" // Clase de Bootstrap para el botón de cerrar
              aria-label="Cerrar" 
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <p className="text-muted mb-1"><strong>Fecha de la Orden:</strong> {new Date(order.createdAt).toLocaleDateString()} a las {new Date(order.createdAt).toLocaleTimeString()}</p>
            <p className="mb-1">
              <strong>Estado:</strong> 
              <span className={`badge ${
                order.orderStatus === 'Delivered' ? 'bg-success' : 
                order.orderStatus === 'Shipped' ? 'bg-primary' : 
                order.orderStatus === 'Processing' ? 'bg-warning text-dark' : 
                order.orderStatus === 'Pending' ? 'bg-info text-dark' : 
                'bg-secondary' // 'Cancelled' u otro
              } ms-2`}>
                {order.orderStatus}
              </span>
            </p>
            <p className="mb-1"><strong>Monto Total:</strong> ${parseFloat(order.totalAmount).toFixed(2)}</p>
            <p className="mb-3"><strong>Dirección de Envío:</strong> {order.shippingAddress}</p>

            {/* Detalles del Pago */}
            {order.payment && (
              <div className="card mb-4">
                <div className="card-header">
                  <h6 className="mb-0">Detalles del Pago</h6>
                </div>
                <div className="card-body">
                  <p className="mb-1"><strong>Método de Pago:</strong> {order.payment.paymentMethod}</p>
                  <p className="mb-1">
                    <strong>Estado del Pago:</strong> 
                    <span className={`badge ${
                      order.payment.paymentStatus === 'Confirmed' ? 'bg-success' : 
                      order.payment.paymentStatus === 'Pending' ? 'bg-warning text-dark' : 
                      'bg-danger' // 'Failed' u otro
                    } ms-2`}>
                      {order.payment.paymentStatus}
                    </span>
                  </p>
                  <p className="mb-1"><strong>ID de Transacción:</strong> {order.payment.transactionId}</p>
                  <p className="mb-0"><strong>Monto Pagado:</strong> ${parseFloat(order.payment.amount).toFixed(2)}</p>
                </div>
              </div>
            )}

            {/* Artículos de la Orden */}
            <h6 className="mb-3">Artículos:</h6>
            {order.items && order.items.length > 0 ? (
              <ul className="list-group list-group-flush">
                {order.items.map((item) => (
                  <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{item.quantity} x {item.product.name}</strong> 
                      <span className="text-muted ms-2">(${parseFloat(item.price).toFixed(2)} c/u)</span>
                    </div>
                    <span>Total: ${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">No hay artículos para esta orden.</p>
            )}
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;