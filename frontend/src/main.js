import './style.scss';
import escapeHtml from 'escape-html';
import { SocketManager } from './socket-manager';
import { TmiHandler } from './tmi-msg-sender';


if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    // Not mobile
    let settingsContainer = document.querySelector('.settings-container');

    let popUpString = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M320 0c-17.7 0-32 14.3-32 32s14.3 32 32 32h82.7L201.4 265.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L448 109.3V192c0 17.7 14.3 32 32 32s32-14.3 32-32V32c0-17.7-14.3-32-32-32H320zM80 32C35.8 32 0 67.8 0 112V432c0 44.2 35.8 80 80 80H400c44.2 0 80-35.8 80-80V320c0-17.7-14.3-32-32-32s-32 14.3-32 32V432c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V112c0-8.8 7.2-16 16-16H192c17.7 0 32-14.3 32-32s-14.3-32-32-32H80z"/></svg>';

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(popUpString, 'image/svg+xml');
    let popUpChat = svgDoc.querySelector('svg');
    popUpChat.classList.add('popup-chat');

    settingsContainer.appendChild(popUpChat);

    popUpChat.addEventListener('click', () => {
        let chatUrl = 'https://' + window.location.hostname + '/stream/chat';
        let title = 'Chat';

        let w = 350;

        // Fixes dual-screen position                             Most browsers      Firefox
        const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
        const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;

        const width = 350;
        const height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

        const systemZoom = width / window.screen.availWidth;
        const left = (width - w) / 2 / systemZoom + dualScreenLeft;
        const top = 0;
        const newWindow = window.open(chatUrl, title,
            `
        scrollbars=yes,
        width=${ width },
        height=${ height },
        top=${ top },
        left=${ left }
        `
        );

        if (window.focus) newWindow.focus();

    });

}


// let ws = new WebSocket('ws://' + BASE_IP + ':4444')
let url = 'wss://' + window.location.hostname + ':4444';

let chatSocket = new SocketManager(['twitch-message', 'tiktok-event', 'twitch-chat-notice']);

chatSocket.on('connect', () => {
    console.log('Connected to chat server');
});

chatSocket.on('reconnect', () => {
    console.log('Reconnected to chat server');
});

chatSocket.on('twitch-message', (data) => {
    appendComment(data);
});

chatSocket.on('tiktok-event', (data) => {
    data.eventData.timestamp = data.timestamp;
    switch (data.eventType) {
        case 'chat':
            appendTikTokComment(data.eventData);
            break;
        default:
            console.log('Unknown event type:', data.eventType);
            break;
    }
});

chatSocket.on('twitch-chat-notice', (data) => {
    // let sampleData = [
    //     {
    //         text: 'hallo',
    //         bold: true,
    //         underlined: true,
    //         color: '#FF0000'
    //     },
    //     {
    //         text: 'welt',
    //         bold: false,
    //         underlined: false,
    //         color: '#00FF00'
    //     }
    // ];

    createNoticeContent(data.comments);
});



// setInterval(() => {
//     let data = [
//         { text: 'jakkibot', bold: true, underlined: false, color: '#6441a5' },
//         { text: 'hat', bold: false, underlined: false, color: '#FFFFFF' },
//         { text: 'einen', bold: false, underlined: false, color: '#FFFFFF' },
//         { text: 'tier', bold: true, underlined: false, color: '#FFFFFF' },
//         { text: '2', bold: true, underlined: false, color: '#FFFFFF' },
//         { text: 'sub', bold: false, underlined: true, color: '#FFFFFF' },
//         {
//             text: 'gedropped',
//             bold: false,
//             underlined: false,
//             color: '#FFFFFF'
//         }
//     ];
//
//
//     createNoticeContent(data);
// }, 5000);
//
//
// setInterval(() => {
//     // let eventData = {
//     //     comment: data.comment,
//     //     nickname: data.nickname,
//     //     uniqueId: data.uniqueId,
//     //     profilePictureUrl: data.profilePictureUrl,
//     //     followRole: data.followRole,
//     //     isModerator: data.isModerato
//     //     isSubscriber: data.isSubscriber,
//     // };
//
//     let eventData = {
//         comment: 'lorem ipsum dolor sit amet',
//         nickname: 'jakkki_',
//         uniqueId: 'jakkki_',
//         profilePictureUrl: 'https://i.seadn.io/gae/2hDpuTi-0AMKvoZJGd-yKWvK4tKdQr_kLIpB_qSeMau2TNGCNidAosMEvrEXFO9G6tmlFlPQplpwiqirgrIPWnCKMvElaYgI-HiVvXc?auto=format&w=1000',
//         followRole: 0,
//         isModerator: false,
//         isSubscriber: false,
//         timestamp: new Date()
//     }
//
//     appendTikTokComment(eventData)
// }, 4000)

