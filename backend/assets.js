import { Logger } from './logger.js';
import { pin } from 'nodemon/lib/version.js';

export class Ping {
    constructor(conn, pingData, pingProt, pingInterval, printInterval) {
        this.pingLogger = new Logger("PING")

        this.count = 0;
        this.conn = conn;
        this.pingData = pingData;
        this.pingInterval = pingInterval;
        this.printInterval = printInterval;
        this.pingProt = pingProt
    }

    ping() {
        let ping = this
        this.intervalObj = setInterval(() => {
            if (ping.count % ping.printInterval === 0) {
                ping.pingLogger.log("Pinging <" + ping.pingProt + "> with: " + ping.pingData  , ping.pingProt)
            }
            ping.conn.send(ping.pingData);
            ping.count++;
        }, ping.pingInterval)
    }

    stop() {
        this.count = 0;
        this.pingLogger.warn('Stopping pinging <' + this.pingProt + '>', this.pingProt);
        clearInterval(this.intervalObj);
    }

    restart() {
        this.pingLogger.warn('Restarting pinging <' + this.pingProt + '>', this.pingProt);
        this.stop();
        this.ping();
    }
}