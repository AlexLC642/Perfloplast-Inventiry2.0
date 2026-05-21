import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';

export const revalidate = 300;

export async function GET() {
  try {
    const api_url = process.env.NEXT_PUBLIC_LARAVEL_API_URL || 'https://perfloplast-app-6t3dz.ondigitalocean.app';
    const response = await fetch(`${api_url}/api/catalog`, {
      next: { revalidate: 300 }
    });
    
    if (!response.ok) throw new Error('Error fetching from Laravel API');
    
    const data = await response.json();
    
    // We fetch from MongoDB to get the visual adjustments (brightness, shadows, etc.)
    const client = await clientPromise;
    const db = client.db("perflo-plast");
    const mongoProducts = await db.collection("products").find({}).toArray();

    // Merge Laravel products with MongoDB adjustments if they match by ID or name
    const mergedProducts = data.products.map(p => {
      const adjustment = mongoProducts.find(m => m.id === p.id || m.name === p.name);
      return adjustment ? { ...p, ...adjustment } : p;
    });

    return NextResponse.json(mergedProducts);
  } catch (e) {
    console.error("Hybrid API GET Error:", e);
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("perflo-plast");
    
    // Save or Update the product adjustments in MongoDB
    const result = await db.collection("products").updateOne(
      { name: body.name }, // Use name as unique identifier if ID is not available from Laravel yet
      { 
        $set: { 
          ...body, 
          updatedAt: new Date() 
        },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true, result }, { status: 201 });
  } catch (e) {
    console.error("MongoDB POST Error:", e);
    return NextResponse.json({ error: 'Error al guardar en la nube' }, { status: 500 });
  }
}
