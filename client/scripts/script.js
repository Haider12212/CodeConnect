$(document).ready(function () {
    const socket = io("https://code-connect-server-8115bdc4c592.herokuapp.com");
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

    // Global variables
    let fileInputValue = null;

    // Handle file submission
    $('#fileInput').change(function (e) {
        e.preventDefault();
        const file = $(this).prop('files')[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('File size is too large. Please select a file smaller than 5MB.');
                return;
            }
            fileInputValue = file;
            const fileNameElement = $('<p></p>').text(file.name);
            $('#messageInput').val(file.name);
            $('#fileNameContainer').empty().append(fileNameElement);
        } else {
            fileInputValue = null;
            $('#fileNameContainer').empty();
            $('#messageInput').val('');
        }
    });

    // Handle form submission to send messages and files
    $('#messageForm').submit(function (e) {
        e.preventDefault();
        const message = $('#messageInput').val();
        if (message.trim() || fileInputValue) {
            const file = fileInputValue;
            fileInputValue = null;
            $('#fileNameContainer').empty();

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

                    // Append a message to the chat box with the file name
                    appendMessage('You', `sent a file: ${fileName}`, 'right', 'blue', new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), false);
                    $('#messageInput').val('');
                };

                reader.readAsArrayBuffer(file);

                // Disable sending messages until file upload completes
                $('#messageInput').prop('disabled', true);
                $('#sendMessageBtn').prop('disabled', true);
            } else {
                socket.emit('message', message);
                $('#messageInput').val('');
                appendMessage('You', message, 'right', 'blue', new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), true);
            }
        }
    });

    $('#messageInput').keypress(function (e) {
        if (e.which === 13 && !e.shiftKey) {
            e.preventDefault();
            const message = $(this).val();
            if (message.trim() || fileInputValue) {
                const file = fileInputValue;
                fileInputValue = null;
                $('#fileNameContainer').empty();

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

                        // Append a message to the chat box with the file name
                        appendMessage('You', `sent a file: ${fileName}`, 'right', 'blue', new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), false);
                    };

                    reader.readAsArrayBuffer(file);

                    // Disable sending messages until file upload completes
                    $('#messageInput').prop('disabled', true);
                    $('#sendMessageBtn').prop('disabled', true);
                } else {
                    socket.emit('message', message);
                    $(this).val('');
                    appendMessage('You', message, 'right', 'blue', new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), true);
                }
            }
        }
    });

    // Append messages to the chat box
    function appendMessage(username, message, position, color, time, includeCopyIcon = false) {
        const sender = (username === 'You') ? 'You' : username;
        const messageElement = $(`
            <div class="message ${position} ${color}">
                <strong>${sender}</strong>
                <div class="message-content">${message}</div>
                <small class="text-muted">${time}</small>
                ${includeCopyIcon ? '<i class="fas fa-copy copy-icon" title="Copy to clipboard"></i>' : ''}
            </div>
        `);
    
        if (includeCopyIcon) {
            const copyIcon = messageElement.find('.copy-icon');
            copyIcon.click(function() {
                copyToClipboard(message);
                copyIcon.css({ display: 'none' });
                const copiedMessage = $('<span class="copied-message">Copied</span>');
                messageElement.append(copiedMessage);
                setTimeout(() => {
                    copiedMessage.remove();
                    copyIcon.css({ display: 'inline' });
                }, 2000); // Display "Copied" message for 2 seconds
            });
        }
    
        $('#chatBox').append(messageElement);
        $('#chatBox').scrollTop($('#chatBox')[0].scrollHeight);
    }
    
    function copyToClipboard(text) {
        const tempInput = document.createElement('input');
        tempInput.style.position = 'absolute';
        tempInput.style.left = '-9999px';
        tempInput.value = text;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
    }
    

    // Listen for messages from the server
    socket.on('message', (data) => {
        if (data.username !== username) {
            appendMessage(data.username, data.message, 'left', 'green', data.time, true);
            playMessageSound();
        }
    });

    // Listen for file data from the server
    socket.on('file', (data) => {
        if (data.username !== username) {
            appendMessage(data.username, `sent a file: ${data.fileName}`, 'left', 'green', data.time, false);
            playMessageSound();
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
        appendMessage('System', `${username} has joined the chat`, 'center', 'gray', new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), false);
        updateActiveUsers(users);
    });

    // Listen for user leave notifications
    socket.on('userLeft', ({ username, users }) => {
        appendMessage('System', `${username} has left the chat`, 'center', 'gray', new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), false);
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
    
    function playMessageSound() {
        const messageSound = document.getElementById('messageSound');
        messageSound.play();
    }

});
