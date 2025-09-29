import { Inter } from 'next/font/google';
import { SessionProvider } from '@/components/auth/SessionProvider';
import { CartProvider } from '@/contexts/CartContext';
import { CartSidebar } from '@/components/cart/CartSidebar';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Fabriqly - Custom Design Marketplace',
  description: 'Connect with designers and create custom products',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <CartProvider>
            {children}
            <CartSidebar />
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
