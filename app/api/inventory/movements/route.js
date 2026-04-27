import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const movements = await prisma.inventoryMovement.findMany({
      include: {
        product: { select: { name: true, sku: true } },
        warehouse: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    return NextResponse.json(movements);
  } catch (error) {
    console.error('Error fetching movements:', error);
    return NextResponse.json({ error: 'Error al obtener movimientos' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { productId, warehouseId, type, quantity, reason } = await request.json();

    if (!productId || !warehouseId || !type || !quantity) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) return NextResponse.json({ error: 'Cantidad inválida' }, { status: 400 });

    // Transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the Movement record
      const movement = await tx.inventoryMovement.create({
        data: {
          productId: parseInt(productId),
          warehouseId: parseInt(warehouseId),
          type,
          quantity: qty,
          reason,
          userId: parseInt(session.user.id)
        }
      });

      // 2. Update or Create Stock record
      const adjustment = type === 'ENTRY' ? qty : -qty;

      const stock = await tx.stock.upsert({
        where: {
          productId_warehouseId: {
            productId: parseInt(productId),
            warehouseId: parseInt(warehouseId)
          }
        },
        update: {
          quantity: { increment: adjustment }
        },
        create: {
          productId: parseInt(productId),
          warehouseId: parseInt(warehouseId),
          quantity: adjustment
        }
      });

      return { movement, stock };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Movement Error:', error);
    return NextResponse.json({ error: 'Error al registrar el movimiento' }, { status: 500 });
  }
}
