import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://simplenews.local";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default:
      "SimpleNews Media Group — Clear Daily News & Educational Journalism",
    template: "%s | SimpleNews Media Group",
  },
  description:
    "SimpleNews Media Group presents current events, technology, nature, space, and world news in clear, accessible language with beginner reading modes and key vocabulary explanations.",
  keywords: [
    "Simple news",
    "easy reading news",
    "beginner English news",
    "accessible journalism",
    "vocabulary builder",
    "educational news",
    "daily global news",
  ],
  authors: [{ name: "SimpleNews Media Group Editorial Staff" }],
  creator: "SimpleNews Media Group",
  publisher: "SimpleNews Media Group",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "SimpleNews Media Group",
    title: "SimpleNews Media Group — Clear Daily News & Educational Journalism",
    description:
      "SimpleNews Media Group presents current events, technology, nature, space, and world news in clear, accessible language with beginner reading modes and key vocabulary explanations.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SimpleNews Media Group — Clear Daily News & Educational Journalism",
    description:
      "SimpleNews Media Group presents current events, technology, nature, space, and world news in clear, accessible language with beginner reading modes and key vocabulary explanations.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-stone-50 text-stone-800 antialiased selection:bg-amber-100 selection:text-amber-900 min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
