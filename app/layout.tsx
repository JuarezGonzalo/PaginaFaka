import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "La Taberna de Faka | Fakallen",
  description: "Gaming, clips, charlas de taberna y comunidad. Donde siempre hay una silla libre para un aventurero.",
  icons: {
    icon: [{ url: "/favicon-barrel.png", type: "image/png", sizes: "512x512" }],
    shortcut: "/favicon-barrel.png",
    apple: "/favicon-barrel.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
