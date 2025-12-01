const eventHandlers = new Map();

export function on(event, handler) {
    if (!eventHandlers.has(event)) {
        eventHandlers.set(event, []);
    }
    eventHandlers.get(event).push(handler);
}

export function off(event, handler) {
    if (!eventHandlers.has(event)) return;
    
    const handlers = eventHandlers.get(event);
    const index = handlers.indexOf(handler);
    
    if (index > -1) {
        handlers.splice(index, 1);
    }
}

export function emit(event, data) {
    console.log(`[EVENT] ${event}`, data);
    
    if (!eventHandlers.has(event)) return;
    
    const handlers = eventHandlers.get(event);
    handlers.forEach(handler => {
        try {
            handler(data);
        } catch (error) {
            console.error(`Error in event handler for ${event}:`, error);
        }
    });
}

export function once(event, handler) {
    const wrappedHandler = (data) => {
        handler(data);
        off(event, wrappedHandler);
    };
    on(event, wrappedHandler);
}

export function clear(event) {
    if (event) {
        eventHandlers.delete(event);
    } else {
        eventHandlers.clear();
    }
}