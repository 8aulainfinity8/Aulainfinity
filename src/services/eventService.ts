import { EventEmitter } from './utils/EventEmitter';

// This global event emitter will simulate our WebSocket/server-push connection.
// The mock database will 'emit' events, and the UI providers will listen ('on') for them.
export const eventEmitter = new EventEmitter();