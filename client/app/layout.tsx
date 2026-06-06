import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BootstrapClient from '@/components/BootstrapClient';
import AppProvider from '@/context/AppProvider';

export const metadata = {
  title: 'Air Collection - Premium Fashion E-commerce',
  description: 'Shop the latest trends in fashion with Air Collection',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="d-flex flex-column min-vh-100">
        <AppProvider>
          <Navbar />
          <main className="flex-grow-1">{children}</main>
          <Footer />
          <BootstrapClient />
        </AppProvider>
      </body>
    </html>
  );
}