import { WebSocketServer } from 'ws';
import { EventEmitter } from 'events';
import https from 'https';
import { options } from './certificate-options.js';


let broadcast = (data) => {
    // console.log('default broadcast');
    // nothing happens because no websocketClient is connected
};


function logParser(msg) {
    // data.timestamp = new Date().getTime();

    let d = msg.data.timestamp.split(',');
    let localTimestamp = new Date(d[0], d[1], d[2], d[3], d[4], d[5], d[6]);
    localTimestamp = formatDate(localTimestamp);
    // msg.data.timestamp = formatDate(msg.data.timestamp);

    // msg.data.color = '#FFFFFF';
    switch (msg.data.type) {
        case 'log':
            console.log(`[${ localTimestamp }] ${ msg.data.protocol } ${ msg.data.subProtocol }: ${ msg.data.message }`);
            // msg.data.color = '#FFFFFF';
            break;
        case 'err':
            console.error(`[${ localTimestamp }] ${ msg.data.protocol } ${ msg.data.subProtocol }: ${ msg.data.message }`);
            // msg.data.color = '#FF0000';
            break;
        case 'inf':
            console.info(`[${ localTimestamp }] ${ msg.data.protocol } ${ msg.data.subProtocol }: ${ msg.data.message }`);
            // msg.data.color = '#00FF00';
            break;
        case 'wrn':
            console.warn(`[${ localTimestamp }] ${ msg.data.protocol } ${ msg.data.subProtocol }: ${ msg.data.message }`);
            // msg.data.color = '#FFFF00';
            break;
        case 'dbg':
            console.debug(`[${ localTimestamp }] ${ msg.data.protocol } ${ msg.data.subProtocol }: ${ msg.data.message }`);
            // msg.data.color = '#00FFFF';
            break;
        default:
            // console.log('default');
            console.log(`[${ localTimestamp }] ${ msg.data.protocol } ${ msg.data.subProtocol }: ${ msg.data.message }`);
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


function toTimeString(ts) {
    return ts.getUTCFullYear() + "," +
        ts.getUTCMonth() + "," +
        ts.getUTCDate() + "," +
        ts.getUTCHours() + "," +
        ts.getUTCMinutes() + "," +
        ts.getUTCSeconds() + "," +
        ts.getUTCMilliseconds();
}

class CommunicationManager extends EventEmitter {
    constructor() {
        super();
        this.emitter = new EventEmitter();

        this.clientSubscriptions = new Map();

        this.logCache = [];

        // OPTIONS VARIABLE
        this.subOptions = [
            'twitch-message',
            'twitch-event',
            'log',
            'tiktok-event'
        ];

        // Loggs
        this.emitter.on('log', (data) => {
            data.timestamp = toTimeString(data.timestamp);

            let msg = {
                transport: 'log',
                data: data
            };

            this.logCache.push(msg);

            // msg.data.timestamp = new Date(msg.data.timestamp);
            // msg.data.timestamp = getDate(msg.data.timestamp);
            logParser(msg);
        });

        // Twitch chat messages
        this.emitter.on('twitch-message', (data) => {
            // temporary fix for badges
            data.tags.badges = [];
            data.timestamp = toTimeString(data.timestamp);

            let commentData = {
                message: data.parameters,
                author: data.tags['display-name'],
                timestamp: data.timestamp,
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

        // TikTOk
        this.emitter.on('tiktok-event', (data) => {

            data.timestamp = toTimeString(data.timestamp)

            let sendData = {
                transport: 'tiktok-event',
                data: data
            };
            broadcast(JSON.stringify(sendData));
        });

        // Twitch notifications
        this.emitter.on("twitch-chat-notice", (data) => {
            data.timestamp = toTimeString(data.timestamp);

            let sendData = {
                transport: 'twitch-chat-notice',
                data: data
            };
            broadcast(JSON.stringify(sendData));
        })


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

                        const subs = new Set(msg.subs);
                        this.clientSubscriptions.set(ws, subs);
                        ws.send(JSON.stringify({ transport: 'subConfirm', subs: msg.subs }));

                        // send cached logs if subscribed to logCache
                        let timeStamp = toTimeString(new Date())

                        if (subs.has('log-cache')) {
                            let data = {
                                transport: 'log-cache',
                                data: {
                                    timestamp: timeStamp,
                                    logs: this.logCache
                                }
                            }
                            ws.send(JSON.stringify(data));
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


const formatDate = (date) => `${ date.getFullYear() }-` +
    `${ (date.getMonth() + 1).toString().padStart(2, '0') }-` +
    `${ date.getDate().toString().padStart(2, '0') } ` +
    `${ date.getHours().toString().padStart(2, '0') }:` +
    `${ date.getMinutes().toString().padStart(2, '0') }:` +
    `${ date.getSeconds().toString().padStart(2, '0') }.` +
    `${ date.getMilliseconds().toString().padStart(3, '0') }`;


