import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "سامانه مدیریت کلینیک چندتخصصی درد رام",
  description:
    "مدیریت یکپارچه بیماران، پرسنل، همکاران ارجاع‌دهنده، CRM و داروخانه کلینیک رام",
  other: {
    "codex-preview": "development",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
