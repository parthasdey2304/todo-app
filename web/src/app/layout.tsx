import type { Metadata } from "next";
import { Space_Grotesk, Syne, JetBrains_Mono, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

const space = Space_Grotesk({ subsets: ["latin"], weight: ["700"], variable: "--font-space" });
const syne = Syne({ subsets: ["latin"], weight: ["800"], variable: "--font-syne" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["800"], variable: "--font-mono-brutal" });
const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" });

export const metadata: Metadata = {
  title: "VASTAVIK TODO — BRUTAL TASK MACHINE",
  description: "Funky brutalist ToDo — zero radius, thick borders, manga energy",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${space.variable} ${syne.variable} ${jetbrains.variable} ${bebas.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
