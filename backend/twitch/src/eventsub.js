import { Logger } from '../../logger.js';
import pkg from 'websocket';
import axios from 'axios';
import { SiteSocket } from '../../site-socket.js';
import { twitchChatBot } from '../../server.js';

const { client: WebSocketClient } = pkg;

async function requestHooks(twitchEventSub) {
    let userId = await twitchEventSub.getUserId(twitchEventSub.ttvUserName);
    let sessionId = twitchEventSub.sessionId;

    // ALL HOOKS:
    /*
    *
    * channel.follow
    * channel.subscribe
    * channel.subscription.end
    * channel.subscription.gift
    * channel.subscription.message
    * channel.cheer
    * channel.raid
    * channel.ban
    * channel.unban
    * channel.poll.begin
    * channel.poll.progress
    * channel.poll.end
    * channel.prediction.begin
    * channel.prediction.progress
    * channel.prediction.lock
    * channel.prediction.end
    * channel.hype_train.begin
    * channel.hype_train.progress
    * channel.hype_train.end
    * channel.shoutout.create
    *
    *
    * */

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
        {
            type: 'channel.raid',
            version: 1,
            condition: {
                to_broadcaster_user_id: userId,
            }
        },
        // {
        //     type: 'channel.ban',
        //     version: 1,
        //     condition: {
        //         broadcaster_user_id: userId,
        //     }
        // },
        // {
        //     type: 'channel.unban',
        //     version: 1,
        //     condition: {
        //         broadcaster_user_id: userId,
        //     }
        // },
        {
            type: 'channel.poll.begin',
            version: 1,
            condition: {
                broadcaster_user_id: userId,
            }
        },
        {
            type: 'channel.poll.progress',
            version: 1,
            condition: {
                broadcaster_user_id: userId,
            }
        },
        {
            type: 'channel.poll.end',
            version: 1,
            condition: {
                broadcaster_user_id: userId,
            }
        },
        {
            type: 'channel.prediction.begin',
            version: 1,
            condition: {
                broadcaster_user_id: userId,
            }
        },
        {
            type: 'channel.prediction.progress',
            version: 1,
            condition: {
                broadcaster_user_id: userId,
            }
        },
        {
            type: 'channel.prediction.lock',
            version: 1,
            condition: {
                broadcaster_user_id: userId,
            }
        },
        {
            type: 'channel.prediction.end',
            version: 1,
            condition: {
                broadcaster_user_id: userId,
            }
        },
        {
            type: 'channel.hype_train.begin',
            version: 1,
            condition: {
                broadcaster_user_id: userId,
            }
        },
        {
            type: 'channel.hype_train.progress',
            version: 1,
            condition: {
                broadcaster_user_id: userId,
            }
        },
        {
            type: 'channel.hype_train.end',
            version: 1,
            condition: {
                broadcaster_user_id: userId,
            }
        },
        {
            type: 'channel.shoutout.create',
            version: 1,
            condition: {
                broadcaster_user_id: userId,
                moderator_user_id: userId
            }
        },
        {
            type: 'channel.shoutout.receive',
            version: 1,
            condition: {
                broadcaster_user_id: userId,
                moderator_user_id: userId
            }
        }
    ];


    twitchEventSub.eventLogger.info(`Beginning now to request ${ subscriptions.length } event hooks . . .`, 'subscription');
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
            twitchEventSub.eventLogger.error(' ----- X Failed to subscribe to ' + type + ' (' + version + ')', 'subscription');
            subscribed = false;
            // throw error;
        }).then((response) => {
            if (subscribed) {
                twitchEventSub.eventLogger.log('✔ Subscribed to ' + type + ' (' + version + ')', 'subscription');
            }
        });
    }

    twitchEventSub.eventLogger.info(`Finished requesting ${ subscriptions.length } event hooks . . .`, 'subscription');
}

export class TwitchEventSub {

    constructor(ttvUserName, clientId, clientSecret, userAccessToken) {

        this.userAccessToken = userAccessToken;
        this.eventLogger = new Logger('TTV-EVENT');
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.ttvUserName = ttvUserName;
        this.keepAliveCount = 0;

        this.eventSerer = new SiteSocket('twitch-event');

        this.eventSocket = new WebSocketClient();
    }

