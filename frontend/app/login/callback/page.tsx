'use client';

import { Suspense } from 'react';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

function LoginCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    const fullName = searchParams.get('full_name');
    const authProvider = searchParams.get('auth_provider');
    const picture = searchParams.get('picture');
    const userId = searchParams.get('user_id');

    if (token && email && fullName && userId) {
      // Store user data
      const userData = { 
        _id: userId,
        email, 
        full_name: fullName,
        auth_provider: authProvider || 'email',
        picture_url: picture || null
      };
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);
      setUser(userData);
      
      // For all users, go directly to canvas
      router.push('/canvas');
    } else {
      // Handle error
      router.push('/login?error=Authentication failed');
    }
  }, [searchParams, router, setUser]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <h2 className="mt-6 text-center text-xl font-medium text-gray-900">
            Completing login...
          </h2>
        </div>
      </div>
    </div>
  );
}

export default function LoginCallback() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <h2 className="mt-6 text-center text-xl font-medium text-gray-900">
                Loading...
              </h2>
            </div>
          </div>
        </div>
      }
    >
      <LoginCallbackContent />
    </Suspense>
  );
} 