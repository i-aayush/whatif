import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react-dom/test-utils'
import CanvasPage from '../app/canvas/page'
import { AuthProvider } from '../app/contexts/AuthContext'
import { API_URL } from '../app/config/config'

// Mock the next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// Mock react-intersection-observer
jest.mock('react-intersection-observer', () => ({
  useInView: () => ({ ref: jest.fn(), inView: true }),
}))

// Mock the auth context
jest.mock('../app/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
    authLoading: false,
  }),
}))

describe('CanvasPage', () => {
  // Mock fetch before each test
  beforeEach(() => {
    global.fetch = jest.fn()
    localStorage.setItem('token', 'test-token')
  })

  // Clear mocks after each test
  afterEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  describe('Authentication and Initial Load', () => {
    it('should redirect to login if no user', async () => {
      // Mock auth context to return no user
      jest.spyOn(require('../app/contexts/AuthContext'), 'useAuth').mockImplementation(() => ({
        user: null,
        authLoading: false,
      }))

      const router = require('next/navigation').useRouter()
      render(<CanvasPage />)

      await waitFor(() => {
        expect(router.push).toHaveBeenCalledWith('/login')
      })
    })

    it('should load subscription and models on mount', async () => {
      // Mock successful API responses
      global.fetch = jest.fn()
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'active' })
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { status: 'succeeded', version: 'v1', trigger_word: 'test-model' }
          ])
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            inferences: [],
            has_more: false
          })
        }))

      render(<CanvasPage />)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(3)
        expect(fetch).toHaveBeenCalledWith(
          `${API_URL}/users/me/subscription`,
          expect.any(Object)
        )
      })
    })
  })

  describe('Image Generation', () => {
    it('should handle image generation with valid prompt', async () => {
      // Mock successful API responses for initial load
      global.fetch = jest.fn()
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'active' })
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ inferences: [], has_more: false })
        }))

      render(<CanvasPage />)

      // Wait for initial load
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(3)
      })

      // Mock inference API call
      global.fetch = jest.fn().mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ inference_id: 'test-id' })
      }))

      // Type prompt and generate
      const promptInput = screen.getByPlaceholderText(/describe your image/i)
      await userEvent.type(promptInput, 'test prompt')
      
      const generateButton = screen.getByText(/generate image/i)
      await userEvent.click(generateButton)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          `${API_URL}/canvasinference/inference`,
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('test prompt')
          })
        )
      })
    })

    it('should disable generate button without prompt', async () => {
      // Mock successful API responses
      global.fetch = jest.fn()
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'active' })
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ inferences: [], has_more: false })
        }))

      render(<CanvasPage />)

      const generateButton = screen.getByText(/generate image/i)
      expect(generateButton).toBeDisabled()
    })
  })

  describe('Gallery and Recent Tab', () => {
    it('should load more images when scrolling', async () => {
      // Mock successful API responses for initial load
      global.fetch = jest.fn()
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'active' })
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            inferences: [
              {
                inference_id: 'test-1',
                output_urls: ['test-url-1'],
                status: 'completed',
                parameters: { prompt: 'test prompt 1' }
              }
            ],
            has_more: true
          })
        }))

      render(<CanvasPage />)

      // Wait for initial load
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(3)
      })

      // Mock next page load
      global.fetch = jest.fn().mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          inferences: [
            {
              inference_id: 'test-2',
              output_urls: ['test-url-2'],
              status: 'completed',
              parameters: { prompt: 'test prompt 2' }
            }
          ],
          has_more: false
        })
      }))

      // Trigger intersection observer
      await act(async () => {
        const { ref, inView } = require('react-intersection-observer').useInView()
        ref(document.createElement('div'))
      })

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          `${API_URL}/canvasinference/inferences?page=1&limit=20`,
          expect.any(Object)
        )
      })
    })

    it('should handle image selection and viewer', async () => {
      // Mock successful API responses
      global.fetch = jest.fn()
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'active' })
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            inferences: [
              {
                inference_id: 'test-1',
                output_urls: ['test-url-1'],
                status: 'completed',
                parameters: { prompt: 'test prompt 1' }
              }
            ],
            has_more: false
          })
        }))

      render(<CanvasPage />)

      // Wait for images to load
      await waitFor(() => {
        expect(screen.getByAltText('test prompt 1')).toBeInTheDocument()
      })

      // Click on image
      fireEvent.click(screen.getByAltText('test prompt 1'))

      // Check if viewer is shown
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })
}) 