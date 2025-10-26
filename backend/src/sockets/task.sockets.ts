import { Server } from 'socket.io';

export const registerTaskSockets = (io: Server) => {
  io.on('connection', (socket) => {
    socket.on('joinTasks', () => {
      socket.join('tasks');
    });
  });
};

export const emitTaskUpdated = (io: Server, payload: any) => {
  io.to('tasks').emit('taskUpdated', payload);
};

export const emitTaskAssigned = (io: Server, payload: any) => {
  io.to('tasks').emit('taskAssigned', payload);
};
