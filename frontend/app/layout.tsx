import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "./components/navbar";
import AccessGuard from "./components/AccessGuard";
import { ThemeProvider } from "./components/Themeprovider";
import { ToolChainProvider } from "./components/ToolChainProvider";
import ModuleThemeShell from "./components/ModuleThemeShell";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PDF Tools — Ferramentas gratuitas para PDF, Imagem e XML",
  description:
    "Comprima, converta e edite seus arquivos PDF, imagens e XMLs gratuitamente. Sem cadastro, sem limites.",
};

// Script para prevenir FOUC - TEMA CLARO como padrão
const themeScript = `
  (function() {
    try {
      const savedTheme = localStorage.getItem('pdf-tools-theme');
      // Se não houver tema salvo, usar 'light' como padrão
      const theme = (savedTheme === 'dark' || savedTheme === 'light') ? savedTheme : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      window.__theme = theme;
    } catch (e) {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${syne.variable} ${dmSans.variable}`}>
        <ThemeProvider>
          <ToolChainProvider>
            <AccessGuard />
            <Navbar />
            <ModuleThemeShell>
              {children}
            </ModuleThemeShell>
          </ToolChainProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
