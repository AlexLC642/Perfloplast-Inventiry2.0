import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import fs from 'fs/promises';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'products.json');

async function getLocalProducts() {
  try {
    const data = await fs.readFile(DATA_PATH, 'utf8');
    return JSON.parse(data);
  } catch (e) { return []; }
}

export async function GET() {
  try {
    const api_url = process.env.NEXT_PUBLIC_LARAVEL_API_URL || 'https://perfloplast-app-6t3dz.ondigitalocean.app';
    const response = await fetch(`${api_url}/api/catalog`, {
      cache: 'no-store' // Para que siempre traiga datos frescos
    });
    
    if (!response.ok) throw new Error('Error fetching from Laravel API');
    
    const data = await response.json();
    
    // Devolvemos solo los productos para mantener compatibilidad con el frontend actual
    return NextResponse.json(data.products);
  } catch (e) {
    console.error("Laravel API GET Error, falling back to local:", e);
    const local = await getLocalProducts();
    return NextResponse.json(local);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("perflo-plast");
    
    const newProduct = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection("products").insertOne(newProduct);
    return NextResponse.json({ id: result.insertedId, ...newProduct }, { status: 201 });
  } catch (e) {
    console.error("MongoDB POST Error:", e);
    return NextResponse.json({ error: 'Error al guardar en la nube' }, { status: 500 });
  }
}
