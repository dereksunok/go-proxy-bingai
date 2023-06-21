class EventBus {
    constructor() {
      this.events = {};
    }
    on(eventName, callback) {
      if (!this.events[eventName]) {
        this.events[eventName] = [];
      }
      this.events[eventName].push(callback);
    }

    off(eventName, callback) {
      if (!this.events[eventName]) {
        return;
      }
      this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    }

    emit(eventName, ...args) {
      if (!this.events[eventName]) {
        return;
      }
      this.events[eventName].forEach(cb => cb(...args));
    }
}

window.PAGE_EVENT_BUS = new EventBus();
window.WebSocket = new Proxy(WebSocket, {
    construct(target, args) {
      // console.log('WebSocket is being instantiated with arguments:', args);
      PAGE_EVENT_BUS.emit('pageCheckUser');
      return new target(...args);
    }
});