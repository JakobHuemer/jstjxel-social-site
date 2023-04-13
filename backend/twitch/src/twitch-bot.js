import { EventEmitter } from 'events';
import { SiteSocket } from '../../site-socket.js';
import { Logger } from '../../logger.js';
import { parseMessage } from './irc-message-parser.js';
import { parseNotice } from '../../chat-assets.js';
import axios from 'axios';
import pkg from 'websocket';
import { Ping } from '../../assets.js';

const { client: WebSocketClient } = pkg;

function authenticate(twitchBot) {
    twitchBot.chatSocketConnection.sendUTF('CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership');
    twitchBot.chatSocketConnection.sendUTF(`PASS ${ twitchBot.oauthToken }`);
    twitchBot.chatSocketConnection.sendUTF(`NICK ${ twitchBot.username }`);
}

function ping(conn, printer, interval = 60000, step = 5, name = '') {
    let localCount = 0;
    setInterval(() => {
        conn.sendUTF('PONG :tmi.twitch.tv');
        localCount++;
        if (localCount % step === 0) {
            printer.log('Pinging(' + localCount + '): <' + name + '>', 'ping');
        }
    }, 60000);
}


function extractText(notice) {
    let elements = notice.length;
    let text = '';

    for (let i = 0; i < elements - 1; i++) {
        text += notice[i].text + ' ';
    }
    text += notice[elements - 1].text;

    return text;
}

export class TwitchChatBot extends EventEmitter {
    constructor(client_id, client_secret, oathToken, username, channel) {

        super();
        this.logger = new Logger('TTV-BOT');
        this.clientId = client_id;
        this.clientSecret = client_secret;
        this.username = username;
        this.oauthToken = oathToken;
        this.channel = channel;
        this.chatSocket = new WebSocketClient();

        this.status = false;

        this.messageServer = new SiteSocket('twitch-message');
        this.chatNoticeServer = new SiteSocket('twitch-chat-notice');
    }

    async send(message) {
        // this.chatSocket.send('PRIVMSG #' + this.channel + ' :' + message);
        this.sendTwitchMessage(message);
        this.sendSocketMessage(message);
    }

    async sendTwitchMessage(message) {
        this.chatSocketConnection.sendUTF('PRIVMSG #' + this.channel + ' :' + message);
    }

    async sendSocketMessage(message) {
        let parsedMessage = {
            parameters: message,
            tags: {
                'display-name': this.username,
                color: '#FF0000'
            }
        };

        await this.messageServer.send(parsedMessage);
    }

    sendChatNotice(notice, onlyWebsiteChat = false /*twitch or tiktok*/) {

        // notice data should be: object, where every word has some type of importance which then gets decoded by the frontend with color boldness etc.
        // example: [{ "text": "Hello", "type": "normal" }, { "text": "World", "type": "bold" }]
        let data = {
            comments: notice,
        };

        let plainText = extractText(notice);

        this.chatNoticeServer.send(data);

        if (!onlyWebsiteChat) {
            this.sendTwitchMessage(plainText);
        }

    }

    async connect() {

        this.chatSocket.on('connect', async (conn) => {

            this.status = true;

            this.chatSocketConnection = conn;
            await authenticate(this);
            await this.chatSocketConnection.sendUTF(`JOIN #${ this.channel }`);
            await messageHandler(this);

            this.chatSocketConnection.on('error', (error) => {
                this.logger.error(error, 'connection');
            });

            this.chatSocketConnection.on('close', () => {
                this.logger.warn('Connection closed', 'connection');
            });

            // this.twitchIrcPinger = new Ping(this.chatSocketConnection, 'PONG :tmi.twitch.tv', 'twitch-irc', 60000, 1)
            // this.twitchIrcPinger.ping()

            // ping(this.chatSocketConnection, this.logger, 60000, 1, 'Twitch IRC');
        });

        this.chatSocket.connect('wss://irc-ws.chat.twitch.tv:443', 'irc');

    }

    async disconnect() {
        if (this.status) {
            this.chatSocketConnection.close();
            this.status = false;
        }
    }

    async getBearerToken() {
        const res = await axios.post(
            'https://id.twitch.tv/oauth2/token',
            new URLSearchParams({
                'client_id': this.clientId,
                'client_secret': this.clientSecret,
                'grant_type': 'client_credentials'
            })
        );

        return res.data.access_token;
    }
}

