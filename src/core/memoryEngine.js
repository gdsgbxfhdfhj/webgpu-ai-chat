import { openDB } from '../utils/storage.js';

class MemoryEngine {
    constructor() {
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        await openDB();
        this.initialized = true;
    }

    async loadConversation(personaId) {
        await this.initialize();
        
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(['conversations'], 'readonly');
            const store = tx.objectStore('conversations');
            const request = store.get(personaId);

            request.onsuccess = () => {
                resolve(request.result?.value || []);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async saveConversation(personaId, messages) {
        await this.initialize();
        
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(['conversations'], 'readwrite');
            const store = tx.objectStore('conversations');
            const request = store.put({ personaId, value: messages });

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async clearConversation(personaId) {
        await this.initialize();
        
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(['conversations'], 'readwrite');
            const store = tx.objectStore('conversations');
            const request = store.delete(personaId);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async clearAllConversations() {
        await this.initialize();
        
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(['conversations'], 'readwrite');
            const store = tx.objectStore('conversations');
            const request = store.clear();

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async getConversationCount(personaId) {
        const conv = await this.loadConversation(personaId);
        return conv.filter(m => m.role === 'user').length;
    }

    async exportConversation(personaId) {
        return await this.loadConversation(personaId);
    }
}

export default new MemoryEngine();