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
    
                // Send the file data to the server
                socket.emit('file', {
                    username,
                    fileData,
                    fileName,
                    roomId
                });
    
                log('File upload complete: ' + fileName);
    
                // Enable sending messages after file upload
                $('#messageInput').prop('disabled', false);
                $('#sendMessageBtn').prop('disabled', false);
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
        }
    });
    // Client-side code
// Assuming you're using Socket.IO on the client side

    // Listen for file data from the server
    socket.on('file', (data) => {
        if (data.username !== username) {
            appendMessage(data.username, `sent a file: ${data.fileName}`, 'left', 'green', data.time);
            downloadFile(data);
        }
    });

    function downloadFile(data) {
        const { fileData, fileName } = data;
    
        // Create a blob from the file data
        const blob = new Blob([fileData], { type: 'application/octet-stream' });
    
        // Create a URL for the blob
        const url = URL.createObjectURL(blob);
    
        // Create a link to download the file
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
    
        // Append the link to the body (required for Firefox)
        document.body.appendChild(a);
    
        // Programmatically click the link to trigger the download
        a.click();
    
        // Remove the link from the document
        document.body.removeChild(a);
    
        // Revoke the URL to release memory
        URL.revokeObjectURL(url);
    }
    
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
