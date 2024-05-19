$(document).ready(function () {
    const socket = io("http://localhost:3000/");
    let username = '';
    let roomId = '';

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
    $('#fileInput').change(function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const fileName = file.name;
                const fileData = e.target.result;
                socket.emit('file-meta', { metadata: { filename: fileName, total_buffer_size: fileData.byteLength }, uid: roomId });
                socket.emit('fs-start', { uid: roomId });
                const chunkSize = 1024 * 8; // 8 KB
                for (let i = 0; i < fileData.byteLength; i += chunkSize) {
                    const buffer = fileData.slice(i, i + chunkSize);
                    socket.emit('file-raw', { buffer, uid: roomId });
                }
            };
            reader.readAsArrayBuffer(file);
            $('#fileInput').val('');
        }
    });
    
    // Handle drag and drop files
    $('#fileDropZone').on('dragover', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).addClass('dragging');
    });

    $('#fileDropZone').on('dragleave', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).removeClass('dragging');
    });

    $('#fileDropZone').on('drop', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).removeClass('dragging');
        const file = e.originalEvent.dataTransfer.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const fileName = file.name;
                const fileData = e.target.result;
                socket.emit('file', { fileName, fileData });
            };
            reader.readAsDataURL(file);
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
                <p>${message}</p>
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

    // Listen for files from the server
    socket.on('file', (data) => {
        if (data.username !== username) {
            const downloadLink = document.createElement('a');
            downloadLink.href = data.fileData;
            downloadLink.download = data.fileName;
            downloadLink.innerText = `Download ${data.fileName}`;
            const messageElement = `
                <div class="message left green">
                    <strong>${data.username}</strong>
                    <p>${downloadLink.outerHTML}</p>
                    <small class="text-muted">${data.time}</small>
                </div>`;
            $('#chatBox').append(messageElement);
            $('#chatBox').scrollTop($('#chatBox')[0].scrollHeight);
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
});
