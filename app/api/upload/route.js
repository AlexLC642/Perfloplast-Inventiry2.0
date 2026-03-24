import { NextResponse } from 'next/server';
import cloudinary from '../../../lib/cloudinary';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No se subió ningún archivo' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 0. CHECK CLOUDINARY CONFIGURATION FIRST
    const hasUrl = !!process.env.CLOUDINARY_URL;
    const hasIndividual = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
    
    if (!hasUrl && !hasIndividual) {
      const isVercel = process.env.VERCEL === '1' || !!process.env.NEXT_PUBLIC_VERCEL_URL;
      return NextResponse.json({ 
        error: 'ERROR DE CONFIGURACIÓN: Cloudinary no está configurado.',
        detail: 'Faltan las credenciales de Cloudinary en el servidor.',
        instruction: isVercel 
          ? 'Agrega CLOUDINARY_URL en el panel de Vercel (Configuración > Environment Variables).'
          : 'Agrega las variables en tu archivo .env local.'
      }, { status: 503 });
    }

    // 1. TRY CLOUDINARY (WITH 15s TIMEOUT)
    const uploadWithTimeout = async () => {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Cloudinary Timeout (15s) - La imagen podría ser muy pesada')), 15000)
      );
      
      const uploadPromise = new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'perflo-plast', resource_type: 'auto' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });

      return Promise.race([uploadPromise, timeoutPromise]);
    };

    try {
      const result = await uploadWithTimeout();
      return NextResponse.json({ 
        url: result.secure_url,
        public_id: result.public_id,
        storage: 'cloudinary'
      });
    } catch (cloudErr) {
      console.warn('--- Cloudinary Bypass/Fail ---', cloudErr.message);
      
      // 2. CONDITIONAL LOCAL FALLBACK (Disabled on Vercel)
      const isVercel = process.env.VERCEL === '1' || !!process.env.NEXT_PUBLIC_VERCEL_URL;
      
      if (isVercel) {
        console.error('Cloudinary Upload Failed in Production:', cloudErr);
        return NextResponse.json({ 
          error: 'ERROR DE CLOUDINARY: No se pudo procesar la imagen.',
          detail: cloudErr.message || 'Error desconocido durante la subida',
          instruction: 'Verifica que tus credenciales en Vercel sean válidas y que el formato de imagen sea compatible.'
        }, { status: 503 });
      }

      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      try { await fs.mkdir(uploadDir, { recursive: true }); } catch (e) {}

      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const filePath = path.join(uploadDir, fileName);
      await fs.writeFile(filePath, buffer);
      
      return NextResponse.json({ 
        url: `/uploads/${fileName}`,
        storage: 'local',
        warning: 'Saved locally (Cloudinary was unavailable)'
      });
    }
  } catch (error) {
    console.error('Critical Upload Error:', error);
    return NextResponse.json({ error: 'Error crítico en el servidor de subida' }, { status: 500 });
  }
}