function createNoticeContent(data) {
    let chatContainer = document.querySelector('.chat-container');

    let notice = document.createElement('div');
    notice.classList.add('twitch-chat-notice');

    for (let i = 0; i < data.length; i++) {
        const wordItem = data[i];
        let word = document.createElement('span');
        word.textContent = wordItem.text;
        word.style.color = wordItem.color;
        if (wordItem.bold) word.classList.add('bold');
        if (wordItem.underlined) word.classList.add('underlined');

        let spacing = document.createElement('span');
        spacing.innerHTML = ' ';

        if (i !== data.length) notice.appendChild(spacing);
        notice.appendChild(word);
    }

    chatContainer.appendChild(notice);
}



chatSocket.on('subConfirm', (subs) => {
    console.log('Subscribed to topics: ' + subs);
});

chatSocket.on('error', (msg) => {
    console.error('ERROR MESS:', msg);
});


let sendButton = document.querySelector('.comment-submit');
sendButton.addEventListener('click', sendComment);

document.querySelector('.comment-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendComment();
    }
});

function hasCookie(name) {
    return document.cookie.split(';').some((item) => item.trim().startsWith(`${ name }=`));
}

// const BASE_IP = '139.162.157.52';
// export let BASE_IP = 'localhost';
// import { BASE_IP } from './data';
function isValid(str) {
    return /[^\s]/.test(str);
}

function setupCommentSection() {
    const commentSection = document.querySelector('.chat-container');
    let localTempDate = new Date();

    let tempStamp = `${ String(localTempDate.getHours()).padStart(2, '0') }:${ String(localTempDate.getMinutes()).padStart(2, '0') }`;
    commentSection.innerHTML = `<div class="chat-message" data-isbot="false" data-iscommand="false"> <span class="timestamp">${ tempStamp }</span> <span class="author" style="color: #FF0000">JstJxel</span> <span class="message">Willkommen im Chat</span></div>`;
}


//
function appendComment(comment) {
    let commentContainer = document.querySelector('.chat-container');

    let shouldScroll = commentContainer.scrollTop + commentContainer.clientHeight + 50 >= commentContainer.scrollHeight;

    comment.timestamp = `${ String(comment.timestamp.getHours()).padStart(2, '0') }:${ String(comment.timestamp.getMinutes()).padStart(2, '0') }`;
    let elem = `<div class="twitch-message"> <span class="timestamp">${ comment.timestamp }</span> <span class="author" style="color: ${ comment.color }">${ escapeHtml(comment.author) }</span> <span class="message">${ escapeHtml(comment.message) }</span></div>`;
    commentContainer.innerHTML += elem;

    if (shouldScroll) {
        commentContainer.scrollTop = commentContainer.scrollHeight;
    }
}

function appendTikTokComment(data) {

    // console.log(data);
    // let eventData = {
    //     comment: data.comment,
    //     nickname: data.nickname,
    //     uniqueId: data.uniqueId,
    //     profilePictureUrl: data.profilePictureUrl,
    //     followRole: data.followRole,
    //     isModerator: data.isModerato
    //     isSubscriber: data.isSubscriber,
    // };

    let commentContainer = document.querySelector('.chat-container');

    // console.log(`${ commentContainer.scrollTop } + ${ commentContainer.clientHeight } (= ${ commentContainer.scrollTop + commentContainer.clientHeight } ) >= ${ commentContainer.scrollHeight }`);
    let shouldScroll = commentContainer.scrollTop + commentContainer.clientHeight + 50 >= commentContainer.scrollHeight;

    let tikTokLogo = document.createElement('img');
    tikTokLogo.classList.add('tiktok-logo');
    tikTokLogo.src = 'https://www.edigitalagency.com.au/wp-content/uploads/TikTok-icon-glyph.png';

    let timeStamp = document.createElement('span');
    timeStamp.classList.add('timestamp');
    timeStamp.innerHTML = `${ String(data.timestamp.getHours()).padStart(2, '0') }:${ String(data.timestamp.getMinutes()).padStart(2, '0') }`;

    let profilePicture = document.createElement('img');
    profilePicture.classList.add('profile-picture');
    profilePicture.src = data.profilePictureUrl;

    let author = document.createElement('span');
    author.classList.add('author');
    author.innerHTML = data.nickname;

    let message = document.createElement('span');
    message.classList.add('message');
    message.innerHTML = ' ' + data.comment;

    let elem = document.createElement('div');
    elem.classList.add('tiktok-message');
    elem.appendChild(tikTokLogo);
    elem.appendChild(timeStamp);
    elem.appendChild(profilePicture);
    elem.appendChild(author);
    elem.appendChild(message);

    commentContainer.appendChild(elem);

    if (shouldScroll) {
        commentContainer.scrollTop = commentContainer.scrollHeight;
    }
}

