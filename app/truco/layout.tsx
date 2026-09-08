import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mesa de Truco | La Taberna de Faka",
  description: "Sentate a la mesa de La Taberna de Faka y preparate para desafiar al Tabernero.",
};

export default function TrucoLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
