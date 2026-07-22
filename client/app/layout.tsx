import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BootstrapClient from '@/components/BootstrapClient';
import AppProvider from '@/context/AppProvider';
import ScrollToTop from '@/components/ScrollToTop';

export const metadata = {
  title: 'Air Collection',
  description:
    'Air Collection is a clothing and fashion store in Hargeisa offering streetwear, casual wear, and modern styles online at aircollection.shop.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="d-flex flex-column min-vh-100">
        <AppProvider>
          <ScrollToTop />
          <Navbar />
          <main className="flex-grow-1">{children}</main>
          <Footer />
          <BootstrapClient />
        </AppProvider>
      </body>
    </html>
  );
}