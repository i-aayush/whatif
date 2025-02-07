export function generateOgImageUrl({
  prompt,
  imageUrl,
  username,
}: {
  prompt?: string
  imageUrl?: string
  username?: string
}) {
  const url = new URL('/api/og', process.env.NEXT_PUBLIC_APP_URL || 'https://whatif.ai')
  
  if (prompt) url.searchParams.append('prompt', prompt)
  if (imageUrl) url.searchParams.append('imageUrl', imageUrl)
  if (username) url.searchParams.append('username', username)
  
  return url.toString()
}

export function getMetadataForImage({
  prompt,
  imageUrl,
  username,
}: {
  prompt?: string
  imageUrl?: string
  username?: string
}) {
  const ogImageUrl = generateOgImageUrl({ prompt, imageUrl, username })
  
  return {
    openGraph: {
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: prompt || 'Generated image',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      images: [ogImageUrl],
    },
  }
} 