import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000', {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket?.id)
    })

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected')
    })

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error)
    })
  }

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
