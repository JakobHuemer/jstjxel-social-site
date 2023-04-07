import { communicationManager } from './communication-manager.js';

export class SiteSocket {
    constructor(type) {
        this.type = type;
    }

    send(data) {
        data.timestamp = new Date();
        communicationManager.emitter.emit(this.type, data);
    }
}