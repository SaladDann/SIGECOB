import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Conectar Prisma al iniciar la aplicación (opcional aquí, se puede hacer en app.js)
prisma.$connect()
.then(() => console.log('Prisma Client conectado a la base de datos.'))
    .catch((e) => {
    console.error('Error al conectar Prisma Client:', e);
    process.exit(0);
});

export default prisma; // Exporta instancia única del cliente Prisma