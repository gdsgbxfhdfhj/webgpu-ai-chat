import { storage } from '../utils/storage.js';

class MemoryEngine {
    constructor() {
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        this.initialized = true;
    }

    loadConversation(personaId) {
        const conversations = storage.getItem('conversations') || {};
        return conversations[personaId] || [];
    }

    saveConversation(personaId, messages) {
        const conversations = storage.getItem('conversations') || {};
        conversations[personaId] = messages;
        storage.setItem('conversations', conversations);
    }

    clearConversation(personaId) {
        const conversations = storage.getItem('conversations') || {};
        delete conversations[personaId];
        storage.setItem('conversations', conversations);
    }

    clearAllConversations() {
        storage.setItem('conversations', {});
    }

    getConversationCount(personaId) {
        const conv = this.loadConversation(personaId);
        return conv.filter(m => m.role === 'user').length;
    }

    exportConversation(personaId) {
        return this.loadConversation(personaId);
    }

    exportAllConversations() {
        return storage.getItem('conversations') || {};
    }
}

export const memoryEngine = new MemoryEngine();