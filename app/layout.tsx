"use client"; // Adiciona esta linha no topo do arquivo

import type { Metadata } from "next";
import localFont from "next/font/local";
import { useState, useEffect } from "react";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// export const metadata: Metadata = {
//   title: "Distribuidor de Materiais",
//   description: "Sistema de distribuição eficiente para lojas",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [theme, setTheme] = useState<string>("light");

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme);
    document.documentElement.classList.toggle("dark", storedTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white">
          {/* <h1 className="text-lg font-bold">Distribuidor de Materiais</h1> */}
          <button
            onClick={toggleTheme}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {theme === "light" ? "Modo Escuro" : "Modo Claro"}
          </button>
        </div>
        {children}
      </body>
    </html>
  );
}
