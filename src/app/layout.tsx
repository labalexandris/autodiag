import type { Metadata, Viewport } from "next";
import { Commissioner, Fira_Sans, Fira_Sans_Condensed } from "next/font/google";
import { Toaster } from "@/components/toast";
import "./globals.css";

const fira = Fira_Sans({
  subsets: ["latin", "greek"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fira",
});
const firaCond = Fira_Sans_Condensed({
  subsets: ["latin", "greek"],
  weight: ["500", "600", "700"],
  variable: "--font-fira-cond",
});

/* Γραμματοσειρά της κράτησης: μεταβλητή, με τον άξονα «flair» για τους τίτλους */
const commissioner = Commissioner({
  subsets: ["latin", "greek"],
  axes: ["FLAR", "VOLM"],
  variable: "--font-commissioner",
});

export const metadata: Metadata = {
  title: { default: "AutoDiag", template: "%s · AutoDiag" },
  description: "Ηλεκτρολογείο αυτοκινήτων: online ραντεβού και ψηφιακό βιβλιάριο οχήματος.",
};

export const viewport: Viewport = {
  themeColor: "#1e5fb8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="el" className={`${fira.variable} ${firaCond.variable} ${commissioner.variable}`}>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
