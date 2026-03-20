import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import fs from 'fs/promises';
import path from 'path';

const SETTINGS_PATH = path.join(process.cwd(), 'data', 'settings.json');

async function getLocalSettings() {
  try {
    const data = await fs.readFile(SETTINGS_PATH, 'utf8');
    return JSON.parse(data);
  } catch (e) { return { productSceneBackground: '' }; }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("perflo-plast");
    const settings = await db.collection("settings").findOne({ type: "global" });
    
    if (!settings) {
      const local = await getLocalSettings();
      return NextResponse.json(local);
    }
    
    return NextResponse.json(settings);
  } catch (e) {
    const local = await getLocalSettings();
    return NextResponse.json(local);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("perflo-plast");
    
    // Use upsert to maintain a single settings document
    const result = await db.collection("settings").findOneAndUpdate(
      { type: "global" },
      { $set: { ...body, type: "global", updatedAt: new Date() } },
      { upsert: true, returnDocument: 'after' }
    );
    
    return NextResponse.json(result);
  } catch (e) {
    console.error("MongoDB Settings Error:", e);
    return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 });
  }
}
