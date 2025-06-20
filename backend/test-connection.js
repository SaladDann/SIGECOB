import { PrismaClient } from '@prisma/client';
import { db_pool_connection, testDbConnection } from './src/database/db.js';

const prisma = new PrismaClient();

(async () => {
  try {
    const [rows] = await db_pool_connection.query("SELECT 1");
    console.log("Conexión a MySQL exitosa:", rows);
    await testDbConnection();

    await prisma.$connect();
    console.log('Conexión a Prisma establecida exitosamente.');
  } catch (error) {
    console.error('Error al iniciar el servidor o conectar a la BD:', error);
  } finally {
    await prisma.$disconnect();
  }
})();