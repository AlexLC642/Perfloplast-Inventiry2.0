import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
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
    const client = await clientPromise;
    const db = client.db("perflo-plast");
    const products = await db.collection("products").find({}).toArray();
    
    // Auto-Migrate: If DB is empty, seed from local JSON for the first time
    if (products.length === 0) {
      const local = await getLocalProducts();
      if (local.length > 0) {
        // Remove local IDs to let MongoDB generate new ones, or keep them if needed
        const toInsert = local.map(({ id, ...rest }) => ({ ...rest, legacyId: id }));
        await db.collection("products").insertMany(toInsert);
        const migrated = await db.collection("products").find({}).toArray();
        return NextResponse.json(migrated.map(p => ({ ...p, id: p._id })));
      }
      return NextResponse.json([]);
    }

    // Map _id to id for frontend parity
    return NextResponse.json(products.map(p => ({ ...p, id: p._id })));
  } catch (e) {
    console.error("MongoDB GET Error, falling back to local:", e);
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
