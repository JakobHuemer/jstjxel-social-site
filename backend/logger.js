// const { fork } = require('child_process');
import { fork } from 'child_process';
import { communicationManager } from './communication-manager.js';

export class Logger {
    constructor(protocol) {
        // this.child = fork('./backend/communication-manager.js');
        this.PROTOCOL = protocol.toUpperCase();
    }

    log(message, subProtocol) {
        let data = {
            message: message,
            protocol: this.PROTOCOL,
            subProtocol: subProtocol?.replace(/\s+/g, '-').toUpperCase() || '-----',
            type: 'log',
            timestamp: new Date(),
            color: "#ffffff"
            // timestamp: new Date().toUTCString().replace(' GMT', `.${ currDate.getUTCMilliseconds() } GMT`),

        };
        communicationManager.emitter.emit('log', data);
    }

    error(message, subProtocol) {
        let currDate = new Date();
        let data = {
            message: message,
            protocol: this.PROTOCOL,
            subProtocol: subProtocol.replace(/\s+/g, '-').toUpperCase(),
            type: 'error',
            timestamp: currDate,
            color: "#ff0000"

        };
        communicationManager.emitter.emit('log', data);
    }

    info(message, subProtocol) {
        let data = {
            message: message,
            protocol: this.PROTOCOL,
            subProtocol: subProtocol.replace(/\s+/g, '-').toUpperCase(),
            type: 'info',
            timestamp: new Date(),
            color: "#00ff00"

        };
        communicationManager.emitter.emit('log', data);
    }

    warn(message, subProtocol) {
        let data = {
            message: message,
            protocol: this.PROTOCOL,
            subProtocol: subProtocol.replace(/\s+/g, '-').toUpperCase(),
            type: 'warn',
            timestamp: new Date(),
            color: "#ffcc00"

        };
        communicationManager.emitter.emit('log', data);
    }

    debug(message, subProtocol) {
        let data = {
            message: message,
            protocol: this.PROTOCOL,
            subProtocol: subProtocol.replace(/\s+/g, '-').toUpperCase(),
            type: 'dbg',
            timestamp: new Date(),
            color: "#22e3ff"
        }

        communicationManager.emitter.emit("log", data)
    }
}

// module.exports = { Logger };

