const users = [];

function addUser({ id, username, roomId }) {
  const user = { id, username, roomId };
  users.push(user);
  return user;
}

function removeUser(id) {
  const index = users.findIndex(user => user.id === id);
  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
}

function getUsersInRoom(roomId) {
  return users.filter(user => user.roomId === roomId);
}

export { addUser, removeUser, getUsersInRoom };
