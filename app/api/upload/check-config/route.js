import { NextResponse } from 'next/server';

export async function GET() {
  const isVercel = process.env.VERCEL === '1' || !!process.env.NEXT_PUBLIC_VERCEL_URL;
  
  const config = {
    CLOUDINARY_URL: !!process.env.CLOUDINARY_URL,
    CLOUDINARY_CLOUD_NAME: !!process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: !!process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: !!process.env.CLOUDINARY_API_SECRET,
    platform: isVercel ? 'Vercel' : 'Local/Other',
    node_env: process.env.NODE_ENV
  };

  const isConfigured = config.CLOUDINARY_URL || (config.CLOUDINARY_CLOUD_NAME && config.CLOUDINARY_API_KEY && config.CLOUDINARY_API_SECRET);

  return NextResponse.json({
    status: isConfigured ? 'Configured' : 'Missing Configuration',
    checks: config,
    advice: !isConfigured ? 'Please set CLOUDINARY_URL in your Vercel Dashboard.' : 'Configuration detected. If uploads fail, check if the credentials are valid.'
  });
}