// setupCommentSection()

// let webSocket = new WebSocket('ws://' + BASE_IP + ':8412');
//
// webSocket.onopen = function (event) {
//     console.log('Connected to server');
// };
//
// webSocket.onmessage = function (event) {
//     console.log(event.data);
//     let data = JSON.parse(event.data);
//
//     if (data.type === 'twitchmessage') {
//         appendComment(data.data);
//     } else if (data.type === 'ping') {
//         // do nothing just accept the ping
//     }
// };
//
// function notice(pleaseRefreshThePage) {
//     let commentContainer = document.querySelector('.chat-container');
//     let elem = `<div class="notice"><span>Please refresh the page!</span></div>`;
//     commentContainer.innerHTML += elem;
// }
//
// webSocket.onclose = function (event) {
//     console.log('Connection closed');
//     notice('Please refresh the page!');
// };
//
//
// sendComment = function () {
//     console.log('COMMENT SENT');
// };


if (window.location.hash) {

    let token = window.location.hash.split('&')[0].split('=')[1];
    document.cookie = 'token=' + token;
    window.close();
}


let chatBotClientId = '1c6rmxrqyx7wmn8g5hmdqyn08ks2gg';


async function getUserToken() {
    let redirect = window.location.origin;
    let url = `https://id.twitch.tv/oauth2/authorize?client_id=${ chatBotClientId }&redirect_uri=${ encodeURIComponent(redirect) }&response_type=token&scope=chat:read+chat:edit`;

    await popupCenter({ url, title: 'Login', w: 500, h: 500 });
}

updateCommentInputHeight();

async function getUserName(token) {
    const response = await fetch('https://api.twitch.tv/helix/users', {
        headers: {
            'Authorization': `Bearer ${ token }`,
            'Client-Id': chatBotClientId
        }
    });

    const data = await response.json();
    document.cookie = 'username=' + data.data[0].login;
    return data.data[0].login;
}

let tmiClient;

let inputBox = document.querySelector('.comment-input');
inputBox.addEventListener('focus', async () => {
    if (!tmiClient && hasCookie('token') && hasCookie('username')) {
        let token = document.cookie.split(';').find((item) => item.trim().startsWith('token=')).split('=')[1];
        let username = document.cookie.split(';').find((item) => item.trim().startsWith('username=')).split('=')[1];
        tmiClient = await new TmiHandler(token, username, 'jstjxel');
    }

    if (!hasCookie('token')) {
        await getUserToken();
    }

    let token = document.cookie.split(';').find((item) => item.trim().startsWith('token=')).split('=')[1];

    if (!hasCookie('username')) {
        await getUserName(token);
    }
});

async function sendComment() {
    if (!isValid(document.querySelector('.comment-input').value)) return;
    let message = document.querySelector('.comment-input').value;
    document.querySelector('.comment-input').value = '';
    updateCommentInputHeight();
    // Check if there is a cookie named "token"
    let token;
    let username;
    if (!hasCookie('token')) {
        await getUserToken();
    }
    token = document.cookie.split(';').find((item) => item.trim().startsWith('token=')).split('=')[1];

    if (!hasCookie('username')) {
        username = await getUserName(token);
    }
    username = document.cookie.split(';').find((item) => item.trim().startsWith('username=')).split('=')[1];

    if (token && username) {
        if (!tmiClient) {
            tmiClient = await new TmiHandler(token, username, 'jstjxel');
        }

        await tmiClient.send(message);
        updateCommentInputHeight();
    }
}


function listCookies() {
    let theCookies = document.cookie.split(';');
    let aString = '';
    for (let i = 1; i <= theCookies.length; i++) {
        aString += i + ' ' + theCookies[i - 1] + '\n';
    }
    return aString;
}

const popupCenter = async ({ url, title, w, h }) => {
    // Fixes dual-screen position                             Most browsers      Firefox
    const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
    const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;

    const width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
    const height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

    const systemZoom = width / window.screen.availWidth;
    const left = (width - w) / 2 / systemZoom + dualScreenLeft;
    const top = (height - h) / 2 / systemZoom + dualScreenTop;
    const newWindow = window.open(url, title,
        `
        scrollbars=yes,
        width=${ w / systemZoom },
        height=${ h / systemZoom },
        top=${ top },
        left=${ left }
        `
    );

    if (window.focus) newWindow.focus();
};

