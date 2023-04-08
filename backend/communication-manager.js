import WebSocket, { WebSocketServer } from 'ws';
import { EventEmitter } from 'events';


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
        this.emitter.on('twitchmessage', (data) => {
            // let comment = {
            //     message: parsedMessage.parameters,
            //     author: parsedMessage.tags['display-name'],
            //     timestamp: tempTime,
            //     color: parsedMessage.tags.color,
            //     bot: isBot,
            //     command: isCommand,
            // };

            // temporary fix for badges
            data.tags.badges = []

            let commentData = {
                message: data.parameters,
                author: data.tags['display-name'],
                timestamp: new Date().toUTCString(),
                color: data.tags.color,
                bot: data.tags["display-name"] === process.env.TWITCH_CLIENT_USERNAME,
                command: data.parameters.startsWith('!'),
                badges: data.tags.badges
            }

            let sendData = {
                transport: 'twitchmessage',
                data: commentData
            }



            broadcast(JSON.stringify(sendData));
        });

        // Websocket server
        this.wsLogServer = new WebSocketServer({ port: 4444 });

        this.wsLogServer.on('connection', (ws) => {

            ws.on('message', (msg) => {

            });

            ws.on('close', () => {
                // console.log('Client disconnected');
            });

            broadcast = (data) => {
                this.wsLogServer.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(data);
                    }
                });
            };
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


