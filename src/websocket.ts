// src/websocket.ts

import WebSocket from 'ws';
import { EventEmitter } from 'events';

import {
    IncomingWebSocketMessage,
    isWebSocketResponse,
    NcElementId,
    Command,
    WebSocketCommandMsg,
    isWebSocketSubscriptions,
    isWebSocketNotification,
    isWebSocketError,
    WebSocketSubscriptionsMsg,
    NcMethodResultError
} from './datatypes';

const REQUEST_TIMEOUT_MS = 10000;

interface PendingRequest {
    resolve: (value: any) => void;  // eslint-disable-line @typescript-eslint/no-explicit-any
    reject: (reason?: Error) => void;
    timeout: NodeJS.Timeout;
}

/**
 * A client to manage a WebSocket connection and handle request-response commands
 * as well as spontaneous server-sent notifications.
 */
export class WebSocketClient extends EventEmitter {
    private ws: WebSocket | null = null;
    private handleCounter = 1;
    private pendingRequests = new Map<number, PendingRequest>();
    private pendingSubscriptions = new Map<number, PendingRequest>();

    constructor() {
        super();
    }

    public connect(url: string): Promise<void> {
        this.ws = new WebSocket(url);

        return new Promise((resolve, reject) => {
            this.ws?.on('open', () => {
                console.log('✅ WebSocket connection established!');
                resolve();
            });
            this.ws?.on('error', (err) => {
                console.error('WebSocket connection error:', err);
                reject(err);
            });
            this.ws?.on('message', this.handleMessage.bind(this));
            this.ws?.on('close', (code, reason) => {
                console.log(`WebSocket connection closed. Code: ${code}, Reason: ${reason.toString()}`);
                this.pendingRequests.forEach(req => req.reject(new Error('Connection closed')));
                this.pendingRequests.clear();
                this.pendingSubscriptions.forEach(req => req.reject(new Error('Connection closed')));
                this.pendingSubscriptions.clear();
            });
        });
    }

    public async sendCommand<T>(oid: number, methodId: NcElementId, commandArguments: object): Promise<T> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket is not connected.');
        }
        const handle = this.handleCounter++;
        const commandToSend: Command = { handle, oid, methodId, arguments: commandArguments };
        const commandMsg: WebSocketCommandMsg = { messageType: 0, commands: [commandToSend] };
        return new Promise<T>((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(handle);
                reject(new Error(`Command message ${handle} timed out after ${REQUEST_TIMEOUT_MS}ms`));
            }, REQUEST_TIMEOUT_MS);
            this.pendingRequests.set(handle, { resolve, reject, timeout });
            const json = JSON.stringify(commandMsg);
            console.log(`▶️ Sending command message: ${json}`);
            this.ws?.send(json);
        });
    }

    public async sendSubscriptions<T>(subscriptions: number[]): Promise<T> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket is not connected.');
        }
        const subscriptionsMsg: WebSocketSubscriptionsMsg = { messageType: 3, subscriptions };
        return new Promise<T>((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingSubscriptions.delete(0);
                reject(new Error(`Subscription message timed out after ${REQUEST_TIMEOUT_MS}ms`));
            }, REQUEST_TIMEOUT_MS);
            this.pendingSubscriptions.set(0, { resolve, reject, timeout });
            const json = JSON.stringify(subscriptionsMsg);
            console.log(`▶️ Sending subscription message: ${json}`);
            this.ws?.send(json);
        });
    }
  
    public close(): void {
        this.ws?.close();
    }

    private handleMessage(data: WebSocket.RawData): void {
        const message = data.toString();
        
        try {
            const parsedMessage: IncomingWebSocketMessage = JSON.parse(message);

            //  Check the response type
            if (isWebSocketResponse(parsedMessage)) {
                // It's a response to a command msg we sent.
                console.log(`◀️ Received command response message: ${message}`);

                parsedMessage.responses.forEach(r => {
                    const pending = this.pendingRequests.get(r.handle);
                    if (pending) {
                        clearTimeout(pending.timeout);
                        if (r.result.status === 200) {
                            pending.resolve(r.result);
                        } else {
                            pending.reject(new Error(`Received error response, handle: ${r.handle}, status: ${r.result.status}, errorMessage: ${(r.result as NcMethodResultError).errorMessage}`));
                        }
                        this.pendingRequests.delete(r.handle);
                    } else {
                        console.warn(`Received response for unknown handle: ${r.handle}`);
                    }
                });
            } else if (isWebSocketNotification(parsedMessage)) {
                // It's a spontaneous notification from the server.
                this.emit('notification', parsedMessage);
            } else if (isWebSocketSubscriptions(parsedMessage)) {
                // It's a subscriptions response from the server.
                console.log(`◀️ Received subscription response message: ${message}`);
                const pending = this.pendingSubscriptions.get(0);
                if (pending) {
                    clearTimeout(pending.timeout);
                    pending.resolve(parsedMessage.subscriptions);
                    this.pendingSubscriptions.delete(0);
                } else {
                    console.warn(`Received subscription response message without prior message`);
                }
            } else if (isWebSocketError(parsedMessage)) {
                // It's an error message
                console.error(`❌ Received Error: ${message}`);
            }
        } catch (error) {
            console.error('Error parsing incoming JSON message:', error);
        }
    }
}