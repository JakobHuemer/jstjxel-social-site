
import tmi from 'tmi.js';

export class TmiHandler {
    constructor(token, username, channel) {
        this.token = token;
        this.username = username;
        this.channel = channel;

        this.client = new tmi.client({
            identity: {
                username: this.username,
                password: this.token
            },
            channels: [this.channel]
        })

        this.client.connect().catch((err) => {
            console.log(err)
        });

        this.connected = false;

        this.client.on('connected', () => {
            this.connected = true;
        });

        this.client.on('disconnected', () => {
            this.connected = false;
        });
    }

    async send(msg) {
        let count = 0;
        do {
            count++;
            await this.client.say(this.channel, msg).catch(() => {
            }).then(() => {
                return true;
            });
            await new Promise(r => setTimeout(r, 500));
            if (count >= 10) {
                return;
            }
        } while (!this.connected)
    }
}

