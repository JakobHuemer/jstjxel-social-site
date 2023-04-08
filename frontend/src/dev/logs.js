import './logs.scss';
// import { BASE_IP } from '../main';
// import { BASE_IP } from '../main.js';
// let BASE_IP = 'localhost';
import { BASE_IP, WEBSOCKET_PORT } from '../data';


// let url = 'ws://' + window.location.hostname + ":" + WEBSOCKET_PORT;
let url = 'wss://' + window.location.hostname + ":" + WEBSOCKET_PORT;
console.log("LETTING URL BE:", url)

const logContainer = document.querySelector('.log-container');

let ws = new WebSocket(url);


ws.onopen = function (event) {
    console.log('Connected to server');
    // ws.send('Hello from frontend');
};


ws.onclose = function (event) {
    console.log('Connection closed');
    console.log('RECONNECTING');
    // ws.close();
    // ws = new WebSocket('ws://' + BASE_IP + ':4444');
    // setTimeout(connect, 5000)
};

ws.onerror = function (event) {
    // ws.close();
    // ws = new WebSocket('ws://' + BASE_IP + ':4444');
    // setTimeout(connect, 5000)
};

ws.onconnectionstatechange = function (event) {
    console.log('Connection state changed');
    console.log(event);
};

ws.onmessage = function (event) {
    let data = JSON.parse(event.data);
    console.log(data);
    if (data.transport === 'log') {
        addLogEntry(data.data.timestamp, data.data.protocol, data.data.subProtocol, data.data.message, data.data.color);
    }
};

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