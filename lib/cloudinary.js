import { v2 as cloudinary } from 'cloudinary';

// Si existe CLOUDINARY_URL, el SDK lo usará automáticamente.
// De lo contrario, usamos las variables individuales para soporte local.
// Explicit Configuration to avoid auto-detection issues in Next.js Serverless
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dnnztpv9w',
  api_key: process.env.CLOUDINARY_API_KEY || '444395252463268',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'nbpyqobaqInDSga2zYqEs9ercB0',
  secure: true
});

export default cloudinary;
