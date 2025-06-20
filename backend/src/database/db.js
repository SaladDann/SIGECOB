import { createPool } from "mysql2/promise";
import { HOST_DB, USER_DB, PASSWORD, DATABASE, PORT_DB } from "../config/config.js";

// Configuración y exportación del pool de conexiones MySQL
export const db_pool_connection = createPool({
    host: HOST_DB,
    user: USER_DB,
    password: PASSWORD,
    database: DATABASE,
    port: Number(PORT_DB),


    // Solo si se tiene muchas conecciones
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0 // para no tener limite en espera si es (0)
    
});

// Función para probar la conexión
export const testDbConnection = async () => {
    try {
        const connection = await db_pool_connection.getConnection();
        connection.release(); // Libera la conexión de vuelta al pool
        console.log('Conexión a la base de datos MySQL establecida exitosamente (via pool).');
    } catch (error) {
        console.error('No se pudo conectar a la base de datos MySQL:', error);
        process.exit(1); // Sale de la aplicación si no puede conectar
    }
};