import './style.scss';
import escapeHtml from 'escape-html';
import { SocketManager } from './socket-manager';
import { TmiHandler } from './tmi-msg-sender';

// let ws = new WebSocket('ws://' + BASE_IP + ':4444')
let url = 'wss://' + window.location.hostname + ':4444';
console.log("LETTING URL BE:", url)

let chatSocket = new SocketManager(['twitch-message', "tiktok-event"]);

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
    appendTikTokComment(data);
});

chatSocket.on('subConfirm', (subs) => {
    console.log('Subscribed to topics: ' + subs);
});

chatSocket.on('error', (msg) => {
    console.error("ERROR MESS:", msg);
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
    comment.timestamp = `${ String(comment.timestamp.getHours()).padStart(2, '0') }:${ String(comment.timestamp.getMinutes()).padStart(2, '0') }`;
    let elem = `<div class="twitch-message"> <span class="timestamp">${ comment.timestamp }</span> <span class="author" style="color: ${ comment.color }">${ escapeHtml(comment.author) }</span> <span class="message">${ escapeHtml(comment.message) }</span></div>`;
    commentContainer.innerHTML += elem;
}

function appendTikTokComment(data) {
    // let eventData = {
    //     comment: data.comment,
    //     nickname: data.nickname,
    //     uniqueId: data.uniqueId,
    //     profilePictureUrl: data.profilePictureUrl,
    //     followRole: data.followRole,
    //     isModerator: data.isModerator,
    //     isSubscriber: data.isSubscriber,
    // };

    let commentContainer = document.querySelector('.chat-container');

    let timeStamp = document.createElement('span');
    timeStamp.classList.add('timestamp');
    timeStamp.innerHTML = `${ data.timestamp.getHours() }:${ data.timestamp.getMinutes() }`;

    let profilePicture = document.createElement('img');
    profilePicture.classList.add('profile-picture');
    profilePicture.src = data.profilePictureUrl;

    let author = document.createElement('span');
    author.classList.add('author');
    author.innerHTML = data.nickname;

    let message = document.createElement('span');
    message.classList.add('message');
    message.innerHTML = data.comment;

    let elem = document.createElement('div');
    elem.classList.add('tiktok-message');
    elem.appendChild(timeStamp);
    elem.appendChild(profilePicture);
    elem.appendChild(author);
    elem.appendChild(message);

    commentContainer.appendChild(elem);
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


console.log('CHECKKING..');
//     if the url has a #access_token=... then we can assume that the user has logged in and we can save the token and then close the window
if (window.location.hash) {

    let token = window.location.hash.split('&')[0].split('=')[1];
    document.cookie = 'token=' + token;
    window.close();
}

console.log('DONE:');


let chatBotClientId = '1c6rmxrqyx7wmn8g5hmdqyn08ks2gg';


async function getUserToken() {
    let redirect = window.location.origin;
    let url = `https://id.twitch.tv/oauth2/authorize?client_id=${ chatBotClientId }&redirect_uri=${ encodeURIComponent(redirect) }&response_type=token&scope=chat:read+chat:edit`;

    await popupCenter({url, title: 'Login', w: 500, h: 500})
}

updateCommentInputHeight()

async function getUserName(token) {
    const response = await fetch('https://api.twitch.tv/helix/users', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Client-Id': chatBotClientId
        }
    });

    const data = await response.json();
    document.cookie = 'username=' + data.data[0].login;
    return data.data[0].login;
}

let tmiClient

async function sendComment() {
    if (!isValid(document.querySelector(".comment-input").value)) return;
    let message = document.querySelector('.comment-input').value;
    console.log("MESSAGE:", message)
    document.querySelector('.comment-input').value = '';
    // Check if there is a cookie named "token"
    console.log(listCookies())
    let token;
    let username;
    if (!hasCookie('token')) {
        await getUserToken()
    }
    token = document.cookie.split(';').find((item) => item.trim().startsWith('token=')).split('=')[1];

    if (!hasCookie('username')) {
        username = await getUserName(token)
    }
    username = document.cookie.split(';').find((item) => item.trim().startsWith('username=')).split('=')[1];

    console.log(token, username)
    console.log(message)
    if (token && username) {
        if (!tmiClient) {
            console.log("CREATING NEW TMI CLIENT")
            tmiClient = await new TmiHandler(token, username, "jstjxel");
        }

        console.log("SENDING:", message)
        await tmiClient.send(message);
        updateCommentInputHeight()
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

