let ioInstance;

export const initSocket = (io) => {
  ioInstance = io;
  
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);
    
    // Clients can join a specific event room to get scoped updates
    socket.on('join_event', (eventId) => {
      socket.join(`event:${eventId}`);
      console.log(`[Socket] ${socket.id} joined event:${eventId}`);
    });
    
    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
};

export const emitInventoryUpdate = (eventId, blockId, availableUnits, allocatedUnits) => {
  if (!ioInstance) return;
  ioInstance.to(`event:${eventId}`).emit('inventory:update', {
    inventoryBlockId: blockId,
    availableUnits,
    allocatedUnits
  });
};

export const emitBookingCreated = (eventId, bookingData) => {
  if (!ioInstance) return;
  ioInstance.to(`event:${eventId}`).emit('booking:created', bookingData);
};

export const emitInventoryExpired = (eventId, blockId) => {
  if (!ioInstance) return;
  ioInstance.to(`event:${eventId}`).emit('inventory:expired', { inventoryBlockId: blockId });
};

export const emitGuestUpdate = (eventId, guestData) => {
  if (!ioInstance) return;
  ioInstance.to(`event:${eventId}`).emit('guest:update', guestData);
};
