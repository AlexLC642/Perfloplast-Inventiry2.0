import { NextResponse } from 'next/server';

export async function POST(request) {
  const body = await request.json();
  const { email, password } = body;

  if (email === 'admin@perfloplast.com' && password === 'perfloplast123') {
    // In a real app, we would use a proper JWT or session
    // For this local version, we'll set a simple cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_session', 'true', {
      httpOnly: true,
      secure: process.env.NODE_CO_ENV === 'production',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
    return response;
  }

  return NextResponse.json({ success: false, message: 'Credenciales inválidas' }, { status: 401 });
}
