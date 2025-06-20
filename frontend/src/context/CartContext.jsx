// frontend/src/context/CartContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
  const { token, isAuthenticated, user } = useAuth(); // Desestructuramos 'user' para acceder al rol
  const [userCart, setUserCart] = useState(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState(null);
  const [showCartModal, setShowCartModal] = useState(false); // <-- Estado para controlar la visibilidad del modal

  const API_URL_CART_BASE = `${import.meta.env.VITE_BACKEND_URL}/cart`;
  const API_URL_ADD_TO_CART = `${API_URL_CART_BASE}/items/add`;
  const API_URL_GET_CART = `${API_URL_CART_BASE}/get`;
  const API_URL_UPDATE_CART_ITEM = `${API_URL_CART_BASE}/items/update`;
  const API_URL_REMOVE_CART_ITEM = `${API_URL_CART_BASE}/items/remove`;
  const API_URL_CLEAR_CART = `${API_URL_CART_BASE}/clear`;

  // Función para verificar si el usuario actual es un cliente
  const isClient = useCallback(() => {
    return isAuthenticated && user && user.role === 'Client';
  }, [isAuthenticated, user]);

  const fetchUserCart = useCallback(async () => {
    // Solo intentar cargar el carrito si el usuario está autenticado Y es un cliente
    if (!isClient()) {
      setUserCart(null);
      setCartLoading(false); // Asegúrate de que loading se apague si no es cliente
      return;
    }
    setCartLoading(true);
    setCartError(null);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.get(API_URL_GET_CART, config);
      setUserCart(response.data);
    } catch (err) {
      console.error('Error al obtener el carrito:', err.response?.data || err.message);
      setCartError('No se pudo cargar el carrito. Por favor, intenta de nuevo.');
      setUserCart(null);
    } finally {
      setCartLoading(false);
    }
  }, [isClient, token, API_URL_GET_CART]); // Dependencia de isClient

  useEffect(() => {
    fetchUserCart();
  }, [fetchUserCart]);

  const addItemToCart = async (productId, quantity, productName) => {
    // Verificar si el usuario está autenticado Y es un cliente antes de añadir al carrito
    if (!isClient()) {
      toast.info('Debes iniciar sesión con una cuenta de cliente para añadir productos al carrito.');
      return false;
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      await axios.post(API_URL_ADD_TO_CART, { productId, quantity }, config);
      toast.success(`¡"${productName}" añadido al carrito exitosamente!`);
      await fetchUserCart();
      return true;
    } catch (err) {
      console.error('Error al añadir producto al carrito:', err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || 'Error al añadir el producto al carrito.';

      toast.error(err.response?.data?.message || errorMessage);
      return false;
    }
  };

  const removeItemFromCart = async (itemId, productName) => {
    if (!isClient()) {
      toast.error('Operación no permitida para tu rol.');
      return;
    }
    if (!window.confirm(`¿Estás seguro de que quieres eliminar "${productName}" de tu carrito?`)) {
      return;
    }
    setCartLoading(true);
    setCartError(null);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`${API_URL_REMOVE_CART_ITEM}/${itemId}`, config);
      toast.success(`"${productName}" eliminado del carrito.`);
      fetchUserCart();
    } catch (err) {
      console.error('Error al eliminar ítem del carrito:', err.response?.data || err.message);
      toast.error(`Error al eliminar "${productName}": ${err.response?.data?.message || err.message}`);
    } finally {
      setCartLoading(false);
    }
  };

  const updateCartItemQuantity = async (itemId, newQuantity, productName) => {
    if (!isClient()) {
      toast.error('Operación no permitida para tu rol.');
      return;
    }
    setCartLoading(true);
    setCartError(null);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${API_URL_UPDATE_CART_ITEM}/${itemId}`, { quantity: newQuantity }, config);
      toast.success(`Cantidad de "${productName}" actualizada a ${newQuantity}.`);
      fetchUserCart();
    } catch (err) {
      console.error('Error al actualizar cantidad:', err.response?.data || err.message);
      toast.error(`Error al actualizar cantidad de "${productName}": ${err.response?.data?.message || err.message}`);
    } finally {
      setCartLoading(false);
    }
  };

  const clearCart = async () => {
    if (!isClient()) {
      toast.error('Operación no permitida para tu rol.');
      return;
    }
    if (!window.confirm('¿Estás seguro de que quieres vaciar todo tu carrito?')) {
      return;
    }
    setCartLoading(true);
    setCartError(null);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(API_URL_CLEAR_CART, config);
      toast.success('Tu carrito ha sido vaciado exitosamente.');
      setUserCart({ ...userCart, items: [] });
    } catch (error) {
      console.error('Error al vaciar el carrito:', error);
      toast.error(`Error al vaciar el carrito: ${error.response?.data?.message || error.message}`);
    } finally {
      setCartLoading(false);
    }
  };

  const calculateCartTotal = () => {
    // Solo calcula el total si hay un carrito y el usuario es un cliente
    if (!isClient() || !userCart || !userCart.items || userCart.items.length === 0) return 0;
    return userCart.items.reduce((total, item) => total + (item.quantity * item.price), 0).toFixed(2);
  };

  // Función para abrir el modal del carrito
  const openCartModal = () => {
    if (isClient()) {
      setShowCartModal(true);
      fetchUserCart();
    } else if (isAuthenticated) {
      toast.info('Tu rol de usuario no permite el acceso al carrito de compras.');
    } else {
      toast.info('Inicia sesión para ver tu carrito.');
    }
  };

  // Función para cerrar el modal del carrito
  const closeCartModal = () => {
    setShowCartModal(false);
  };

  const contextValue = {
    userCart,
    cartLoading,
    cartError,
    showCartModal,
    fetchUserCart,
    addItemToCart,
    removeItemFromCart,
    updateCartItemQuantity,
    clearCart,
    calculateCartTotal,
    openCartModal,
    closeCartModal,
    isClient, // Expone la función isClient para que los componentes puedan verificar el rol
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};