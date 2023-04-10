import { WebcastPushConnection } from 'tiktok-live-connector';
import { Logger } from '../../logger.js';
import { SiteSocket } from '../../site-socket.js';

export class TikTokChatBot {
    constructor(ttUsername, sessionId) {

        this.ttMessageServer = new SiteSocket('tiktok-event');


        this.sessionId = sessionId;
        this.tiktokUsername = ttUsername;

        this.options = {
            enableExtendedGiftInfo: true,
            fetchRoomInfoOnConnect: false,
            sessionId: this.sessionId
        };

        this.ttLiveConn = new WebcastPushConnection(this.tiktokUsername, this.options);

        this.ttLogger = new Logger('TIKTOK');
    }

    connect() {
        this.ttLiveConn.connect().then((state) => {
            state = this.ttLiveConn.getState();
            this.ttLogger.logInf(`Connected to roomId ${ state.roomId }`, 'connection');
        }).catch((err) => {
            this.ttLogger.logErr('Failed to connect', 'connection');
        });

        this.ttLiveConn.on('disconnected', (data) => {
            this.ttLogger.logWrn('Disconnected', 'connection');
        });


        /*
        * Events:
        *
        * - member
        *   - nickname: string
        *   - uniqueId: string
        *   - profilePictureUrl: string
        *   - label: string // "{0:user} joined"
        *
        * - chat
        *   - comment: string
        *   - nickname: string
        *   - uniqueId: string
        *   - profilePictureUrl: string
        *   - followRole: integer // 0 = none; 1 = follower; 2 = friends /// MOST LIKELY NOT FROM THE STREAMER POSITION BUT THE SESSION ID POSITION
        *   - isModerator: bool
        *   - isSubscriber: bool
        *
        * - gift
        *   - extendedGiftInfo to print because i don't know yet what is in there
        *   - repeatCount: integer
        *   - nickname: string
        *   - uniqueId: string
        *   - profilePictureUrl: string
        *   - followRole: integer // 0 = none; 1 = follower; 2 = friends
        *   - isNewGifter: bool
        *   - displayType: string
        *   - describe: string
        *   - giftType: string
        *   - diamondCount: integer
        *   - giftName: string
        *   - giftPictureUrl: string
        *
        * - roomUser
        *   - viewerCount: integer
        *   - topViewers
        *       for each
        *       - uniqueId: string
        *       - nickname: string
        *       - profilePictureUrl: string
        *       - followRole: integer // 0 = none; 1 = follower; 2 = friends
        *       - isModerator: bool
        *       - isNewGifter: bool
        *       - isSubscriber: bool
        *       - coinCount: integer
        *
        * - like
        *   - likeCount: integer
        *   - totalLikeCount: integer
        *   - uniqueId: string
        *   - nickname: string
        *   - profilePictureUrl: string
        *   - followRole: integer // 0 = none; 1 = follower; 2 = friends
        *   - isModerator: bool
        *   - isSubscriber: bool
        *   - displayType: string
        *   - label: string // "{0:user} liked the LIVE"
        *
        *
        * - follow
        *   - uniqueId: string
        *   - nickname: string
        *   - profilePictureUrl: string
        *   - followRole: integer // 0 = none; 1 = follower; 2 = friends
        *   - displayType: string
        *   - label: string // "{0:user} followed the host" maybe replace " the host" with "" or replace the whole thing or not use it at all
        *
        * - envelope
        *   - uniqueId: string
        *   - nickname: string
        *   - profilePictureUrl: string
        *   - followRole: integer // 0 = none; 1 = follower; 2 = friends
        *   - isModerator: bool
        *   - isSubscriber: bool
        *   - coins: integer
        *   - canOpen: integer
        *
        * - questionNew
        *   - questionText: string
        *   - uniqueId: string
        *   - nickname: string
        *   - profilePictureUrl: string
        *   - followRole: integer // 0 = none; 1 = follower; 2 = friends
        *   - isModerator: bool
        *   - isSubscriber: bool
        *
        * - liveIntro
        *   - description: string
        *   - uniqueId: string
        *   - nickname: string
        *   - profilePictureUrl: string
        *   - followerCount
        *
        * - subscribe
        *   - subMonth: integer
        *   - oldSubscribeStatus: integer
        *   - subscribingStatus: integer
        *   - uniqueId: string
        *   - nickname: string
        *   - profilePictureUrl: string
        *   - displayType: string
        *   - label:string // "{0:user} just subscribed to the host" // again change the host or not use it at all
        *
        * */

        this.ttLiveConn.on('streamEnd', (actionId) => {
            switch (actionId) {
                case 3:
                    this.ttLogger.logInf('Stream ended', 'stream');
                    break;
                case 4:
                    this.ttLogger.logInf('Stream ended by platform moderator (ban)', 'stream');
                    break;
                default:
                    this.ttLogger.logInf('Stream ended by unknown reason', 'stream');
                    break;
            }
        });

        // setInterval(() => {
        //     let data = {
        //         comment: "halli hallo ich bin eins wurst",
        //         nickname: "eins Baum",
        //         uniqueId: "einsBaum",
        //         profilePictureUrl: "https://cdn.drawception.com/images/avatars/647493-B9E.png",
        //         followRole: 0,
        //         isModerator: false,
        //         isSubscriber: false,
        //     };
        //     this.eventHandler("chat", data)
        // }, 10000);

        this.ttLiveConn.on('member', (data) => {
            this.eventHandler('member', data);
        });

        this.ttLiveConn.on('chat', (data) => {
            this.eventHandler('chat', data);
        });

        this.ttLiveConn.on('gift', (data) => {
            this.eventHandler('gift', data);
        });

        this.ttLiveConn.on('roomUser', (data) => {
            this.eventHandler('roomUser', data);
        });

        this.ttLiveConn.on('like', (data) => {
            this.eventHandler('like', data);
        });

        this.ttLiveConn.on('follow', (data) => {
            this.eventHandler('follow', data);
        });

        this.ttLiveConn.on('envelope', (data) => {
            this.eventHandler('envelope', data);
        });

        this.ttLiveConn.on('questionNew', (data) => {
            this.eventHandler('questionNew', data);
        });

        this.ttLiveConn.on('liveIntro', (data) => {
            this.eventHandler('liveIntro', data);
        });

        this.ttLiveConn.on('subscribe', (data) => {
            this.eventHandler('subscribe', data);
        });

        this.ttLiveConn.on('error', (err) => {
            this.ttLogger.logErr(err, 'stream');
        });

        this.ttLiveConn.on('connected', () => {
            this.ttLogger.logInf('Connected to stream', 'stream');
        });

        this.ttLiveConn.on('disconnected', () => {
            this.ttLogger.logInf('Disconnected from stream', 'stream');
        });

        this.ttLiveConn.on('rawData', (messageTypeName, binary) => {
            console.log("THIS IS THE rawData EVEnt from TIKTOK LIVE CONNECTION:", messageTypeName, binary);
        })
    }


