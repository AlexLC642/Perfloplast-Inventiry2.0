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
  let body;
  try {
    body = await request.json();
    
    // 1. ALWAYS SAVE LOCALLY (REDUNDANCY)
    try {
      await fs.writeFile(SETTINGS_PATH, JSON.stringify(body, null, 2));
    } catch (saveLocalErr) {
      console.error("Local Save Error:", saveLocalErr);
    }

    // 2. SAVE TO MONGODB (IF AVAILABLE)
    try {
      const client = await clientPromise;
      const db = client.db("perflo-plast");
      const result = await db.collection("settings").findOneAndUpdate(
        { type: "global" },
        { $set: { ...body, type: "global", updatedAt: new Date() } },
        { upsert: true, returnDocument: 'after' }
      );
      return NextResponse.json(result);
    } catch (mongoErr) {
      console.warn("MongoDB Save Failed, using Local instead:", mongoErr);
      // If Local worked, we return the body as "success"
      return NextResponse.json(body);
    }
  } catch (e) {
    console.error("Critical Settings POST Error:", e);
    return NextResponse.json({ error: 'Error al procesar configuración' }, { status: 500 });
  }
}
