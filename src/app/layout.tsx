import type { Metadata } from "next";
import {ClerkProvider} from "@clerk/nextjs";
import "./globals.css";
import { TRPCReactProvider } from "@/trpc/client";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Bloom - Build Apps with AI",
  description: "Create apps and websites by chatting with AI. Transform your ideas into reality with Bloom.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
    appearance={{
      variables:{
        colorPrimary: "#C96342",
      }
    }}
    >
    <TRPCReactProvider>
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased"
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <Toaster />
        {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
    </TRPCReactProvider>
    </ClerkProvider>
  ); 
}
