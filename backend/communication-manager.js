import WebSocket, { WebSocketServer } from 'ws';
import { EventEmitter } from 'events';
import https from 'https';
import { options } from './certificate-options.js';

let broadcast = (data) => {
    // console.log('default broadcast');
    // nothing happens because no websocketClient is connected
};


function logParser(msg) {
    // data.timestamp = new Date().getTime();
    msg.data.color = '#FFFFFF';
    switch (msg.data.type) {
        case 'log':
            console.log(`[${ msg.data.timestamp }] ${ msg.data.protocol } ${ msg.data.subProtocol }: ${ msg.data.message }`);
            msg.data.color = '#FFFFFF';
            break;
        case 'err':
            console.error(`[${ msg.data.timestamp }] ${ msg.data.protocol } ${ msg.data.subProtocol }: ${ msg.data.message }`);
            msg.data.color = '#FF0000';
            break;
        case 'inf':
            console.info(`[${ msg.data.timestamp }] ${ msg.data.protocol } ${ msg.data.subProtocol }: ${ msg.data.message }`);
            msg.data.color = '#00FF00';
            break;
        case 'wrn':
            console.warn(`[${ msg.data.timestamp }] ${ msg.data.protocol } ${ msg.data.subProtocol }: ${ msg.data.message }`);
            msg.data.color = '#FFFF00';
            break;
        default:
            console.log('default');
            console.log(`[${ msg.data.timestamp }] ${ msg.data.protocol } ${ msg.data.subProtocol }: ${ msg.data.message }`);
    }
    broadcast(JSON.stringify(msg));
}

// SENDING ALLWAYS:
/*
Always with transport and data
*
* {
*  transport: 'log',
*  data: data
* }
*
* */


class CommunicationManager extends EventEmitter {
    constructor() {
        super();
        this.emitter = new EventEmitter();

        this.clientSubscriptions = new Map();

        // OPTIONS VARIABLE
        this.subOptions = [
            'twitch-message',
            'twitch-event',
            'log',
            'tiktok-event'
        ];

        // Loggs
        this.emitter.on('log', (data) => {
            let msg = {
                transport: 'log',
                data: data
            };
            msg.data.timestamp = new Date(msg.data.timestamp);
            msg.data.timestamp = getDate(msg.data.timestamp);
            logParser(msg);
        });

        // Twitch chat messages
        this.emitter.on('twitch-message', (data) => {
            // temporary fix for badges
            data.tags.badges = [];

            let commentData = {
                message: data.parameters,
                author: data.tags['display-name'],
                timestamp: new Date().toUTCString(),
                color: data.tags.color,
                bot: data.tags['display-name'] === process.env.TWITCH_CLIENT_USERNAME,
                command: data.parameters.startsWith('!'),
                badges: data.tags.badges
            };

            let sendData = {
                transport: 'twitch-message',
                data: commentData
            };


            broadcast(JSON.stringify(sendData));
        });

        let server = https.createServer(options);

        // Websocket server
        this.wsLogServer = new WebSocketServer({ server });

        this.wsLogServer.on('connection', (ws) => {

            ws.send(JSON.stringify({ transport: 'session_welcome', subOptions: this.subOptions }));

            ws.on('message', (msg) => {
                msg = JSON.parse(msg.toString());
                switch (msg.transport) {
                    case 'sub':
                        if (!msg.subs) return ws.send(JSON.stringify({ transport: 'error', message: 'No subs' }));
                        if (!this.clientSubscriptions.has(ws)) {
                            const subs = new Set(msg.subs);
                            this.clientSubscriptions.set(ws, subs);
                            ws.send(JSON.stringify({ transport: 'subConfirm', subs: msg.subs }));
                        } else {
                            let subFlags = this.clientSubscriptions.get(ws);
                            for (const sub of msg.subs) {
                                subFlags.add(sub);
                            }
                            this.clientSubscriptions.set(ws, subFlags);
                            ws.send(JSON.stringify({ transport: 'subConfirm', subs: msg.subs }));
                        }
                        break;
                    case 'unsub':
                        let subFlags = this.clientSubscriptions.get(ws);
                        if (subFlags) {
                            subFlags.delete(msg.subs);
                            this.clientSubscriptions.set(ws, subFlags);
                        }
                        break;
                    case 'close':
                        ws.close();
                        break;
                    default:
                        ws.send(JSON.stringify({ transport: 'error', message: 'Unknown transport' }));
                        break;
                }
            });

            ws.on('close', () => {
                // console.log('Client disconnected');
            });

            broadcast = (data) => {
                let subTopic = JSON.parse(data).transport;

                for (const [client, subs] of this.clientSubscriptions.entries()) {
                    if (subs.has(subTopic)) {
                        client.send(data);
                    }
                }
            };
        });

        server.listen(4444, () => {
            // console.log('Listening on port 443');
        });

    }
}

export const communicationManager = new CommunicationManager();

// End of getting MESSAGES


function getDate(date) {
    return formatDate(date);
}

const formatDate = (date) => `${ date.getFullYear() }-` +
    `${ (date.getMonth() + 1).toString().padStart(2, '0') }-` +
    `${ date.getDate().toString().padStart(2, '0') } ` +
    `${ date.getHours().toString().padStart(2, '0') }:` +
    `${ date.getMinutes().toString().padStart(2, '0') }:` +
    `${ date.getSeconds().toString().padStart(2, '0') }.` +
    `${ date.getMilliseconds().toString().padStart(3, '0') }`;


