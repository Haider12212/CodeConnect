const rooms = new Map();

function generateRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let roomId = '';
  for (let i = 0; i < 6; i++) {
    roomId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  rooms.set(roomId, []);
  return roomId;
}

function addUserToRoom(roomId, user) {
  if (rooms.has(roomId)) {
    rooms.get(roomId).push(user);
  } else {
    rooms.set(roomId, [user]);
  }
}

function removeUserFromRoom(roomId, userId) {
  if (rooms.has(roomId)) {
    const users = rooms.get(roomId).filter(user => user.id !== userId);
    rooms.set(roomId, users);
    if (users.length === 0) {
      rooms.delete(roomId);
    }
  }
}

function getRoomUsers(roomId) {
  return rooms.get(roomId) || [];
}

function getTotalUsers() {
  let totalUsers = 0;
  for (const users of rooms.values()) {
    totalUsers += users.length;
  }
  return totalUsers;
}

export { generateRoomId,rooms ,addUserToRoom, removeUserFromRoom, getRoomUsers, getTotalUsers };
