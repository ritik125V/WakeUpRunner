import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { ThemeProvider } from '@/core/theme/themeContext';
import { WorkflowHeaderProvider } from '@/core/workflowHeaderContext';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://putman.r8r.in';

export const viewport: Viewport = {
  themeColor: '#FF6C37',
  colorScheme: 'dark light',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Putman | Open Source API Workflow & Journey Runner',
    template: '%s | Putman',
  },
  description:
    'The lightweight, local-first API workflow runner. Chain sequential HTTP requests, extract dynamic variables via JSONPath, and test multi-step backend journeys with zero cloud lock-in.',
  applicationName: 'Putman',
  keywords: [
    'API workflow runner',
    'chained API testing',
    'Postman alternative',
    'open source API client',
    'REST client',
    'local first API runner',
    'API test automation',
    'JSONPath token extraction',
    'cookie jar API testing',
    'multi-step HTTP runner',
    'sequential API requests',
    'developer tools',
    'API journey testing',
    'offline first developer tool',
    'browser API runner',
  ],
  authors: [{ name: 'Putman Core Team' }],
  creator: 'Putman',
  publisher: 'Putman',
  category: 'developer tools',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Putman API Workflow Runner',
    title: 'Putman | Open Source API Workflow & Journey Runner',
    description:
      'The lightweight, local-first API workflow runner. Chain sequential HTTP requests, extract dynamic variables, and test multi-step backend journeys with zero setup.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Putman - Open Source API Workflow Runner',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Putman | Open Source API Workflow & Journey Runner',
    description:
      'Chain sequential HTTP requests, extract dynamic variables via JSONPath, and validate backend journeys in your browser.',
    images: ['/og-image.png'],
    creator: '@putman_dev',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col selection:bg-[#f5f0e8] selection:text-black font-sans antialiased transition-colors duration-200" style={{ backgroundColor: 'var(--color-canvas, #09090b)', color: 'var(--color-text-primary, #f5f0e8)' }}>
        <ThemeProvider>
          <WorkflowHeaderProvider>
            <Navbar />
            <main className="flex-1 w-full">{children}</main>
          </WorkflowHeaderProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
