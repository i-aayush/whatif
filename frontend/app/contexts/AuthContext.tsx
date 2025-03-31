'use client'

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react'
import { API_URL } from '../config/config';
import { User } from '../types/user';

interface CachedData {
  timestamp: number;
  data: any;
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<any>
  signup: (email: string, password: string, fullName: string, age: number, gender: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  checkModelStatus: () => Promise<boolean>
  setUser: (user: User | null) => void
  isAuthenticated: boolean
  getSubscriptionStatus: () => Promise<any>
  refreshCredits: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [modelStatusCache, setModelStatusCache] = useState<CachedData | null>(null)
  const [subscriptionCache, setSubscriptionCache] = useState<CachedData | null>(null)
  const [creditsCache, setCreditsCache] = useState<CachedData | null>(null)
  const [pendingPromises, setPendingPromises] = useState<{[key: string]: Promise<any>}>({})

  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  const isCacheValid = (cache: CachedData | null) => {
    return cache && (Date.now() - cache.timestamp) < CACHE_DURATION;
  }

  // Function to handle pending promises to prevent duplicate requests
  const getOrCreatePromise = (key: string, createPromise: () => Promise<any>) => {
    if (!pendingPromises[key]) {
      const promise = createPromise().finally(() => {
        setPendingPromises(prev => {
          const { [key]: _, ...rest } = prev;
          return rest;
        });
      });
      setPendingPromises(prev => ({ ...prev, [key]: promise }));
      return promise;
    }
    return pendingPromises[key];
  }

  const refreshUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !user) return;

      // Use Promise.all to fetch all data in parallel
      const [creditsResponse, subscriptionResponse, modelStatusResponse] = await Promise.all([
        // Only fetch credits if cache is invalid
        !isCacheValid(creditsCache) ? 
          fetch(`${API_URL}/credits/balance`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }) : null,
        // Only fetch subscription if cache is invalid
        !isCacheValid(subscriptionCache) ?
          fetch(`${API_URL}/users/me/subscription`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }) : null,
        // Only fetch model status if cache is invalid
        !isCacheValid(modelStatusCache) ?
          fetch(`${API_URL}/training/training-runs`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }) : null
      ].filter(Boolean)); // Filter out null promises

      // Process responses and update caches
      const responses = await Promise.all(creditsResponse ? [creditsResponse.json()] : []);
      if (responses[0]) {
        const { balance } = responses[0];
        setCreditsCache({
          timestamp: Date.now(),
          data: balance
        });
        setUser(prev => prev ? { ...prev, credits: balance } : null);
        
        // Update localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          localStorage.setItem('user', JSON.stringify({ ...parsedUser, credits: balance }));
        }
      }

    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  }, [user, creditsCache, subscriptionCache, modelStatusCache]);

  // Consolidated useEffect for initial data loading
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser)
      setUser({
        ...parsedUser,
        credits: parsedUser.credits || 0
      })
      // Fetch fresh data after setting initial user state
      refreshUserData();
    }
    setIsLoading(false)
  }, []);

  // Refresh data periodically
  useEffect(() => {
    if (user) {
      const interval = setInterval(refreshUserData, CACHE_DURATION);
      return () => clearInterval(interval);
    }
  }, [user, refreshUserData]);

  const checkModelStatus = useCallback(async (): Promise<boolean> => {
    try {
      if (modelStatusCache && isCacheValid(modelStatusCache)) {
        return modelStatusCache.data;
      }

      const token = localStorage.getItem('token');
      if (!token || !user) return false;

      const response = await fetch(`${API_URL}/training/training-runs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch training runs');
      }

      const trainings = await response.json();
      const status = trainings.some((t: any) => t.status === 'succeeded');
      
      setModelStatusCache({
        timestamp: Date.now(),
        data: status
      });

      return status;
    } catch (error) {
      console.error('Error checking model status:', error);
      return false;
    }
  }, [modelStatusCache, user]);

  const getSubscriptionStatus = useCallback(async () => {
    try {
      if (subscriptionCache && isCacheValid(subscriptionCache)) {
        return subscriptionCache.data;
      }

      const token = localStorage.getItem('token');
      if (!token || !user) throw new Error('No authentication token found');

      const response = await fetch(`${API_URL}/users/me/subscription`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription status');
      }

      const data = await response.json();
      setSubscriptionCache({
        timestamp: Date.now(),
        data
      });

      return data;
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      throw error;
    }
  }, [subscriptionCache, user]);

  const refreshCredits = useCallback(async () => {
    if (creditsCache && isCacheValid(creditsCache)) {
      return creditsCache.data;
    }
    return refreshUserData();
  }, [creditsCache, refreshUserData]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const loginPromise = getOrCreatePromise('login', async () => {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            username: email,
            password 
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Login failed');
        }

        const data = await response.json();
        
        // Fetch initial credit balance
        const creditsResponse = await fetch(`${API_URL}/credits/balance`, {
          headers: {
            'Authorization': `Bearer ${data.token}`
          }
        });
        
        if (!creditsResponse.ok) {
          throw new Error('Failed to fetch credit balance');
        }
        
        const { balance } = await creditsResponse.json();
        
        const userData = { 
          _id: data._id,
          email: data.email, 
          full_name: data.full_name,
          credits: balance
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', data.token);
        return data;
      });

      await loginPromise;

      const subscriptionData = await getSubscriptionStatus();
      return subscriptionData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, fullName: string, age: number, gender: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          age,
          gender
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Signup failed');
      }

      const data = await response.json();
      
      // Fetch initial credit balance
      const creditsResponse = await fetch(`${API_URL}/credits/balance`, {
        headers: {
          'Authorization': `Bearer ${data.token}`
        }
      });
      
      if (!creditsResponse.ok) {
        throw new Error('Failed to fetch credit balance');
      }
      
      const { balance } = await creditsResponse.json();
      
      const userData = { 
        _id: data._id,
        email: data.email, 
        full_name: data.full_name,
        credits: balance
      };
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', data.token);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setIsLoading(false)
    }
  }

  const logout = useCallback(() => {
    setUser(null)
    setModelStatusCache(null)
    setSubscriptionCache(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }, [])

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      signup, 
      logout, 
      isLoading, 
      checkModelStatus, 
      getSubscriptionStatus,
      setUser,
      refreshCredits,
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 