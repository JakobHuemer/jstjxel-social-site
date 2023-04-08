import { Logger } from '../../logger.js';
import pkg from 'websocket';
import axios from 'axios';
import { SiteSocket } from '../../site-socket.js';

const { client: WebSocketClient } = pkg;

async function requestHooks(twitchEventSub) {
    let userId = await twitchEventSub.getUserId(twitchEventSub.ttvUserName);
    let sessionId = twitchEventSub.sessionId;

    let subscriptions = [
        {
            type: 'channel.follow',
            version: 2,
            condition: {
                broadcaster_user_id: userId,
                moderator_user_id: userId
            },
        },
        {
            type: 'stream.online',
            version: 1,
            condition: {
                broadcaster_user_id: userId,
            },
        },
        {
            type: 'stream.offline',
            version: 1,
            condition: {
                broadcaster_user_id: userId,
            },
        },
        {
            type: 'channel.subscribe',
            version: 1,
            condition: {
                broadcaster_user_id: userId,
            }
        },
        {
            type: 'channel.subscription.end',
            version: 1,
            condition: {
                broadcaster_user_id: userId,
            }
        },
        {
            type: 'channel.subscription.gift',
            version: 1,
            condition: {
                broadcaster_user_id: userId,
            }
        },
        {
            type: 'channel.subscription.message',
            version: 1,
            condition: {
                broadcaster_user_id: userId,
            }
        },
        {
            type: 'channel.cheer',
            version: 1,
            condition: {
                broadcaster_user_id: userId,
            }
        },
    ];


    twitchEventSub.eventLogger.logInf(`Beginning now to request ${ subscriptions.length } event hooks . . .`, 'subscription');
    for (let sub of subscriptions) {


        let subscribed = true;


        let { type, version, condition } = sub;

        twitchEventSub.eventLogger.log(`Requesting ${ type }(${ version }) event . . .`, 'subscription');

        let response = await axios.post('https://api.twitch.tv/helix/eventsub/subscriptions', {
                'type': type,
                'version': version,
                'condition': condition,
                'transport': {
                    'method': 'websocket',
                    'session_id': twitchEventSub.sessionId,
                }
            },
            {
                headers: {
                    'Authorization': 'Bearer ' + twitchEventSub.userAccessToken,
                    'Client-Id': twitchEventSub.clientId,
                    'Content-Type': 'application/json'
                }
            }).catch((error) => {
            twitchEventSub.eventLogger.logErr(' ----- X Failed to subscribe to ' + type + ' (' + version + ')', 'subscription');
            subscribed = false;
            // throw error;
        }).then((response) => {
            if (subscribed) {
                twitchEventSub.eventLogger.log('✔ Subscribed to ' + type + ' (' + version + ')', 'subscription');
            }
        });
    }

    twitchEventSub.eventLogger.logInf(`Finished requesting ${ subscriptions.length } event hooks . . .`, 'subscription');
}

export class TwitchEventSub {

    constructor(ttvUserName, clientId, clientSecret, userAccessToken) {

        this.userAccessToken = userAccessToken;
        this.eventLogger = new Logger('TTV-EVENT');
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.ttvUserName = ttvUserName;
        this.keepAliveCount = 0;

        this.eventSerer = new SiteSocket("twitch-event")

        this.eventSocket = new WebSocketClient();
    }

    listen() {

        this.eventSocket.on('connect', async (conn) => {

            this.eventSocketConnection = conn;


            conn.on('error', (error) => {
                this.eventLogger.logErr(error, 'connection');
            });

            conn.on('close', () => {
                this.eventLogger.logWrn('Connection closed', 'connection');
            });

            conn.on('message', (msg) => {

                switch (JSON.parse(msg.utf8Data).metadata.message_type) {
                    case 'session_welcome':
                        this.eventLogger.logInf("Session welocme", 'connection');
                        this.sessionId = JSON.parse(msg.utf8Data).payload.session.id;
                        requestHooks(this);
                        break;
                    case 'notification':
                        this.eventLogger.logInf(JSON.parse(msg.utf8Data).payload, 'notify');
                        break;
                    case 'session_keepalive':
                        this.keepAliveCount++;
                        if (this.keepAliveCount % 12 === 0) {
                            this.eventLogger.log('Keepalive #' + this.keepAliveCount, 'keepalive');
                        }
                        break;
                    case 'session_reconnect':
                        this.eventLogger.logWrn('Reconnecting', 'connection');
                        this.eventSocket.close();
                        this.eventSocket.connect('wss://eventsub-beta.wss.twitch.tv/ws');
                        break;
                    case 'revocation':
                        this.eventLogger.logWrn('Revoked', 'revoke');
                        break;
                    default:
                        this.eventLogger.logWrn('Unknown message type', 'subscription');
                        break;
                }

            });

        });

        this.eventSocket.connect('wss://eventsub-beta.wss.twitch.tv/ws');

    }

    async getBearerToken() {
        const res = await axios.post(
            'https://id.twitch.tv/oauth2/token',
            new URLSearchParams({
                'client_id': this.clientId,
                'client_secret': this.clientSecret,
                'grant_type': 'client_credentials'
            })
        ).catch((error) => {
            this.eventLogger.logErr(error, 'Bearer');
        });

        return res.data.access_token;
    }

    async getUserId(username) {
        const response = await axios.get('https://api.twitch.tv/helix/users', {
            params: {
                'login': username
            }, headers: {
                'Authorization': 'Bearer ' + await this.getBearerToken(),
                'Client-Id': this.clientId,
                'Content-Type': 'application/json',
            }
        });

        return response.data.data[0].id;
    }
}
