$(document).ready(function () {
    const socket = io("http://localhost:3000/");
    let username = '';
    let roomId = '';
    let fileTimeout;

    // Show the username modal on page load
    $('#usernameModal').modal({ backdrop: 'static', keyboard: false });
    $('#usernameModal').modal('show');

    // Save username and proceed to room selection
    $('#saveUsername').click(function () {
        username = $('#usernameInput').val().trim();
        if (username) {
            $('#usernameModal').modal('hide');
            $('#roomModal').modal({ backdrop: 'static', keyboard: false });
            $('#roomModal').modal('show');
        }
    });

    // Join existing room
    $('#joinRoomBtn').click(function () {
        roomId = $('#roomIdInput').val().trim();
        if (roomId) {
            joinRoom();
        }
    });

    // Create new room
    $('#createRoomBtn').click(function () {
        socket.emit('createRoom');
    });

    socket.on('roomCreated', (newRoomId) => {
        roomId = newRoomId;
        joinRoom();
    });

    // Join room through navbar
    $('#joinRoom').click(function () {
        roomId = $('#roomInput').val().trim();
        if (roomId) {
            joinRoom();
        }
    });

    function joinRoom() {
        $('#roomModal').modal('hide');
        $('#chatContainer').show();
        $('#navbarRoomInput').hide();
        $('#roomIdDisplay').text(`Your room ID: ${roomId}`);
        $('#totalUsersDisplay').text(`Total Users Online: 0`); // Placeholder until updated
        socket.emit('join', { username, roomId });
    }

    // Handle form submission to send messages
    $('#messageForm').submit(function (e) {
        e.preventDefault();
        const message = $('#messageInput').val();
        if (message.trim()) {
            socket.emit('message', message);
            $('#messageInput').val('');
            appendMessage(username, message, 'right', 'blue', new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
    });

    // Handle file submission
    $('#fileInput').change(function (e) {
        e.preventDefault();
        const file = $(this).prop('files')[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                const fileData = event.target.result;
                const fileName = file.name;
                log('Uploading file: ' + fileName);

                // Send file metadata
                socket.emit('file-meta', {
                    metadata: {
                        filename: fileName,
                        total_buffer_size: fileData.byteLength
                    },
                    uid: roomId
                });
                socket.emit('fs-start', {
                    uid: roomId
                });

                const chunkSize = 1024 * 8; // 8 KB
                let offset = 0;
                let progressBar = $('#fileUploadProgress');
                progressBar.attr('max', fileData.byteLength);
                progressBar.val(0);

                function sendChunk() {
                    if (offset < fileData.byteLength) {
                        const chunk = fileData.slice(offset, offset + chunkSize);
                        socket.emit('file-raw', {
                            buffer: chunk,
                            uid: roomId
                        });
                        offset += chunkSize;
                        progressBar.val(offset);
                        setTimeout(sendChunk, 0); // Schedule next chunk
                    } else {
                        socket.emit('file-end', {
                            uid: roomId
                        });
                        log('File upload complete: ' + fileName);

                        // Enable sending messages after file upload
                        $('#messageInput').prop('disabled', false);
                        $('#sendMessageBtn').prop('disabled', false);
                    }
                }

                sendChunk(); // Start sending chunks
            };

            reader.readAsArrayBuffer(file);

            // Clear the file input
            $(this).val('');

            // Display the file name
            $('#fileNameContainer').empty(); // Clear previous file name if any
            const fileNameElement = $('<p></p>').text(file.name);
            $('#fileNameContainer').append(fileNameElement);

            // Disable sending messages until file upload completes
            $('#messageInput').prop('disabled', true);
            $('#sendMessageBtn').prop('disabled', true);
        }
    });

    // Handle form submission to send messages
    $('#messageInput').keypress(function (e) {
        if (e.which === 13 && !e.shiftKey) {
            e.preventDefault();
            const message = $(this).val();
            if (message.trim()) {
                socket.emit('message', message);
                $(this).val('');
                appendMessage('You', message, 'right', 'blue', new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            }
        }
    });

    // Append messages to the chat box
    function appendMessage(username, message, position, color, time) {
        const sender = (username === 'You') ? 'You' : username;
        const messageElement = `
                <div class="message ${position} ${color}">
                    <strong>${sender}</strong>
                    <div>${message}</div>
                    <small class="text-muted">${time}</small>
                </div>`;
        $('#chatBox').append(messageElement);
        $('#chatBox').scrollTop($('#chatBox')[0].scrollHeight);
    }

    // Listen for messages from the server
    socket.on('message', (data) => {
        if (data.username !== username) {
            appendMessage(data.username, data.message, 'left', 'green', data.time);
            console.log('received message:', data.message);
        }
    });
    // Client-side code
// Assuming you're using Socket.IO on the client side

socket.on('file', (data) => {
    const { username, fileData, fileName, time } = data;
  
    // Check if the file is from the current user, if so, ignore it
    if (username === 'current_username') {
      return;
    } else {
      console.log('Received file:', fileName, fileData, time);
      
      // Example: Display the file content in a <div>
      const fileContentDiv = document.getElementById('fileContent');
      fileContentDiv.innerHTML += `<p><strong>${username}</strong> sent a file (${fileName}) at ${time}</p>`;
      fileContentDiv.innerHTML += `<pre>${fileData}</pre>`;
    }
  });
  


    // Listen for user join notifications
    socket.on('userJoined', ({ username, users }) => {
        appendMessage('System', `${username} has joined the chat`, 'center', 'gray', new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        updateActiveUsers(users);
    });

    // Listen for user leave notifications
    socket.on('userLeft', ({ username, users }) => {
        appendMessage('System', `${username} has left the chat`, 'center', 'gray', new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        updateActiveUsers(users);
    });

    // Update active users display
    function updateActiveUsers(users) {
        const activeUsersHTML = users.map(user => `<li>${user.username}</li>`).join('');
        $('#chatHeader').text(`Active Users: ${users.length}`);
        $('#activeUsersDisplay').html(`<ul>${activeUsersHTML}</ul>`);
    }

    // Update total users display
    socket.on('updateUserCount', (totalUsers) => {
        $('#totalUsersDisplay').text(`Total Users Online: ${totalUsers}`);
    });

    // Log function for debugging
    function log(message) {
        console.log(message);
    }
});