    listen() {

        this.eventSocket.on('connect', async (conn) => {

            this.eventSocketConnection = conn;


            conn.on('error', (error) => {
                this.eventLogger.error(error, 'connection');
            });

            conn.on('close', () => {
                this.eventLogger.warn('Connection closed', 'connection');
            });

            conn.on('message', (msg) => {

                switch (JSON.parse(msg.utf8Data).metadata.message_type) {
                    case 'session_welcome':
                        this.eventLogger.info('Session welocme', 'connection');
                        this.sessionId = JSON.parse(msg.utf8Data).payload.session.id;
                        requestHooks(this);
                        break;
                    case 'notification':
                        // this.eventLogger.debug(JSON.stringify(JSON.parse(msg.utf8Data), null, 4), 'notify');
                        // this.eventLogger.info(JSON.parse(msg.utf8Data).payload, 'notify');
                        this.eventHandler(JSON.parse(msg.utf8Data).payload);
                        break;
                    case 'session_keepalive':
                        this.keepAliveCount++;
                        if (this.keepAliveCount % 1440 === 0) {
                            this.eventLogger.log('Keepalive #' + this.keepAliveCount / 1440, 'keepalive');
                        }
                        break;
                    case 'session_reconnect':
                        this.eventLogger.warn('Reconnecting', 'connection');
                        this.eventSocketConnection.close();
                        this.eventSocket.connect('wss://eventsub-beta.wss.twitch.tv/ws');
                        break;
                    case 'revocation':
                        this.eventLogger.warn('Revoked', 'revoke');
                        break;
                    default:
                        this.eventLogger.warn('Unknown message type', 'subscription');
                        break;
                }

            });

        });

        // BETA
        // this.eventSocket.connect('wss://eventsub-beta.wss.twitch.tv/ws');

        // LIVE
        this.eventSocket.connect('wss://eventsub.wss.twitch.tv/ws');

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
            this.eventLogger.error(error, 'Bearer');
        });

        console.log(res.data);

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

    eventHandler(payload) {
        switch (payload.subscription.type) {
            case 'channel.follow':
                let follower = payload.event.user_name;
                let followerNotice = [
                    { text: follower, bold: true, underlined: false, color: '#6441a5' },
                    { text: 'folgt', bold: false, underlined: false, color: '#FFFFFF' },
                    { text: 'rein', bold: false, underlined: false, color: '#FFFFFF' },
                    { text: 'da!', bold: false, underlined: false, color: '#FFFFFF' }
                ]

                twitchChatBot.sendChatNotice(followerNotice);
                break;
            case 'channel.cheer':

                let cheerIsAnonymous = payload.event.is_anonymous;
                let cheerAmount = payload.event.bits;
                let cheerMessage = payload.event.message;

                let cheerNotice = [
                    { text: "jemand", bold: true, underlined: false, color: '#6441a5' },
                    { text: 'hat', bold: false, underlined: false, color: '#FFFFFF' },
                    { text: cheerAmount, bold: true, underlined: false, color: '#FFFFFF' },
                    { text: 'bits', bold: false, underlined: false, color: '#FFFFFF' },
                    {
                        text: 'dagelassen:',
                        bold: false,
                        underlined: false,
                        color: '#FFFFFF'
                    },
                    { text: cheerMessage, bold: false, underlined: false, color: '#FFFFFF' }
                ]

                if (!cheerIsAnonymous) {
                    cheerNotice[0].text = payload.event.user_name;
                }

                twitchChatBot.sendChatNotice(cheerNotice);

                break;
            case 'channel.subscribe':
                let subTier = payload.event.tier / 1000;
                let user = payload.event.user_name;
                // %user lässt auf ehre einen tier 1/2/3 sub da!
                let subNotice = [
                    { text: user, bold: true, underlined: false, color: '#6441a5' },
                    { text: 'lässt', bold: false, underlined: false, color: '#FFFFFF' },
                    { text: 'einen', bold: false, underlined: false, color: '#FFFFFF' },
                    { text: 'tier', bold: false, underlined: false, color: '#FFFFFF' },
                    { text: subTier, bold: true, underlined: false, color: '#FFFFFF' },
                    { text: 'sub', bold: true, underlined: false, color: '#FFFFFF' },
                    { text: 'da!', bold: false, underlined: false, color: '#FFFFFF' }
                ]

                twitchChatBot.sendChatNotice(subNotice);
                break;
            case 'channel.subscription.end':
                break;
            case 'channel.subscription.gift':
                let isAnonymous = payload.event.is_anonymous;
                let subAmount = payload.event.total;
                let giftTier = payload.event.tier / 1000;

                if (isAnonymous) {
                    let anonGifterNotice = [
                        { text: "jemand", bold: true, underlined: false, color: '#6441a5' },
                        { text: 'giftet', bold: false, underlined: false, color: '#FFFFFF' },
                        { text: subAmount, bold: false, underlined: false, color: '#6441a5' },
                        { text: 'tier', bold: true, underlined: false, color: '#FFFFFF' },
                        { text: giftTier, bold: true, underlined: false, color: '#FFFFFF' },
                        { text: 'subs!', bold: false, underlined: false, color: '#FFFFFF' }
                    ]

                    twitchChatBot.sendChatNotice(anonGifterNotice);
                } else {
                    let gifter = payload.event.gifter_name;

                    let gifterNotice = [
                        { text: gifter, bold: true, underlined: false, color: '#6441a5' },
                        { text: 'giftet', bold: false, underlined: false, color: '#FFFFFF' },
                        { text: subAmount, bold: false, underlined: false, color: '#6441a5' },
                        { text: 'tier', bold: true, underlined: false, color: '#FFFFFF' },
                        { text: giftTier, bold: true, underlined: false, color: '#FFFFFF' },
                        { text: 'subs!', bold: false, underlined: false, color: '#FFFFFF' }
                    ]


                    twitchChatBot.sendChatNotice(gifterNotice);
                }

                break;
            case 'channel.subscription.message':
                let subMessage = payload.event.message;
                let subMessageUser = payload.event.user_name;
                let streakMonths = payload.event.streak_months;
                let subMessageTier = payload.event.tier / 1000;

                let subMessageNotice = [
                    { text: subMessageUser, bold: true, underlined: false, color: '#6441a5' },
                    { text: 'dropped', bold: false, underlined: false, color: '#FFFFFF' },
                    { text: 'einen', bold: false, underlined: false, color: '#FFFFFF' },
                    { text: 'tier', bold: true, underlined: false, color: '#FFFFFF' },
                    { text: subMessageTier, bold: true, underlined: false, color: '#FFFFFF' },
                    { text: 'sub', bold: true, underlined: false, color: '#FFFFFF' },
                    { text: 'mit', bold: false, underlined: false, color: '#FFFFFF' },
                    { text: 'einer', bold: false, underlined: false, color: '#FFFFFF' },
                    { text: 'Streak', bold: false, underlined: false, color: '#FFFFFF' },
                    { text: 'von', bold: false, underlined: false, color: '#FFFFFF' },
                    { text: streakMonths, bold: false, underlined: false, color: '#6441a5' },
                    { text: 'Monaten:', bold: true, underlined: false, color: '#FFFFFF' },
                    {
                        text: subMessage,
                        bold: false,
                        underlined: false,
                        color: '#FFFFFF'
                    }
                ]


                twitchChatBot.sendChatNotice(subMessageNotice, true);

                break;
            case 'stream.online':
                if (twitchChatBot.chatSocketConnection) {
                    twitchChatBot.logger.info("Rejoining chat channel after stream went offline", "chat")
                    twitchChatBot.chatSocketConnection.sendUTF("JOIN #" + twitchChatBot.channel)
                }

                setTimeout(() => {

                    let onlineNotice = [
                        { text: 'Stream', bold: true, underlined: false, color: '#6441a5' },
                        { text: 'online!', bold: true, underlined: false, color: '#6441a5' }
                    ]

                    twitchChatBot.sendChatNotice(onlineNotice, true);
                }, 10000);
                break;
            case 'stream.offline':
                if (twitchChatBot.chatSocketConnection) {
                    twitchChatBot.logger.info("Parting chat channel after stream went offline", "chat")
                    twitchChatBot.chatSocketConnection.sendUTF("PART #" + twitchChatBot.channel)
                }

                let offlineNotice = [
                    { text: 'Stream', bold: true, underlined: false, color: '#6441a5' },
                    { text: 'offline!', bold: true, underlined: false, color: '#6441a5' }
                ]

                twitchChatBot.sendChatNotice(offlineNotice, true);
                break;
            default:
                this.eventLogger.warn('Unknown event type of: ' + payload.subscription.type, 'subscription');

        }

        // {
        //     "metadata": {
        //         "message_id": "JioOe4wWrlnBVQRMRlaP9q5s1ALDBWHAMsHCUaOB5Qc=",
        //             "message_type": "notification",
        //             "message_timestamp": "2023-04-10T18:37:07.690621899Z",
        //             "subscription_type": "channel.follow",
        //             "subscription_version": "2"
        //     },
        //     "payload": {
        //         "subscription": {
        //             "id": "248f09f9-4beb-45f5-bc0c-297f8df5e60a",
        //                 "status": "enabled",
        //                 "type": "channel.follow",
        //                 "version": "2",
        //                 "condition": {
        //                 "broadcaster_user_id": "213747560",
        //                     "moderator_user_id": "213747560"
        //             },
        //             "transport": {
        //                 "method": "websocket",
        //                     "session_id": "AgoQD__oBaRISpO0kdqqcAYHUxIVY2VsbC1wbGFjZWhvbGRlci1wcm9k"
        //             },
        //             "created_at": "2023-04-10T18:36:58.214398583Z",
        //                 "cost": 0
        //         },
        //         "event": {
        //             "user_id": "565791787",
        //                 "user_login": "jakkki_",
        //                 "user_name": "jakkki_",
        //                 "broadcaster_user_id": "213747560",
        //                 "broadcaster_user_login": "jstjxel",
        //                 "broadcaster_user_name": "jstjxel",
        //                 "followed_at": "2023-04-10T18:37:07.690612652Z"
        //         }
        //     }
        // }

    }
}