function messageHandler(twitchChatBot) {
    twitchChatBot.chatSocketConnection.on('message', (ircMessage) => {

        // twitchChatBot.logger.log("Message received: " + ircMessage, 'MESSAGE');
        if (ircMessage.type === 'utf8') {

            let rawIrcMessage = ircMessage.utf8Data.trimEnd();

            // console.log(rawIrcMessage);
            // console.log(`Message received (${new Date().toISOString()}): '${rawIrcMessage}'\n`);

            let messages = rawIrcMessage.split('\r\n');  // The IRC message may contain one or more messages.
            messages.forEach(message => {

                let parsedMessage = parseMessage(message, twitchChatBot.logger);

                if (parsedMessage) {

                    // twitchChatBot.logger.debug(JSON.stringify(parsedMessage, null, 2), 'MESSAGE DEBUG');
                    // console.log(parsedMessage);

                    switch (parsedMessage.command.command) {
                        case 'PRIVMSG':
                            // Ignore all messages except the '!move' bot
                            // command. A user can post a !move command to change the
                            // interval for when the bot posts its move message.
                            let commandMessage = parsedMessage.parameters;
                            // twitchChatBot.message(parsedMessage);
                            twitchChatBot.messageServer.send(parsedMessage);

                            twitchChatBot.logger.log('MESSAGE: ' + parsedMessage.parameters, 'MESSAGE');

                            // if (commandMessage.startsWith('!')) {
                            //     //     Command Handler
                            //
                            //     let commandName = parsedMessage.command.botCommand.toLocaleLowerCase();
                            //     let args = 0;
                            //     if (parsedMessage.command.botCommandParams) {
                            //         args = parsedMessage.command.botCommandParams.split(' ').length;
                            //     }
                            //
                            //     if (commands.has(commandName)) {
                            //         let commandObj = commands.get(commandName);
                            //         if (!commandObj.valid_args.includes(args) && !commandObj.valid_args.includes(-1)) {
                            //             commandObj.help(parsedMessage, twitchChatBot);
                            //         } else {
                            //             try {
                            //                 // console.log(`COMMAND (${new Date().toISOString()}):`, commandObj.name.toUpperCase());
                            //                 twitchChatBot.logger.log(`COMMAND:`, commandObj.label.toUpperCase());
                            //                 commandObj.execute(parsedMessage, twitchChatBot);
                            //             } catch (error) {
                            //                 console.log('ERR:', error);
                            //                 // pLog("ERR: " + error, "ERR");
                            //                 // twitchChatBot.webSocketTwitchClientConnection.sendUTF(`@reply-parent-msg=${ parsedMessage.tags.id } PRIVMSG ${ channel } :Ups, something went wrong`);
                            //             }
                            //
                            //         }
                            //     }
                            // }

                            break;
                        case
                        'PING'
                        :
                            twitchChatBot.logger.log('RECEIVING PING FROM TWITCH SERVER', 'PING');
                            twitchChatBot.chatSocketConnection.sendUTF('PONG ' + parsedMessage.parameters);
                            break;
                        case
                        '001'
                        :
                            // Successfully logged in, so join the channel.
                            // webSocketMessageServerConnection.sendUTF("JOIN #" + channel);
                            break;
                        case
                        'JOIN'
                        :
                            // Send the initial move message. All other move messages are
                            // sent by the timer.
                            break;
                        case
                        'PART'
                        :
                            // console.log('The channel must have banned (/ban) the bot.');
                            // pLog('The channel must have banned (/ban) the bot.', 'TWITCH');
                            // console.log(parsedMessage)
                            if (parsedMessage.source.nick === twitchChatBot.username) {
                                twitchChatBot.logger.warn('The channel must have banned (/ban) the bot.', 'TWITCH');
                            }
                            break;
                        case
                        'NOTICE'
                        :
                            // If the authentication failed, leave the channel.
                            // The server will close the webSocketMessageServerConnection.
                            if ('Login authentication failed' === parsedMessage.parameters) {
                                // console.log(`Authentication failed; left ${channel}`);
                                twitchChatBot.logger.log(`Authentication failed; left ${ channel }`, 'TWITCH');
                                twitchChatBot.chatSocket(`PART ${ channel }`);
                            } else if ('You don’t have permission to perform that action' === parsedMessage.parameters) {
                                // console.log(`No permission. Check if the access token is still valid. Left ${channel}`);
                                twitchChatBot.logger.warn(`No permission. Check if the access token is still valid. Left ${ channel }`, 'TWITCH');
                                twitchChatBot.send(`PART ${ channel }`);
                            }
                            break;
                        default:
                        // Ignore all other IRC messages.
                    }
                }
            });
        }
    });
}