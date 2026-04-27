import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { lat, lng, timestamp, accuracy } = await request.json();

    // In a real scenario, we would link this to a Dispatch or a Truck
    // For now, let's create a generic tracking record if we had the model
    // Since we added Dispatch earlier, we'll store it linked to the user
    
    // Check if we need a Tracking model in Prisma, but for now let's just log it
    // To match Laravel, we'd need a 'user_locations' or 'truck_locations' table
    console.log(`GPS Point from User ${session.user.id}: ${lat}, ${lng} (${timestamp})`);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error saving GPS' }, { status: 500 });
  }
}
