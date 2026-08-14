// A simple, generic EventEmitter class for creating a pub/sub system.

type Listener<T> = (data: T) => void;

export class EventEmitter {
    private events: { [key: string]: Array<Listener<any>> } = {};

    /**
     * Subscribes a listener to an event.
     * @param eventName The name of the event to listen to.
     * @param listener The callback function to execute.
     */
    public on<T>(eventName: string, listener: Listener<T>): void {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(listener);
    }

    /**
     * Unsubscribes a listener from an event.
     * @param eventName The name of the event.
     * @param listenerToRemove The callback function to remove.
     */
    public off<T>(eventName: string, listenerToRemove: Listener<T>): void {
        if (!this.events[eventName]) {
            return;
        }
        this.events[eventName] = this.events[eventName].filter(
            listener => listener !== listenerToRemove
        );
    }

    /**
     * Emits an event, calling all subscribed listeners with the provided data.
     * @param eventName The name of the event to emit.
     * @param data The data to pass to the listeners.
     */
    public emit<T>(eventName: string, data?: T): void {
        if (!this.events[eventName]) {
            return;
        }
        this.events[eventName].forEach(listener => listener(data as T));
    }
}