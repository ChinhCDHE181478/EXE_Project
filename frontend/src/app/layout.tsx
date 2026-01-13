// src/app/layout.tsx
import "./globals.css";
import Header from "./_components/Header";
import Footer from "./_components/Footer";
import { HeroProvider } from "./HeroProvider";

export const metadata = {
  title: "VivuPlan",
  description: "AI Travel meta + affiliate",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body suppressHydrationWarning>
        <HeroProvider> 
          <Header />  
          {children}
          <Footer />
        </HeroProvider>
      </body>
    </html>
  );
}
