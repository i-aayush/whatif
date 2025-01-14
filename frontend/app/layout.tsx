import './globals.css'
import { Inter } from 'next/font/google'
import AuthProvider from '@/app/contexts/AuthContext'
import ClientLayout from './ClientLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'WhatIf - AI-Powered Image Generation',
  description: 'Upload your photos and generate customized images with AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body 
        className={`${inter.className} min-h-screen flex flex-col bg-white dark:bg-gray-900`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  )
}

