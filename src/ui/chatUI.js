import chatEngine from '../core/chatEngine.js';
import personaEngine from '../core/personaEngine.js';
import quotaManager from '../core/quotaManager.js';
import { emit } from '../utils/events.js';
import miniappBootstrap from '../core/miniappBootstrap.js';

class ChatUI {
    constructor() {
        this.messagesArea = null;
        this.inputField = null;
        this.sendButton = null;
    }

    async render() {
        const persona = await personaEngine.getActivePersona();
        const quotaStatus = await quotaManager.getQuotaStatus();
        const quotaPercentage = (quotaStatus.remain / quotaStatus.free) * 100;
        
        let quotaClass = '';
        if (quotaPercentage <= 25) quotaClass = 'danger';
        else if (quotaPercentage <= 50) quotaClass = 'warning';

        const html = `
            <div class="chat-container">
                <div class="chat-header">
                    <div class="persona-avatar">${persona.avatar}</div>
                    <div class="persona-info">
                        <h3>${persona.name}</h3>
                        <p>${persona.description}</p>
                    </div>
                    <div class="quota-badge ${quotaClass}">${quotaStatus.remain}/${quotaStatus.free}</div>
                </div>
                
                <div class="messages-area" id="messages-area"></div>
                
                <div class="chat-input-area">
                    <textarea 
                        id="chat-input" 
                        class="chat-input" 
                        placeholder="Type your message..."
                        rows="1"
                    ></textarea>
                    <button id="send-btn" class="send-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        return html;
    }

    async afterRender() {
        this.messagesArea = document.getElementById('messages-area');
        this.inputField = document.getElementById('chat-input');
        this.sendButton = document.getElementById('send-btn');

        await this.loadExistingMessages();
        this.setupEventListeners();
        this.scrollToBottom();
    }

    async loadExistingMessages() {
        const persona = await personaEngine.getActivePersona();
        await chatEngine.loadConversation(persona.id);
        const conversation = chatEngine.getConversation();
        
        conversation.forEach(msg => {
            this.addMessage(msg.role, msg.content, false);
        });
    }

    setupEventListeners() {
        this.sendButton.addEventListener('click', () => this.handleSend());
        
        this.inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSend();
            }
        });

        this.inputField.addEventListener('input', () => {
            this.autoResizeTextarea();
        });
    }

    async handleSend() {
        const message = this.inputField.value.trim();
        
        if (!message || chatEngine.getIsGenerating()) {
            return;
        }

        const quotaResult = await quotaManager.consumeQuota(1);
        
        if (!quotaResult.ok) {
            emit('modal:show', {
                title: '⚠️ Daily Limit Reached',
                content: 'You have used all your free messages for today. Come back tomorrow!',
                type: 'error'
            });
            return;
        }

        miniappBootstrap.hapticFeedback('light');

        this.inputField.value = '';
        this.autoResizeTextarea();
        this.sendButton.disabled = true;

        await this.updateQuotaBadge();

        this.addMessage('user', message);
        const aiMessageEl = this.addTypingIndicator();

        const persona = await personaEngine.getActivePersona();

        try {
            let fullResponse = '';

            await chatEngine.sendMessage(
                message,
                persona,
                (token) => {
                    fullResponse += token;
                    this.updateAIMessage(aiMessageEl, fullResponse);
                },
                (complete) => {
                    this.sendButton.disabled = false;
                    this.inputField.focus();
                    miniappBootstrap.hapticFeedback('success');
                },
                (error) => {
                    console.error('Chat error:', error);
                    this.removeMessage(aiMessageEl);
                    emit('modal:show', {
                        title: '❌ Error',
                        content: 'Failed to generate response. Please try again.',
                        type: 'error'
                    });
                    this.sendButton.disabled = false;
                }
            );

        } catch (error) {
            console.error('Send error:', error);
            this.removeMessage(aiMessageEl);
            this.sendButton.disabled = false;
        }
    }

    addMessage(role, content, animate = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.textContent = content;
        
        messageDiv.appendChild(bubble);
        
        if (animate) {
            messageDiv.style.animation = 'slideUp 0.3s ease';
        }
        
        this.messagesArea.appendChild(messageDiv);
        this.scrollToBottom();
        
        return messageDiv;
    }

    addTypingIndicator() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ai';
        
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        
        messageDiv.appendChild(indicator);
        this.messagesArea.appendChild(messageDiv);
        this.scrollToBottom();
        
        return messageDiv;
    }

    updateAIMessage(messageEl, content) {
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.textContent = content;
        
        messageEl.innerHTML = '';
        messageEl.appendChild(bubble);
        
        this.scrollToBottom();
    }

    removeMessage(messageEl) {
        if (messageEl && messageEl.parentNode) {
            messageEl.parentNode.removeChild(messageEl);
        }
    }

    async updateQuotaBadge() {
        const quotaStatus = await quotaManager.getQuotaStatus();
        const quotaPercentage = (quotaStatus.remain / quotaStatus.free) * 100;
        const badge = document.querySelector('.quota-badge');
        
        if (badge) {
            badge.textContent = `${quotaStatus.remain}/${quotaStatus.free}`;
            badge.className = 'quota-badge';
            
            if (quotaPercentage <= 25) badge.classList.add('danger');
            else if (quotaPercentage <= 50) badge.classList.add('warning');
        }
    }

    autoResizeTextarea() {
        if (this.inputField) {
            this.inputField.style.height = 'auto';
            this.inputField.style.height = Math.min(this.inputField.scrollHeight, 120) + 'px';
        }
    }

    scrollToBottom() {
        if (this.messagesArea) {
            setTimeout(() => {
                this.messagesArea.scrollTop = this.messagesArea.scrollHeight;
            }, 100);
        }
    }
}

export default new ChatUI();