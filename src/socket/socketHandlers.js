const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const activeUsers = new Map();

const initializeSocketHandlers = (io) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.companyId = decoded.companyId;
      next();
    } catch (err) {
      logger.error('Socket authentication error:', err);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`User ${socket.userId} connected`);
    
    // Add user to active users
    activeUsers.set(socket.userId, {
      socketId: socket.id,
      connectedAt: new Date()
    });

    // Join company room
    if (socket.companyId) {
      socket.join(`company:${socket.companyId}`);
    }

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // Handle time tracking events
    socket.on('time:start', async (data) => {
      try {
        // Broadcast to company members
        io.to(`company:${socket.companyId}`).emit('user:status:update', {
          userId: socket.userId,
          status: 'working',
          taskId: data.taskId,
          timestamp: new Date()
        });
      } catch (error) {
        logger.error('Error handling time:start event:', error);
        socket.emit('error', { message: 'Failed to start time tracking' });
      }
    });

    socket.on('time:stop', async (data) => {
      try {
        // Broadcast to company members
        io.to(`company:${socket.companyId}`).emit('user:status:update', {
          userId: socket.userId,
          status: 'idle',
          timestamp: new Date()
        });
      } catch (error) {
        logger.error('Error handling time:stop event:', error);
        socket.emit('error', { message: 'Failed to stop time tracking' });
      }
    });

    // Handle activity updates
    socket.on('activity:update', async (data) => {
      try {
        // Broadcast activity to relevant users
        io.to(`company:${socket.companyId}`).emit('activity:broadcast', {
          userId: socket.userId,
          activity: data,
          timestamp: new Date()
        });
      } catch (error) {
        logger.error('Error handling activity:update event:', error);
      }
    });

    // Handle screenshot events
    socket.on('screenshot:captured', async (data) => {
      try {
        // Notify managers
        io.to(`company:${socket.companyId}:managers`).emit('screenshot:new', {
          userId: socket.userId,
          screenshotId: data.screenshotId,
          timestamp: new Date()
        });
      } catch (error) {
        logger.error('Error handling screenshot:captured event:', error);
      }
    });

    // Handle project updates
    socket.on('project:update', async (data) => {
      try {
        io.to(`project:${data.projectId}`).emit('project:updated', data);
      } catch (error) {
        logger.error('Error handling project:update event:', error);
      }
    });

    // Handle task updates
    socket.on('task:update', async (data) => {
      try {
        io.to(`project:${data.projectId}`).emit('task:updated', data);
      } catch (error) {
        logger.error('Error handling task:update event:', error);
      }
    });

    // Handle typing indicators
    socket.on('typing:start', (data) => {
      socket.to(data.room).emit('user:typing', {
        userId: socket.userId,
        isTyping: true
      });
    });

    socket.on('typing:stop', (data) => {
      socket.to(data.room).emit('user:typing', {
        userId: socket.userId,
        isTyping: false
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`User ${socket.userId} disconnected`);
      activeUsers.delete(socket.userId);
      
      // Notify company members
      io.to(`company:${socket.companyId}`).emit('user:offline', {
        userId: socket.userId,
        timestamp: new Date()
      });
    });
  });

  return io;
};

const getActiveUsers = () => {
  return Array.from(activeUsers.entries()).map(([userId, data]) => ({
    userId,
    ...data
  }));
};

const isUserActive = (userId) => {
  return activeUsers.has(userId);
};

const sendNotificationToUser = (io, userId, notification) => {
  io.to(`user:${userId}`).emit('notification:new', notification);
};

const broadcastToCompany = (io, companyId, event, data) => {
  io.to(`company:${companyId}`).emit(event, data);
};

module.exports = {
  initializeSocketHandlers,
  getActiveUsers,
  isUserActive,
  sendNotificationToUser,
  broadcastToCompany
};