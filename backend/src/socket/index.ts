import { Server as HTTPServer } from 'http'
import { Server, Socket } from 'socket.io'
import { logger } from '../utils/logger'

export interface SocketUser {
  userId: string
  socketId: string
}

let io: Server

export const setupSocketIO = (httpServer: HTTPServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  io.on('connection', (socket: Socket) => {
    logger.info(`WebSocket connected: ${socket.id}`)

    // Join content room (for likes, views, etc.)
    socket.on('join:content', (contentId: string) => {
      socket.join(`content:${contentId}`)
      logger.info(`Socket ${socket.id} joined content room: ${contentId}`)
    })

    // Leave content room
    socket.on('leave:content', (contentId: string) => {
      socket.leave(`content:${contentId}`)
      logger.info(`Socket ${socket.id} left content room: ${contentId}`)
    })

    // Join course room
    socket.on('join:course', (courseId: string) => {
      socket.join(`course:${courseId}`)
      logger.info(`Socket ${socket.id} joined course room: ${courseId}`)
    })

    // Leave course room
    socket.on('leave:course', (courseId: string) => {
      socket.leave(`course:${courseId}`)
      logger.info(`Socket ${socket.id} left course room: ${courseId}`)
    })

    // Join alpha post room
    socket.on('join:alpha', (postId: string) => {
      socket.join(`alpha:${postId}`)
      logger.info(`Socket ${socket.id} joined alpha room: ${postId}`)
    })

    // Leave alpha post room
    socket.on('leave:alpha', (postId: string) => {
      socket.leave(`alpha:${postId}`)
      logger.info(`Socket ${socket.id} left alpha room: ${postId}`)
    })

    // Join comment room (for replies and likes)
    socket.on('join:comment', (commentId: string) => {
      socket.join(`comment:${commentId}`)
      logger.info(`Socket ${socket.id} joined comment room: ${commentId}`)
    })

    // Leave comment room
    socket.on('leave:comment', (commentId: string) => {
      socket.leave(`comment:${commentId}`)
      logger.info(`Socket ${socket.id} left comment room: ${commentId}`)
    })

    // Disconnect
    socket.on('disconnect', () => {
      logger.info(`WebSocket disconnected: ${socket.id}`)
    })
  })

  return io
}

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io not initialized')
  }
  return io
}

// Helper functions to emit events
export const emitLikeUpdate = (targetId: string, targetType: string, data: any) => {
  const room = `${targetType}:${targetId}`
  io.to(room).emit('likeUpdate', data)
  logger.info(`Emitted likeUpdate to room ${room}:`, data)
}

export const emitBookmarkUpdate = (targetId: string, targetType: string, data: any) => {
  const room = `${targetType}:${targetId}`
  io.to(room).emit('bookmarkUpdate', data)
  logger.info(`Emitted bookmarkUpdate to room ${room}:`, data)
}

export const emitViewUpdate = (targetId: string, targetType: string, data: any) => {
  const room = `${targetType}:${targetId}`
  io.to(room).emit('viewUpdate', data)
  logger.info(`Emitted viewUpdate to room ${room}:`, data)
}

export const emitNewComment = (contentId: string, contentType: string, comment: any) => {
  // Emit to generic content room (matches join:content event)
  const room = `content:${contentId}`
  io.to(room).emit('newComment', comment)
  logger.info(`Emitted newComment to room ${room} (contentType: ${contentType})`)
}

export const emitNewReply = (commentId: string, reply: any) => {
  const room = `comment:${commentId}`
  io.to(room).emit('newReply', reply)
  logger.info(`Emitted newReply to room comment:${commentId}`)
}

export const emitCommentLikeUpdate = (commentId: string, contentId: string, contentType: string, data: any) => {
  // Emit to comment room
  const commentRoom = `comment:${commentId}`
  io.to(commentRoom).emit('commentLikeUpdate', data)
  logger.info(`Emitted commentLikeUpdate to room ${commentRoom}:`, data)

  // Also emit to content room so all viewers see the update (matches join:content event)
  const contentRoom = `content:${contentId}`
  io.to(contentRoom).emit('commentLikeUpdate', data)
  logger.info(`Emitted commentLikeUpdate to room ${contentRoom} (contentType: ${contentType}):`, data)
}

export const emitCommentDeleted = (
  commentId: string,
  contentId: string,
  contentType: string,
  parentCommentId: string | undefined,
  deletedReplies: string[]
) => {
  const data = {
    commentId,
    parentCommentId,
    deletedReplies, // Array of reply IDs that were also deleted (if parent was deleted)
  }

  // Always emit to content room
  const contentRoom = `content:${contentId}`
  io.to(contentRoom).emit('commentDeleted', data)
  logger.info(`Emitted commentDeleted to room ${contentRoom} (contentType: ${contentType}):`, data)

  // If this was a reply, also emit to parent comment's room
  if (parentCommentId) {
    const parentRoom = `comment:${parentCommentId}`
    io.to(parentRoom).emit('commentDeleted', data)
    logger.info(`Emitted commentDeleted to parent room ${parentRoom}:`, data)
  }

  // Also emit to the deleted comment's own room (for modals that might be open)
  const commentRoom = `comment:${commentId}`
  io.to(commentRoom).emit('commentDeleted', data)
  logger.info(`Emitted commentDeleted to own room ${commentRoom}:`, data)
}
