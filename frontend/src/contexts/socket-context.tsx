'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '@/hooks/use-auth'

interface SocketContextValue {
  socket: Socket | null
  isConnected: boolean
  joinRoom: (roomType: 'content' | 'course' | 'alpha', id: string) => void
  leaveRoom: (roomType: 'content' | 'course' | 'alpha', id: string) => void
}

const SocketContext = createContext<SocketContextValue | null>(null)

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setIsConnected(false)
      }
      return
    }

    // Initialize socket connection
    const socketUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    newSocket.on('connect', () => {
      console.log('WebSocket connected:', newSocket.id)
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected')
      setIsConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      setIsConnected(false)
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
      setSocket(null)
      setIsConnected(false)
    }
  }, [isAuthenticated])

  const joinRoom = (roomType: 'content' | 'course' | 'alpha', id: string) => {
    if (!socket || !isConnected) {
      console.warn('Cannot join room: socket not connected')
      return
    }
    socket.emit(`join:${roomType}`, id)
    console.log(`Joined ${roomType} room:`, id)
  }

  const leaveRoom = (roomType: 'content' | 'course' | 'alpha', id: string) => {
    if (!socket || !isConnected) {
      return
    }
    socket.emit(`leave:${roomType}`, id)
    console.log(`Left ${roomType} room:`, id)
  }

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinRoom, leaveRoom }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider')
  }
  return context
}
