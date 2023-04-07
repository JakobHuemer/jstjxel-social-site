// import "./logger.js"
import { Logger } from './logger.js';
// import express from 'express';
import { config } from 'dotenv';

config();



console.log(fs.readdirSync('./backend/ssl'));
const httpLogger = new Logger('HTTP');

// WEB SERVER -------------------------------------------------------------------------
import https from 'https';
import fs from 'fs';
import express from 'express';
const webApp = express();
const webPort = 443;
const webAppOptions = {
    key: fs.readFileSync('./backend/ssl/jstjxel.de_private_key.key'),
    cert: fs.readFileSync('./backend/ssl/jstjxel.de_ssl_certificate.cer'),
    ca: fs.readFileSync("./backend/ssl/jstjxel.de_ssl_certificate_INTERMEDIATE.cer")
}


webApp.use(express.static('./frontend/dist'));

https.createServer(webAppOptions, webApp).listen(webPort, '127.0.0.1', () => {
    httpLogger.log(`Webserver listening on port ${ webPort }`, 'web server');
});

// TWITCH CHAT BOT -------------------------------------------------------------------------

import { TwitchChatBot } from './twitch/src/twitch-bot.js';

const twitchChatBot = new TwitchChatBot(process.env.TWITCH_CLIENT_ID, process.env.TWITCH_CLIENT_SECRET, process.env.TWITCH_CLIENT_OAUTH_TOKEN, process.env.TWITCH_CLIENT_USERNAME, "jstjxel");

twitchChatBot.listen();