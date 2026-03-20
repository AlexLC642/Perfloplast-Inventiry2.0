import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("perflo-plast");
    
    // Clean body of _id if present to avoid immutable field error
    const { _id, ...updateData } = body;
    
    const result = await db.collection("products").findOneAndUpdate(
      { _id: ObjectId.isValid(id) ? new ObjectId(id) : id },
      { $set: { ...updateData, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      return NextResponse.json({ message: 'Producto no encontrado' }, { status: 404 });
    }
    
    return NextResponse.json(result);
  } catch (e) {
    console.error("MongoDB PUT Error:", e);
    return NextResponse.json({ error: 'Error al actualizar en la nube' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const client = await clientPromise;
    const db = client.db("perflo-plast");
    
    const result = await db.collection("products").deleteOne({
      _id: ObjectId.isValid(id) ? new ObjectId(id) : id
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'Producto no encontrado' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("MongoDB DELETE Error:", e);
    return NextResponse.json({ error: 'Error al eliminar en la nube' }, { status: 500 });
  }
}
