import './globals.css'
import { Inter } from 'next/font/google'
import AuthProvider from '@/app/contexts/AuthContext'
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
  openGraph: {
    title: 'WhatIf - Unleash Your Imagination',
    description: 'Create and train custom AI models for image generation. Transform your ideas into reality with WhatIf AI.',
    url: 'https://whatif.databiceps.com',
    siteName: 'WhatIf AI',
    images: [
      {
        url: 'https://whatif-genai.s3.us-east-1.amazonaws.com/prompt_images/07fd35e53b600eb4d1ba27186298c24acc2a26e206aee508dd13de55b9ebaeb6.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIA2UC3B4NJZZIPNU3K%2F20250125%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250125T100404Z&X-Amz-Expires=300&X-Amz-Security-Token=IQoJb3JpZ2luX2VjECIaCXVzLWVhc3QtMSJHMEUCIQChq6xDe28%2BTheMF56b45xJdTUsnl2GmgERh3Uw%2F1daRAIgXcnpJYtwcSDhyMHQBpKLxhIfu2j1HajdtXA5bP%2BZii0q6AIIKxAAGgw3MzAzMzU0MDQ4ODMiDAQOW9fbxiWxMMRMkyrFAtYHROpi8AjmavBwhxWVe3QAJwBTT9LzdFVzTiqmUsImHVSHB5KtgN7LNS5OWOngwGf%2FwNHGvy8OnAiH4qsF4BSRuxjd3TIRTSa%2B0w2E6BLYiy1Vs%2Bh9iwVXUWsGoxEzNHUd1uKj8GJpO9EqdEqGgfgsrahQY7Fq2T%2FZTtiEbjVBFJCYtfd7Ke%2Bo46UjkCrrezAoHEEgjcTI%2FXNLC677WV78zUM8HpM6m%2FAuoj74m48lUmFOfTHVzZyWZpnWNOIbQmOT%2F%2BWeC%2FlMZJqw1AOrm2dMX7C6v2GWUzOfKGX8l2a0A4PYJnak4FWG%2Fje7%2FUwtNZwnMbNbXMfdt3fq0d9n7Ln2JCIo1HAPpYveUvNlaL%2FwEn98%2F8dK%2BNOeTt3iV59QYtILz%2BR959pdJQ1lFraMeI%2B2wPxHzwV86tjCXk1QJweRENO7IB0w5O3SvAY6swKr7%2FPBkvqfIwBbe3s8QuXISoJhUDW7%2BOTqJrxBqH5oQBCprEsiB9Mw6GzX2vAX6cQsA%2B8eJWBCwfwhUL5qeBZ7bCvxbJxtNi6mgLT0wQo7HOn%2FET17lVv%2F9HGrLS6bPmO1qJ0LNoWn9fNvlG2F4UD7azdCo4Eeqy0RZNtSeTUlvScYuqtOJjqO9iqtRalbyiPJx00%2FT2g%2FGaLCIXcmBKqqcrtzBnD9VI1cXqXFHuzS79joJNQinKbWOEeK4lTt5QRAoFQxkdsEinTz4IXqVSeFOZEYb102pycfro1pkbJTCkV1GPmtrMXgRQ2B69NENILedQbcgEt%2Fwb%2Fb2lmr37hFm6IsE9yRgoo5IQOBtVQylkLy7Fty%2B4kitH37EW8YtptfRpU76gDIEGxTc5VIItps8L3f&X-Amz-Signature=9f5ca04aced4c59aed2d0cde4e7af2414972cd8e6f269eca0f086b0b369434a3&X-Amz-SignedHeaders=host&response-content-disposition=inline',
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
    images: ['https://whatif-genai.s3.us-east-1.amazonaws.com/prompt_images/07fd35e53b600eb4d1ba27186298c24acc2a26e206aee508dd13de55b9ebaeb6.png'],
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
      <body 
        className={`${inter.className} antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <ClientLayout>
            {children}
            <SafeSpeedInsights />
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  )
}

