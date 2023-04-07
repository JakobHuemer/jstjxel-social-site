// import "./logger.js"
import { Logger } from './logger.js';
import http from 'http';
import fs from 'fs';
// import express from 'express';
import { config } from 'dotenv';

config();

import express from 'express';

const webApp = express();
const webPort = 80;

const webAppOptions = {
    key: fs.readFileSync('./backend/ssl/jstjxel.de_private_key.key'),
    cert: fs.readFileSync('./backend/ssl/jstjxel.de_ssl_certificate.cer'),
}

const httpLogger = new Logger('HTTP');

webApp.use(express.static('./frontend/dist'));


console.log(fs.readdirSync('./frontend/dist'));

// webApp.listen(webPort, () => {
//     httpLogger.log(`Webserver listening on port ${ webPort }`, 'web server');
// });

http.createServer(webAppOptions, webApp).listen(webPort, () => {
    httpLogger.log(`Webserver listening on port ${ webPort }`, 'web server');
});

// TWITCH CHAT BOT -------------------------------------------------------------------------

import { TwitchChatBot } from './twitch/src/twitch-bot.js';

const twitchChatBot = new TwitchChatBot(process.env.TWITCH_CLIENT_ID, process.env.TWITCH_CLIENT_SECRET, process.env.TWITCH_CLIENT_OAUTH_TOKEN, process.env.TWITCH_CLIENT_USERNAME, "jstjxel");

twitchChatBot.listen();