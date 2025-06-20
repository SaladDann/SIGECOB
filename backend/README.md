# 1. Inicialización del Proyecto Node.js
Abre tu terminal

npm init -y

# 2. Instalación de Dependencias Básicas
npm install express dotenv cors

npm install -D nodemon

O npm install express cors dotenv mysql2 y npm install nodemon -D,

agrega en package.json: "type": "module" y en scripts añade "dev": "nodemon"(si no esta),

# 3. Creación de estructura de directorios (vacíos por ahora)
mkdir src

mkdir src/config

mkdir src/controllers

mkdir src/database

mkdir src/middlewares

mkdir src/models

mkdir src/responses

mkdir src/routes

mkdir src/services

mkdir src/utils

#4. Creación de dependecia prisma  y base de datos
npm install mysql2 @prisma/client (si no lo tienes)

npm install -D prisma (Instala el CLI de Prisma como dev dependency)

#inicialización de Prisma
npm install @prisma/client mysql2

npm install -D prisma

npx prisma init --datasource-provider mysql

# si ya tienes un esquema en tu gestor de base de  datos usa:

para sincronizarlo

npx prisma db pull 

reinicia la base de datos

npx prisma migrate reset  

# si no define tu modelo en schema.prisma
npx prisma migrate dev --name init_sql

# genera el cliente 
npx prisma generate

# finalmente instala bcrypt para cifrado
npm install bcryptjs jsonwebtoken

#instalar Nodemailer y dotenv para manejar las variables de entorno de forma segura
npm install nodemailer dotenv

#para el manejo de imagenes locales
npm install multer

#Precio calculos
npm install decimal.js

#para impresion con react-to-print 
instalar nmp i react-to-print para impresion

npm run init-admin