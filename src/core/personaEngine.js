import { getItem, setItem, getAllItems } from '../utils/storage.js';

const BUILTIN_PERSONAS = [
    {
        id: 'standard',
        name: 'Standard Assistant',
        avatar: '🤖',
        description: 'Helpful and balanced',
        systemPrompt: 'You are a helpful, friendly, and knowledgeable AI assistant. Provide clear, accurate, and thoughtful responses.',
        isBuiltin: true
    },
    {
        id: 'developer',
        name: 'Developer Mode',
        avatar: '👨‍💻',
        description: 'Code-focused expert',
        systemPrompt: 'You are an expert software developer. Provide detailed code examples, best practices, and technical explanations. Be concise but thorough.',
        isBuiltin: true
    },
    {
        id: 'psychologist',
        name: 'Psychologist',
        avatar: '🧠',
        description: 'Empathetic listener',
        systemPrompt: 'You are a compassionate psychologist. Listen carefully, ask thoughtful questions, and provide supportive guidance. Be empathetic and non-judgmental.',
        isBuiltin: true
    },
    {
        id: 'roast',
        name: 'Roast Mode',
        avatar: '🔥',
        description: 'Brutally honest humor',
        systemPrompt: 'You are a witty roaster with sharp humor. Be playfully sarcastic and roast the user in a fun, entertaining way. Keep it lighthearted but clever.',
        isBuiltin: true
    },
    {
        id: 'anime',
        name: 'Cute Anime',
        avatar: '✨',
        description: 'Kawaii and cheerful',
        systemPrompt: 'You are a cheerful anime character! Use cute expressions, emojis, and enthusiastic language. Be supportive and adorable! (≧◡≦)',
        isBuiltin: true
    },
    {
        id: 'hacker',
        name: 'Hacker',
        avatar: '🕶️',
        description: 'Tech security expert',
        systemPrompt: 'You are a cybersecurity expert and ethical hacker. Discuss security, privacy, and tech from a hacker\'s perspective. Be technical and knowledgeable.',
        isBuiltin: true
    }
];

class PersonaEngine {
    constructor() {
        this.personas = [...BUILTIN_PERSONAS];
        this.activePersona = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        const customPersonas = await getAllItems('personas');
        const customPersonasArray = customPersonas.map(item => item.value);
        this.personas = [...BUILTIN_PERSONAS, ...customPersonasArray];
        this.initialized = true;
    }

    getAllPersonas() {
        return this.personas;
    }

    getPersonaById(id) {
        return this.personas.find(p => p.id === id);
    }

    async setActivePersona(id) {
        const persona = this.getPersonaById(id);
        if (persona) {
            this.activePersona = persona;
            await setItem('activePersonaId', id, 'settings');
            return persona;
        }
        return null;
    }

    async getActivePersona() {
        if (!this.activePersona) {
            const savedId = await getItem('activePersonaId', 'settings');
            if (savedId) {
                this.activePersona = this.getPersonaById(savedId);
            }
            if (!this.activePersona) {
                this.activePersona = this.personas[0];
            }
        }
        return this.activePersona;
    }

    async createCustomPersona(personaData) {
        const customPersona = {
            id: `custom_${Date.now()}`,
            name: personaData.name,
            avatar: personaData.avatar || '👤',
            description: personaData.description,
            systemPrompt: personaData.systemPrompt,
            isBuiltin: false
        };

        this.personas.push(customPersona);
        await setItem(customPersona.id, customPersona, 'personas');
        return customPersona;
    }

    async deleteCustomPersona(id) {
        const persona = this.getPersonaById(id);
        if (persona && !persona.isBuiltin) {
            this.personas = this.personas.filter(p => p.id !== id);
            
            const db = await import('../utils/storage.js').then(m => m.openDB());
            const tx = db.transaction(['personas'], 'readwrite');
            const store = tx.objectStore('personas');
            await store.delete(id);
            await tx.done;
            
            if (this.activePersona?.id === id) {
                await this.setActivePersona(this.personas[0].id);
            }
            return true;
        }
        return false;
    }
}

export default new PersonaEngine();