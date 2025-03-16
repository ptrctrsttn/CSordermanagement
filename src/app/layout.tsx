import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import ClientLayout from './ClientLayout';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Order Management System",
  description: "Company order management system with Shopify integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
