import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        variants: true,
        stocks: {
          include: { warehouse: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    // Transform decimal to number for JSON compatibility if needed, 
    // but Prisma Client usually handles this or returns Decimal objects.
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products from MySQL:', error);
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    
    // Logic to save a new product in MySQL
    const product = await prisma.product.create({
      data: {
        name: body.name,
        description: body.description,
        salePrice: parseFloat(body.price) || 0,
        imageUrl: body.image,
        maskUrl: body.maskImage,
        baseHue: body.baseHue || 0,
        imageTransform: body.imageTransform,
        lumina: body.lumina,
        showInCatalog: true,
        // Add more fields as needed
      }
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('MySQL POST Error:', error);
    return NextResponse.json({ error: 'Error al guardar el producto' }, { status: 500 });
  }
}
