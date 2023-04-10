// import "./logger.js"
import { Logger } from './logger.js';
// import express from 'express';
import { config } from 'dotenv';

config();


const httpLogger = new Logger('HTTP');

// WEB SERVER -------------------------------------------------------------------------
import https from 'https';
import fs from 'fs';
import express from 'express';

const webApp = express();
const webPort = 443;

import { options } from './certificate-options.js';

const webAppOptions = options;

// Middle ware auths
import { hasSharedSecret } from './https-middleware.js';

// all sites
webApp.get('/dev/logs.html', hasSharedSecret, (req, res) => {
    res.sendFile('./dev/logs.html', { root: './frontend/dist/' });
});

webApp.get('/dev/logs', hasSharedSecret, (req, res) => {
    res.sendFile('./dev/logs.html', { root: './frontend/dist/' });
});

webApp.get('/', hasSharedSecret, (req, res) => {
    res.sendFile('./index.html', { root: './frontend/dist/' });
});

webApp.get('/linktree', (req, res) => {
    res.sendFile('./linktree/linktree.html', { root: './frontend/dist/' });
});

webApp.get('/stream/overlay', hasSharedSecret, (req, res) => {
    res.sendFile('./stream-ass/overlay/overlay.html', { root: './frontend/dist/' });
});

webApp.get('/stream/chat', (req, res) => {
    res.sendFile('./stream-ass/popup-chat/popup-chat.html', { root: './frontend/dist/' });
});


webApp.use(express.static('./frontend/dist'));


// webApp.get('*', (req, res) => {
//     res.sendFile('./404/404.html', { root: './frontend/dist/' });
// });


https.createServer(webAppOptions, webApp).listen(webPort, () => {
    httpLogger.log(`Webserver listening on port ${ webPort }`, 'web server');
});

// TWITCH CHAT BOT -------------------------------------------------------------------------


import { TwitchChatBot } from './twitch/src/twitch-bot.js';

const clientId = process.env.TWITCH_CLIENT_ID;
const clientSecret = process.env.TWITCH_CLIENT_SECRET;
const oauthToken = process.env.TWITCH_CLIENT_OAUTH_TOKEN;
const clientUserName = process.env.TWITCH_CLIENT_USERNAME;
const channel = 'jakkibot';
// const channel = 'jstjxel';

const twitchChatBot = new TwitchChatBot(
    clientId,
    clientSecret,
    oauthToken,
    clientUserName,
    channel
);

twitchChatBot.listen();

// TWITCH EVENTSUB -------------------------------------------------------------------------

import { TwitchEventSub } from './twitch/src/eventsub.js';

const userName = 'jstjxel';
const userAccessToken = process.env.TWITCH_USER_ACCESS_TOKEN_JIXEL;

const twitchEventSub = new TwitchEventSub(
    'jstjxel',
    clientId,
    clientSecret,
    userAccessToken
);

twitchEventSub.listen();

// TikTok Chat Bot -------------------------------------------------------------------------

import { TikTokChatBot } from './tiktok/src/tiktok-bot.js';

const tiktokChatBot = new TikTokChatBot('jstjxel', process.env.TIKTOK_CLIENT_SESSION_ID);

tiktokChatBot.connect();