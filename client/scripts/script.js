$(document).ready(function() {
    const socket = io("http://localhost:3000/");
    let username = '';

    // Show the username modal on page load
    $('#usernameModal').modal({ backdrop: 'static', keyboard: false });
    $('#usernameModal').modal('show');

    // Save username and join the chat
    $('#saveUsername').click(function() {
        username = $('#usernameInput').val().trim();
        if (username) {
            $('#usernameModal').modal('hide');
            $('#chatContainer').show();
            socket.emit('join', username);
        }
    });

    // Handle form submission to send messages
    $('#messageForm').submit(function(e) {
        e.preventDefault();
        const message = $('#messageInput').val();
        if (message.trim()) {
            socket.emit('message', { username, message });
            $('#messageInput').val('');
            appendMessage(`You: ${message}`, 'right', 'blue');
        }
    });

    // Append messages to the chat box
    function appendMessage(message, position, color) {
        const messageElement = `<div class="message ${position} ${color}">${message}</div>`;
        $('#chatBox').append(messageElement);
        $('#chatBox').scrollTop($('#chatBox')[0].scrollHeight);
    }

    // Listen for messages from the server
    socket.on('message', (data) => {
        if (data.username !== username) {
            appendMessage(`${data.username}: ${data.message}`, 'left', 'green');
        }
    });

    // Listen for user join notifications
    socket.on('userJoined', (username) => {
        appendMessage(`${username} has joined the chat`, 'center', 'gray');
    });
});
