import { NextResponse } from 'next/server';
import cloudinary from '../../../lib/cloudinary';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No se subió ningún archivo' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary using a Promise wrapper for the stream
    const uploadToCloudinary = () => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { 
            folder: 'perflo-plast',
            resource_type: 'auto' 
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });
    };

    const result = await uploadToCloudinary();
    
    return NextResponse.json({ 
      url: result.secure_url,
      public_id: result.public_id
    });
  } catch (error) {
    console.error('Error en subida Cloudinary:', error);
    return NextResponse.json({ error: 'Error al subir a la nube' }, { status: 500 });
  }
}
