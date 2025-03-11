import { NextResponse } from 'next/server'

const WS_SERVER_URL = process.env.WS_SERVER_URL || 'http://localhost:3001'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Forward the update to the WebSocket server
    const response = await fetch(`${WS_SERVER_URL}/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Failed to broadcast update')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error broadcasting update:', error)
    return NextResponse.json({ error: 'Failed to broadcast update' }, { status: 500 })
  }
} 