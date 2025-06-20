import express from "express";
import cors from "cors";
import { PORT, config_cors } from "./src/config/config.js";
import dotenv from 'dotenv';
import path from 'path'; 



//Import del test de conecciones
import './test-connection.js';

// Importar las rutas
import authRoutes from './src/routes/auth.routes.js';
import productRoutes from './src/routes/product.routes.js';
import cartRoutes from './src/routes/cart.routes.js';
import orderRoutes from './src/routes/order.routes.js';
import userRoutes from './src/routes/user.routes.js'
import auditRoutes from './src/routes/audit.routes.js'
import reportRoutes from './src/routes/report.routes.js';
import chatbotRoutes from './src/routes/chatbot.routes.js';
import supportRoutes from './src/routes/support.routes.js';


dotenv.config();
const app = express();
app.use(cors(config_cors.application.cors.server));
app.use(express.json());

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Definición de rutas
app.get('/', (req, res) => {
    res.send('Bienvenido al Backend de SIGECOB!');
    console.log('Bienvenido al Backend de SIGECOB!');
});


// Rutas de autenticación
app.use('/api/auth', authRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/admin/audit', auditRoutes);


// Rutas (protegidas por middleware de autenticación/autorización)
app.use('/api', productRoutes);
app.use('/api', cartRoutes);
app.use('/api', orderRoutes);
app.use('/api', userRoutes);
app.use('/api', reportRoutes);
app.use('/apichat', chatbotRoutes);



// Middleware para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Error interno del servidor" });
});

// Iniciar el servidor y las conexiones a BD del test.js
app.listen(PORT, () => {
  try {
    console.log(`Servidor de SIGECOB corriendo en el puerto ${PORT}`);
    console.log(`Acceso: http://localhost:${PORT}`);
  } catch (error) {
      console.error('Error al iniciar la aplicación:', error);
      process.exit(1);
    }
});