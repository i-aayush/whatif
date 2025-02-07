'use client'

import Link from 'next/link'
import { useAuth } from '@/app/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { API_URL } from './config/config'
import { toast } from 'react-hot-toast'

function Navigation() {
  const { user, logout, checkModelStatus } = useAuth();
  const router = useRouter();

  const handleGetStartedClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/signup');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Check subscription status
      const response = await fetch(`${API_URL}/users/me/subscription`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription status');
      }

      const data = await response.json();
      
      if (data.status === 'active') {
        // If subscription is active, redirect to canvas
        router.push('/canvas');
      } else {
        // If no active subscription, redirect to pricing
        router.push('/pricing');
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      router.push('/pricing');
    }
  };

  return (
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
              href="/prompt_examples" 
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white inline-flex items-center px-1 pt-1 text-sm font-medium"
            >
              WhatIf Examples
            </Link>
            <a 
              href="#"
              onClick={handleGetStartedClick}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white inline-flex items-center px-1 pt-1 text-sm font-medium"
            >
              Get Started
            </a>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">{user.full_name}</span>
              <button
                onClick={logout}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navigation />
      {children}
    </>
  )
} 