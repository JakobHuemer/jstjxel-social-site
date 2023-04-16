import "./popup-chat.scss"

import { SocketManager } from '../../socket-manager';
import escapeHtml from 'escape-html';

let chatSocket = new SocketManager(['twitch-message',"tiktok-event", "twitch-chat-notice"]);

chatSocket.on('twitch-message', (data) => {
    appendComment(data)
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

    createNoticeContent(data.comments);
});


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
    //     isModerator: data.isModerator,
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
    elem.appendChild(tikTokLogo)
    elem.appendChild(timeStamp);
    elem.appendChild(profilePicture);
    elem.appendChild(author);
    elem.appendChild(message);

    commentContainer.appendChild(elem);

    if (shouldScroll) {
        commentContainer.scrollTop = commentContainer.scrollHeight;
    }
}

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


// -------------------------------------
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
//
//
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