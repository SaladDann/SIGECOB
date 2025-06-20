# React + Vite
Configuración e Instalación - Frontend (React con Vite)

# 1. Creación del Proyecto React (si aún no existe)
Si ya lo creaste, puedes saltar este paso y solo verificar.
'frontend' será el nombre de tu carpeta de proyecto.
npm create vite@latest frontend -- --template react

Al ejecutar el comando, selecciona manualmente:
Framework: React
Variant:   JavaScript

# 2. en terminal del visual ejecuta
npm install

# 3. Instalación de Dependencias Adicionales
React Router DOM para el enrutamiento de la aplicación

npm install react-router-dom

Axios para hacer peticiones HTTP al backend (muy recomendado)

npm install axios

# (Opcional, pero recomendado para estilos)
npm install react-icons

npm install bootstrap react-bootstrap

npm install react-bootstrap-icons

npm install react-toastify

npm install date-fns

# 5. Configuración de Variables de Entorno del Frontend
Crea un archivo .env en la raíz de tu carpeta 'frontend'
y añade la URL base de tu backend:
(Ejemplo)

VITE_BACKEND_URL=http://localhost:3200/api

Nota: Las variables de entorno en Vite deben comenzar con VITE_ para ser expuestas al cliente.

# 6. Iniciar el Servidor de Desarrollo al ser vite no usa npm start
npm run dev

# 7. Consideraciones para la Construcción para Producción
Genera los archivos estáticos optimizados para despliegue:

npm run build

# Para una vista previa local de la construcción de producción:
npm install -g serve

serve -s dist
