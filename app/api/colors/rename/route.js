import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb';

// PUT: Rename or Unify a color globally across all products
export async function PUT(request) {
  try {
    const body = await request.json();
    const { oldName, newName, hex } = body;

    if (!oldName || !newName) {
      return NextResponse.json({ error: 'Los parámetros oldName y newName son obligatorios.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("perflo-plast");

    const normalizedOld = oldName.trim().toLowerCase();
    const normalizedNew = newName.trim().charAt(0).toUpperCase() + newName.trim().slice(1);

    // Fetch all products with colors in MongoDB
    const products = await db.collection("products").find({ colors: { $exists: true } }).toArray();

    let updatedCount = 0;

    for (const p of products) {
      let changed = false;
      const updatedColors = p.colors.map(c => {
        if (c && c.name && c.name.trim().toLowerCase() === normalizedOld) {
          changed = true;
          return {
            ...c,
            name: normalizedNew,
            hex: hex !== undefined ? hex : c.hex
          };
        }
        return c;
      });

      if (changed) {
        await db.collection("products").updateOne(
          { _id: p._id },
          { $set: { colors: updatedColors, updatedAt: new Date() } }
        );
        updatedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Color '${oldName}' actualizado con éxito a '${normalizedNew}' en ${updatedCount} productos.`,
      updatedProductsCount: updatedCount 
    });
  } catch (e) {
    console.error("Global Color Rename Error:", e);
    return NextResponse.json({ error: 'Error al actualizar colores globalmente.' }, { status: 500 });
  }
}

// DELETE: Delete a color globally across all products
export async function DELETE(request) {
  try {
    const body = await request.json();
    const { colorName } = body;

    if (!colorName) {
      return NextResponse.json({ error: 'El parámetro colorName es obligatorio.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("perflo-plast");

    const normalizedName = colorName.trim().toLowerCase();

    // Fetch all products with colors in MongoDB
    const products = await db.collection("products").find({ colors: { $exists: true } }).toArray();

    let updatedCount = 0;

    for (const p of products) {
      const originalLength = p.colors.length;
      const filteredColors = p.colors.filter(c => c && c.name && c.name.trim().toLowerCase() !== normalizedName);

      if (filteredColors.length < originalLength) {
        await db.collection("products").updateOne(
          { _id: p._id },
          { $set: { colors: filteredColors, updatedAt: new Date() } }
        );
        updatedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Color '${colorName}' eliminado con éxito de ${updatedCount} productos.`,
      updatedProductsCount: updatedCount 
    });
  } catch (e) {
    console.error("Global Color Delete Error:", e);
    return NextResponse.json({ error: 'Error al eliminar color globalmente.' }, { status: 500 });
  }
}
