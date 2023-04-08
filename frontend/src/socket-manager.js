import { EventEmitter } from 'events';

export class SocketManager extends EventEmitter {
    constructor(subs = []) {
        super();

        this.subs = subs;
        this.url = 'wss://' + window.location.hostname + ':4444';
        this.socket = new WebSocket(this.url);

        this.connect(this).then(() => {
            this.emit('connect', "Connected to server");
        });
    }

    async connect(socketManager) {
        this.socket.onopen = function (event) {

        };

        this.socket.onclose = function (event) {
            setTimeout(async function () {
                // connect();
                socketManager.emit('reconnect');
                socketManager.socket.connect();
            }, 1000);
        };

        this.socket.onerror = function (event) {
            socketManager.socket.close();
        };

        this.socket.onconnectionstatechange = function (event) {
            console.log('Connection state changed');
            console.log(event);
        };

        this.socket.onmessage = function (event) {
            let msg = JSON.parse(event.data);
            switch (msg.transport) {
                case 'session_welcome':
                    socketManager.socket.send(JSON.stringify({ transport: 'sub', subs: socketManager.subs }));
                    break;
                case 'subConfirm':
                    socketManager.emit('subConfirm', msg.subs);
                    break;
                case 'error':
                    socketManager.emit('error', msg.message);
                    break;
                default:
                    let data = JSON.parse(event.data);
                    socketManager.emit(data.transport, data.data);
                    break;
            }
        };
    }
}