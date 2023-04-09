import './logs.scss';
// import { BASE_IP } from '../main';
// import { BASE_IP } from '../main.js';
// let BASE_IP = 'localhost';
import escapeHtml from 'escape-html';


// let url = 'ws://' + window.location.hostname + ":" + WEBSOCKET_PORT;
let url = 'wss://' + window.location.hostname + ':4444'

const logContainer = document.querySelector('.log-container');


// implememtation of the new socketManager
import { SocketManager } from '../socket-manager';
let logSocket = new SocketManager(['log']);

logSocket.on('connect', () => {
    console.log('Connected to log server');
});

logSocket.on('reconnect', () => {
    addLogEntry('--- NEW ---', '--- NEW ---', '--- NEW ---', '--- NEW ---', '#6300c2');
});

logSocket.on('log', (data) => {
    data.timestamp = formatDate(data.timestamp);
    addLogEntry(data.timestamp, data.protocol, data.subProtocol, data.message, data.color);
});

const formatDate = (date) => `${ date.getFullYear() }-` +
    `${ (date.getMonth() + 1).toString().padStart(2, '0') }-` +
    `${ date.getDate().toString().padStart(2, '0') } ` +
    `${ date.getHours().toString().padStart(2, '0') }:` +
    `${ date.getMinutes().toString().padStart(2, '0') }:` +
    `${ date.getSeconds().toString().padStart(2, '0') }.` +
    `${ date.getMilliseconds().toString().padStart(3, '0') }`;

logSocket.on('subConfirm', (subs) => {
    console.log('Subscribed to topics: ' + subs);
});

logSocket.on("error", (msg) => {
    console.error(msg);
})



let ifGoingToScroll = false;

function addLogEntry(timestamp, protocol, subProtocol, msg, baseColor) {

    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
        // Scroll to the bottom of the page
        ifGoingToScroll = true;
    }

    // Find the tbody element
    const tbody = document.querySelector('table tbody');

    // Create a new tr element
    const tr = document.createElement('tr');

    // Create td elements for each field in the log data
    const timestampTd = document.createElement('td');
    timestampTd.textContent = timestamp;
    tr.appendChild(timestampTd);

    const protocolTd = document.createElement('td');
    protocolTd.textContent = protocol;
    tr.appendChild(protocolTd);

    const subProtocolTd = document.createElement('td');
    subProtocolTd.textContent = subProtocol;
    tr.appendChild(subProtocolTd);

    const msgTd = document.createElement('td');
    msgTd.textContent = msg;
    tr.appendChild(msgTd);

    // make the color style the baseColor
    tr.style.color = baseColor;

    // Append the new tr element to the tbody element
    tbody.appendChild(tr);

    if (ifGoingToScroll) {
        window.scrollTo(0, document.body.scrollHeight);
        ifGoingToScroll = false;
    }

}

const tbody = document.querySelector('table tbody');

// Create a new MutationObserver
const observer = new MutationObserver((mutations) => {
    // Check if the user is at the bottom of the page
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
        // Scroll to the bottom of the page
        window.scrollTo(0, document.body.scrollHeight);
    }
});

// Start observing changes to the childList of the tbody element
observer.observe(tbody, { childList: true });