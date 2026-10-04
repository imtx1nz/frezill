import type { Metadata, Viewport } from "next";
import { Anuphan, Mitr } from "next/font/google";
import "./globals.css";

const anuphan = Anuphan({
  variable: "--font-anuphan",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const mitr = Mitr({
  variable: "--font-mitr",
  subsets: ["thai", "latin"],
  weight: ["500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "frezill", template: "%s · frezill" },
  description: "ตู้เย็นของทั้งบ้านในมือถือ เตือนก่อนของเป็นซาก",
};

export const viewport: Viewport = {
  themeColor: "#0b7a5c",
  colorScheme: "light", // stops Android force-darkening the ingredient pictures
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${anuphan.variable} ${mitr.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
