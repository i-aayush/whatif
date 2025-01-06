import './globals.css'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import AuthProvider from '@/app/contexts/AuthContext'

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
          <header className="fixed w-full top-0 z-50">
            <nav className="mx-auto px-4 sm:px-6 lg:px-8 bg-white/80 backdrop-blur-md dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex justify-between h-16">
                <div className="flex">
                  <div className="flex-shrink-0 flex items-center">
                    <Link href="/" className="text-2xl font-bold">
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                        WhatIf
                      </span>
                    </Link>
                  </div>
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    <Link 
                      href="/" 
                      className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white inline-flex items-center px-1 pt-1 text-sm font-medium"
                    >
                      Home
                    </Link>
                    <Link 
                      href="/get-started" 
                      className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white inline-flex items-center px-1 pt-1 text-sm font-medium"
                    >
                      Get Started
                    </Link>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Link 
                    href="/login" 
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link 
                    href="/signup" 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:shadow-lg transition-all"
                  >
                    Sign up
                  </Link>
                </div>
              </div>
            </nav>
          </header>
          <main className="flex-grow pt-16">
            {children}
          </main>
          <footer className="bg-gray-100">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <p className="text-center text-gray-500 text-sm">
                © 2025 WhatIf. All rights reserved.
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  )
}