    eventHandler(eventType, data) {
        console.log('THIS IS THE EVENT HANDLER', eventType, data);

        // let dataStructure = {
        //     eventType: "chat",
        //     eventData : {
        //         ...
        //     }
        // }


        let serverData = {
            eventType: eventType,
        };

        let eventData;

        switch (eventType) {
            case 'chat':
                eventData = {
                    comment: data.comment,
                    nickname: data.nickname,
                    uniqueId: data.uniqueId,
                    profilePictureUrl: data.profilePictureUrl,
                    followRole: data.followRole,
                    isModerator: data.isModerator,
                    isSubscriber: data.isSubscriber,
                };
                break;
            case 'member':
                eventData = {
                    nickname: data.nickname,
                    uniqueId: data.uniqueId,
                    profilePictureUrl: data.profilePictureUrl,
                    label: data.label,
                };
                break;
            case 'gift':
                eventData = {
                    extendedGiftInfo: data.extendedGiftInfo,
                    repeatCount: data.repeatCount,
                    nickname: data.nickname,
                    uniqueId: data.uniqueId,
                    profilePictureUrl: data.profilePictureUrl,
                    followRole: data.followRole,
                    isNewGifter: data.isNewGifter,
                    displayType: data.displayType,
                    describe: data.describe,
                    giftType: data.giftType,
                    diamondCount: data.diamondCount,
                    giftName: data.giftName,
                    giftPictureUrl: data.giftPictureUrl,
                };
                break;
            case 'roomUser':

                let newTopViewers = [];
                for (let i = 0; i < data.topViewers.length; i++) {
                    newTopViewers.push({
                        uniqueId: data.topViewers[i].uniqueId,
                        nickname: data.topViewers[i].nickname,
                        profilePictureUrl: data.topViewers[i].profilePictureUrl,
                        followRole: data.topViewers[i].followRole,
                        isModerator: data.topViewers[i].isModerator,
                        isNewGifter: data.topViewers[i].isNewGifter,
                        isSubscriber: data.topViewers[i].isSubscriber,
                        coinCount: data.topViewers[i].coinCount,
                    });
                }

                eventData = {
                    viewerCount: data.viewerCount,
                    topViewers: newTopViewers,
                };

                break;
            case 'like':
                eventData = {
                    likeCount: data.likeCount,
                    totalLikeCount: data.totalLikeCount,
                    uniqueId: data.uniqueId,
                    nickname: data.nickname,
                    profilePictureUrl: data.profilePictureUrl,
                    followRole: data.followRole,
                    isModerator: data.isModerator,
                    isSubscriber: data.isSubscriber,
                    displayType: data.displayType,
                    label: data.label,
                };
                break;
            case 'follow':
                eventData = {
                    uniqueId: data.uniqueId,
                    nickname: data.nickname,
                    profilePictureUrl: data.profilePictureUrl,
                    followRole: data.followRole,
                    displayType: data.displayType,
                    label: data.label,
                };
                break;
            case 'envelope':
                eventData = {
                    uniqueId: data.uniqueId,
                    nickname: data.nickname,
                    profilePictureUrl: data.profilePictureUrl,
                    followRole: data.followRole,
                    isModerator: data.isModerator,
                    isSubscriber: data.isSubscriber,
                    coins: data.coins,
                    canOpen: data.canOpen,
                };
                break;
            case 'questionNew':
                eventData = {
                    questionText: data.questionText,
                    uniqueId: data.uniqueId,
                    nickname: data.nickname,
                    profilePictureUrl: data.profilePictureUrl,
                    followRole: data.followRole,
                    isModerator: data.isModerator,
                    isSubscriber: data.isSubscriber,

                };
                break;
            case 'liveIntro':
                eventData = {
                    description: data.description,
                    uniqueId: data.uniqueId,
                    nickname: data.nickname,
                    profilePictureUrl: data.profilePictureUrl,
                    followerCount: data.followerCount,
                };
                break;
            case 'subscribe':
                eventData = {
                    subMonth: data.subMonth,
                    oldSubscribeStatus: data.oldSubscribeStatus,
                    subscribingStatus: data.subscribingStatus,
                    uniqueId: data.uniqueId,
                    nickname: data.nickname,
                    profilePictureUrl: data.profilePictureUrl,
                    displayType: data.displayType,
                    label: data.label,
                };
                break;
            default:
                eventData = data;
                break;
        }

        serverData.eventData = eventData;

        this.ttMessageServer.send(serverData);

    }
}
