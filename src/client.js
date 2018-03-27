var socket = new WebSocket('ws://websocket-demo.lwio.me');

// Listen for messages
socket.addEventListener('message', function (event) {
    console.log('收到了', event.data);
});

// socket.send('keke')