import './globals.css'
import { Inter } from 'next/font/google'
import AuthProvider from '@/app/contexts/AuthContext'
import { ModalProvider } from './providers/ModalProvider'
import ClientLayout from './ClientLayout'
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Metadata } from 'next'

const inter = Inter({ subsets: ['latin'] })

const SafeSpeedInsights = () => {
  try {
    return <SpeedInsights />;
  } catch (error) {
    // Silently handle the error
    return null;
  }
};

export const metadata: Metadata = {
  title: 'WhatIf AI - Unleash Your Imagination',
  description: 'Create and train custom AI models for image generation. Transform your ideas into reality with WhatIf AI.',
  metadataBase: new URL('https://whatif.ai'),
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: 'https://whatif-genai.s3.us-east-1.amazonaws.com/examples/Image+07-02-25+at+5.27%E2%80%AFPM.jpeg', type: 'image/jpeg', sizes: '32x32' },
      { url: 'https://whatif-genai.s3.us-east-1.amazonaws.com/examples/Image+07-02-25+at+5.27%E2%80%AFPM.jpeg', type: 'image/jpeg', sizes: '192x192' }
    ],
    apple: [
      { url: 'https://whatif-genai.s3.us-east-1.amazonaws.com/examples/Image+07-02-25+at+5.27%E2%80%AFPM.jpeg', sizes: '180x180', type: 'image/jpeg' }
    ]
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'WhatIf - Unleash Your Imagination',
    description: 'Create and train custom AI models for image generation. Transform your ideas into reality with WhatIf AI.',
    url: 'https://whatif.databiceps.com',
    siteName: 'WhatIf AI',
    images: [
      {
        url: 'https://whatif-genai.s3.us-east-1.amazonaws.com/examples/Image+07-02-25+at+5.27%E2%80%AFPM.jpeg',
        width: 1200,
        height: 630,
        alt: 'WhatIf - Unleash Your Imagination',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WhatIf - Unleash Your Imagination',
    description: 'Create and train custom AI models for image generation. Transform your ideas into reality with WhatIf AI.',
    images: ['https://whatif-genai.s3.us-east-1.amazonaws.com/examples/Image+07-02-25+at+5.27%E2%80%AFPM.jpeg'],
    creator: '@whatif_ai',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          type="image/jpeg"
          sizes="32x32"
          href="https://whatif-genai.s3.us-east-1.amazonaws.com/examples/Image+07-02-25+at+5.27%E2%80%AFPM.jpeg"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="https://whatif-genai.s3.us-east-1.amazonaws.com/examples/Image+07-02-25+at+5.27%E2%80%AFPM.jpeg"
        />
      </head>
      <body 
        className={`${inter.className} antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <ModalProvider>
            <ClientLayout>
              {children}
              <SafeSpeedInsights />
            </ClientLayout>
          </ModalProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

