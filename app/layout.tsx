import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";
import { ConfigProvider } from 'antd';

export const metadata: Metadata = {
  metadataBase: new URL("https://sandevex.com"), // change after deployment

  title: {
    default: "Sandevex Hiring Portal",
    template: "%s | Sandevex",
  },

  description:
    "Sandevex Internship Hiring Management System – Manage candidates and offers easily.",

  keywords: [
    "Sandevex",
    "Hiring Portal",
    "Internship",
    "Recruitment",
    "Applicant Tracking System",
  ],

  icons: {
    icon: "/3.svg",
    shortcut: "/3.svg",
    apple: "/3.svg",
  },

  openGraph: {
    title: "Sandevex Hiring Portal",
    description:
      "Manage candidates and internship offers easily using Sandevex ATS.",
    url: "https://sandevex.com",
    siteName: "Sandevex",
    images: [
      {
        url: "/3.svg",
        width: 1200,
        height: 630,
        alt: "Sandevex Hiring Portal",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Sandevex Hiring Portal",
    description: "Internship recruitment management system",
    images: ["/3.svg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ConfigProvider>
            {children}
          </ConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
