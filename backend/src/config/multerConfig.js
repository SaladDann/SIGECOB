// backend/src/config/multerConfig.js
import multer from 'multer';
import path from 'path';
import fs from 'fs'; // Necesario para crear la carpeta si no existe

// Directorio donde se guardarán las imágenes
const uploadDir = 'uploads/products';
const absoluteUploadDir = path.resolve(uploadDir);

// Asegurarse de que el directorio de carga exista
fs.mkdirSync(absoluteUploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, absoluteUploadDir);
    },
    filename: (req, file, cb) => {
        // Genera un nombre de archivo único con la extensión original
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// Filtro para aceptar solo ciertos tipos de archivos
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true); // Aceptar el archivo
    } else {
        cb(new Error('Tipo de archivo no soportado. Solo se permiten imágenes JPEG, PNG o GIF.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 5 // Límite de 5MB por archivo
    }
});

export default upload;