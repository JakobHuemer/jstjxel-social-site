import "./popup-chat.scss"

import { SocketManager } from '../../socket-manager';
import escapeHtml from 'escape-html';

let chatSocket = new SocketManager(['twitch-message',"tiktok-event"]);

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