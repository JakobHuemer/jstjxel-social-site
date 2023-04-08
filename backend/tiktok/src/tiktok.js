import { WebcastPushConnection } from 'tiktok-live-connector';
import { Logger } from '../../logger.js';
import { SiteSocket } from '../../site-socket.js';

export class TikTokChatBot {
    constructor(ttUsername) {

        this.ttMessageServer = new SiteSocket("tiktok-event")

        this.tiktokUsername = ttUsername;

        this.options = {
            enableExtendedGiftInfo: true,
            fetchRoomInfoOnConnect: false,
        }

        this.ttLiveConn = new WebcastPushConnection(this.tiktokUsername);

        this.ttLogger = new Logger("TIKTOK");
    }

    connect() {
        this.ttLiveConn.connect().then((state) => {
            state = this.ttLiveConn.getState();
            this.ttLogger.logInf(`Connected to roomId ${state.roomId}`, "connection");
        }).catch((err) => {
            this.ttLogger.logErr('Failed to connect', "connection");
        })

        this.ttLiveConn.on("disconnected", (data) => {
            this.ttLogger.logWrn("Disconnected", "connection");
        })

        this.ttLiveConn.on("streamEnd", (actionId) => {
            switch (actionId) {
                case 3:
                    this.ttLogger.logInf("Stream ended", "stream");
                    break;
                case 4:
                    this.ttLogger.logInf("Stream ended by platform moderator (ban)", "stream");
                    break;
                default:
                    this.ttLogger.logInf('Stream ended by unknown reason', 'stream');
                    break;
            }
        })

        this.ttLiveConn.on("chat", (data) => {
            console.log("TTDATA:", data)
        })

        this.ttLiveConn.on("error", (err) => {
            console.error("TTERROR:", err);
        })

        this.ttLiveConn.on("member", (data) => {
            console.log("TTMEMBERDATA:", data);
        })

        this.ttLiveConn.on("gift", (data) => {
            console.log("TTGIFT:", data);
        })
    }
}
