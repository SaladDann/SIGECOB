import 'dotenv/config';

// Importar el cliente Prisma
import prisma from '../src/config/prisma.js';
// Importar la utilidad para hashear contraseñas
import { hashPassword } from '../src/utils/password-utils.js';
// Importar el módulo readline para interactuar por consola
import readline from 'node:readline/promises'; // Usar node:readline/promises para versiones modernas de Node.js
import { stdin as input, stdout as output } from 'node:process';


const rl = readline.createInterface({ input, output });

async function initializeAdmin() {
    try {
        console.log('Iniciando script de inicialización de administrador...');

        // 1. Conectar Prisma Client
        await prisma.$connect();
        console.log('Prisma Client conectado a la base de datos.');

        // 2. Verificar si ya existe un administrador
        const existingAdmin = await prisma.user.findFirst({
            where: {
                role: 'Admin',
            },
        });

        if (existingAdmin) {
            console.log(`Ya existe un administrador (${existingAdmin.email}) en la base de datos. Saltando la creación.`);
            return; // Salir si ya hay un admin
        }

        console.log('No se encontró ningún administrador. Creando uno nuevo...');

        // 3. Solicitar credenciales al usuario por consola
        const adminEmail = await rl.question('Ingrese el correo electrónico para el nuevo administrador: ');
        const adminPassword = await rl.question('Ingrese la contraseña para el nuevo administrador: ', { hideEchoBack: true }); // Oculta la entrada

        if (!adminEmail || !adminPassword) {
            console.error('Correo electrónico y contraseña no pueden estar vacíos.');
            return;
        }

        // 4. Hashear la contraseña
        const hashedPassword = await hashPassword(adminPassword);

        // 5. Crear el nuevo usuario administrador
        const newAdmin = await prisma.user.create({
            data: {
                email: adminEmail,
                password: hashedPassword,
                fullName: 'Administrador', // Nombre por defecto para el primer admin
                address: 'N/A', // Dirección por defecto
                role: 'Admin', // Asignar rol de Administrador
                isActive: true,
            },
        });

        // 6. Crear un carrito vacío para el administrador (si aplica según tu lógica de negocio)
        // Aunque un admin no necesite un carrito para comprar, tu esquema lo requiere por userId @unique
        // Si no quieres que los admins tengan carrito, podrías cambiar el esquema de Cart para que userId no sea @unique
        // o manejar esta excepción. Por ahora, lo creamos.
        await prisma.cart.create({
            data: {
                userId: newAdmin.id,
            }
        });

        console.log(`Administrador creado exitosamente: ${newAdmin.email}`);

    } catch (error) {
        console.error('Error durante la inicialización del administrador:', error);
        if (error instanceof Error) {
            console.error('Detalles del error:', error.message);
        }
    } finally {
        // 7. Desconectar Prisma Client
        await prisma.$disconnect();
        rl.close();
        console.log('Script finalizado.');
    }
}

// Ejecutar la función principal
initializeAdmin();