import './globals.css';
import { Inter } from 'next/font/google';

import PremiumBackground from '../components/PremiumBackground';
const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Perflo-Plast | Inventario & Catálogo',
  description: 'Sistema integral de inventario y catálogo dinámico de Perflo-Plast.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Perflo-Plast',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#c5a059',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="preload" href="/images/backgrounds/premium-flat-gold.png" as="image" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap" rel="stylesheet" />
      </head>
      <body className={inter.className}>
        <PremiumBackground />
        {children}
      </body>
    </html>
  );
}
