import { modelLoader } from './modelLoader.js';
import { memoryEngine } from './memoryEngine.js';

class ChatEngine {
    constructor() {
        this.currentConversation = [];
        this.isGenerating = false;
        this.abortController = null;
    }

    async sendMessage(userMessage, persona, onToken, onComplete, onError) {
        if (this.isGenerating) {
            throw new Error('Already generating response');
        }

        this.isGenerating = true;
        this.abortController = new AbortController();

        this.currentConversation.push({
            role: 'user',
            content: userMessage,
            timestamp: Date.now()
        });

        const messages = this.buildMessageContext(persona);

        try {
            let aiResponse = '';
            
            await modelLoader.generateStream(
                messages,
                (token) => {
                    aiResponse += token;
                    onToken(token);
                },
                (fullResponse) => {
                    this.currentConversation.push({
                        role: 'assistant',
                        content: fullResponse,
                        timestamp: Date.now()
                    });

                    memoryEngine.saveConversation(persona.id, this.currentConversation);
                    
                    this.isGenerating = false;
                    this.abortController = null;
                    onComplete(fullResponse);
                },
                this.abortController.signal
            );

        } catch (error) {
            this.currentConversation.pop();
            this.isGenerating = false;
            this.abortController = null;
            onError(error);
        }
    }

    buildMessageContext(persona) {
        const messages = [
            {
                role: 'system',
                content: persona.systemPrompt
            }
        ];

        const recentMessages = this.currentConversation.slice(-10);
        messages.push(...recentMessages.map(msg => ({
            role: msg.role,
            content: msg.content
        })));

        return messages;
    }

    cancelGeneration() {
        if (this.abortController) {
            this.abortController.abort();
            this.isGenerating = false;
        }
    }

    loadConversation(personaId) {
        this.currentConversation = memoryEngine.loadConversation(personaId);
        return this.currentConversation;
    }

    clearConversation() {
        this.currentConversation = [];
    }

    getConversation() {
        return this.currentConversation;
    }

    getIsGenerating() {
        return this.isGenerating;
    }
}

export const chatEngine = new ChatEngine();