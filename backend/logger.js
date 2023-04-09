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
            subProtocol: subProtocol.replace(/\s+/g, '-').toUpperCase(),
            type: 'log',
            timestamp: new Date()
            // timestamp: new Date().toUTCString().replace(' GMT', `.${ currDate.getUTCMilliseconds() } GMT`),

        };
        communicationManager.emitter.emit('log', data);
    }

    logErr(message, subProtocol) {
        let currDate = new Date();
        let data = {
            message: message,
            protocol: this.PROTOCOL,
            subProtocol: subProtocol.replace(/\s+/g, '-').toUpperCase(),
            type: 'err',
            timestamp: currDate

        };
        communicationManager.emitter.emit('log', data);
    }

    logInf(message, subProtocol) {
        let data = {
            message: message,
            protocol: this.PROTOCOL,
            subProtocol: subProtocol.replace(/\s+/g, '-').toUpperCase(),
            type: 'inf',
            timestamp: new Date()

        };
        communicationManager.emitter.emit('log', data);
    }

    logWrn(message, subProtocol) {
        let data = {
            message: message,
            protocol: this.PROTOCOL,
            subProtocol: subProtocol.replace(/\s+/g, '-').toUpperCase(),
            type: 'wrn',
            timestamp: new Date()

        };
        communicationManager.emitter.emit('log', data);
    }
}

// module.exports = { Logger };

