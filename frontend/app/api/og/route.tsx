import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    // Get dynamic values from URL
    const prompt = searchParams.get('prompt')
    const imageUrl = searchParams.get('imageUrl')
    const username = searchParams.get('username')

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'white',
            position: 'relative',
          }}
        >
          {/* Background Pattern */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(circle at 25px 25px, lightgray 2%, transparent 0%), radial-gradient(circle at 75px 75px, lightgray 2%, transparent 0%)',
              backgroundSize: '100px 100px',
              opacity: 0.1,
            }}
          />

          {/* Main Content Container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              maxWidth: '80%',
              textAlign: 'center',
              zIndex: 1,
            }}
          >
            {/* Logo and Title */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <span
                style={{
                  fontSize: 40,
                  fontWeight: 'bold',
                  background: 'linear-gradient(90deg, #4F46E5, #9333EA)',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                WhatIf AI
              </span>
            </div>

            {/* Generated Image */}
            {imageUrl && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                }}
              >
                {/* @ts-ignore */}
                <img
                  src={imageUrl}
                  alt={prompt || 'Generated image'}
                  width={400}
                  height={400}
                  style={{
                    objectFit: 'cover',
                  }}
                />
              </div>
            )}

            {/* Prompt Text */}
            {prompt && (
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 'normal',
                  color: '#374151',
                  marginBottom: '10px',
                  maxWidth: '600px',
                }}
              >
                {prompt}
              </div>
            )}

            {/* Username */}
            {username && (
              <div
                style={{
                  fontSize: 16,
                  color: '#6B7280',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                Created by {username}
              </div>
            )}
          </div>

          {/* Watermark */}
          <div
            style={{
              position: 'absolute',
              bottom: 20,
              right: 20,
              fontSize: 14,
              color: '#9CA3AF',
            }}
          >
            whatif.ai
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e: any) {
    console.log(`${e.message}`)
    return new Response(`Failed to generate the image`, {
      status: 500,
    })
  }
} 