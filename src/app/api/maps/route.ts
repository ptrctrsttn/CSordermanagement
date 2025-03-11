import { NextResponse } from 'next/server'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const address = searchParams.get('address')
  const startAddress = searchParams.get('startAddress')

  if (!type || !address) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
  }

  try {
    if (type === 'geocode') {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
      )
      const data = await response.json()
      return NextResponse.json(data)
    }

    if (type === 'distancematrix' && startAddress) {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(startAddress)}&destinations=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
      )
      const data = await response.json()
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching from Google Maps API:', error)
    return NextResponse.json({ error: 'Failed to fetch from Google Maps API' }, { status: 500 })
  }
} 