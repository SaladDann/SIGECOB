import { config } from 'dotenv';
config(); // Carga las variables de entorno desde .env

export const PORT = process.env.PORT;
export const HOST_DB = process.env.HOST_DB;
export const USER_DB = process.env.USER_DB;
export const PASSWORD = process.env.PASSWORD;
export const DATABASE = process.env.DATABASE;
export const PORT_DB = process.env.PORT_DB;


export const JWT_SECRET = process.env.JWT_SECRET;
export const EMAIL_SERVICE_HOST = process.env.EMAIL_SERVICE_HOST;
export const EMAIL_SERVICE_PORT = parseInt(process.env.EMAIL_SERVICE_PORT, 10);
export const EMAIL_SERVICE_USER = process.env.EMAIL_SERVICE_USER;
export const EMAIL_SERVICE_PASSWORD = process.env.EMAIL_SERVICE_PASSWORD;

export const config_cors = {
    application: {
        cors: {
            server: [
                {
                    origin: "http://localhost:3200",
                    credentials: true,
                }
            ]
        }
    }
};