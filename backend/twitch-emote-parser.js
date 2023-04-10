class TwitchEmoteParser {
    constructor(clientId, clientSecret, assetChannels = ["jstjxel"]) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;

        this.emoteTemplate = '';
        this.gloablEmotes = [];

        this.fetchGlobalEmotes().then(([data, template]) => {
            this.emoteTemplate = template;
            this.globalEmotes = data;
        });

        this.channelEmotes = []

        assetChannels.forEach((channel) => {
            this.fetchChannelEmotes(channel).then((data) => {
                this.channelEmotes.push(data);
            });
        });
    }

    async getOAuthToken() {
        // using fetch() to get token
        let req = await fetch('https://id.twitch.tv/oauth2/token?client_id=' + this.clientId + '&client_secret=' + this.clientSecret + '&grant_type=client_credentials', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        }).then((res) => {
            return res.json().access_token;
        }).catch((err) => {
            console.log(err);
        });
    }

    async fetchGlobalEmotes() {
        // using fetch() to get global emotes
        let req = await fetch('https://api.twitch.tv/helix/chat/emotes/global', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + await this.getOAuthToken(),
                'Client-Id': this.clientId,
            },
        }).then((res) => {
            return [res.json().data, res.json().template];
        }).catch((err) => {
            console.log(err);
        });
    }

    parse(message) {
        let data = {
            message,
            emotes: {
                // "text": "https://static-cdn.jtvnw.net/emoticons/v1/420/1.0",
            }
        }

        let messageArray = message.split(' ');
        messageArray.forEach((word) => {
            if (this.checkEmote(word)) {
                data.emotes[word] = this.emoteTemplate.replace('{id}', word);
            }
        });
    }

    checkEmote(word) {

        return false
    }
}