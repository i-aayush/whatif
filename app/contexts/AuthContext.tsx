'use client'

import React, { createContext, useState, useContext, useEffect } from 'react'

interface User {
  email: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        'username': email,
        'password': password,
      })
    })

    if (response.ok) {
      const data = await response.json()
      const user = { email }
      setUser(user)
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('token', data.access_token)
    } else {
      throw new Error('Login failed')
    }
  }

  const signup = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          'username': email,
          'password': password,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Signup failed:', response.status, errorText);
        throw new Error(`Signup failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('Signup successful:', data);
      // After successful signup, log the user in
      await login(email, password);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider;

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

