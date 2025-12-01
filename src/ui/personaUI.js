import personaEngine from '../core/personaEngine.js';
import { emit } from '../utils/events.js';
import miniappBootstrap from '../core/miniappBootstrap.js';
import modal from './modal.js';

class PersonaUI {
    async render() {
        await personaEngine.initialize();
        const personas = personaEngine.getAllPersonas();
        const activePersona = await personaEngine.getActivePersona();

        const personaCards = personas.map(persona => `
            <div class="persona-card ${persona.id === activePersona.id ? 'active' : ''}" data-id="${persona.id}">
                <div class="persona-avatar">${persona.avatar}</div>
                <h3>${persona.name}</h3>
                <p>${persona.description}</p>
            </div>
        `).join('');

        const html = `
            <div class="personas-container">
                <h2 style="margin-bottom: 1rem;">Select Personality</h2>
                <div class="personas-grid">
                    ${personaCards}
                </div>
                <button class="add-persona-btn" id="add-persona-btn">+ Create Custom Persona</button>
            </div>
        `;

        return html;
    }

    afterRender() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const personaCards = document.querySelectorAll('.persona-card');
        personaCards.forEach(card => {
            card.addEventListener('click', async () => {
                const id = card.getAttribute('data-id');
                await personaEngine.setActivePersona(id);
                
                miniappBootstrap.hapticFeedback('medium');
                
                personaCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                
                emit('persona:changed');
            });
        });

        const addButton = document.getElementById('add-persona-btn');
        if (addButton) {
            addButton.addEventListener('click', () => this.showCreatePersonaModal());
        }
    }

    showCreatePersonaModal() {
        const content = `
            <div class="form-group">
                <label class="form-label">Name</label>
                <input type="text" class="form-input" id="persona-name" placeholder="My Custom Persona">
            </div>
            <div class="form-group">
                <label class="form-label">Avatar (emoji)</label>
                <input type="text" class="form-input" id="persona-avatar" placeholder="😎" maxlength="2">
            </div>
            <div class="form-group">
                <label class="form-label">Description</label>
                <input type="text" class="form-input" id="persona-description" placeholder="Brief description">
            </div>
            <div class="form-group">
                <label class="form-label">System Prompt</label>
                <textarea class="form-textarea" id="persona-prompt" placeholder="You are a helpful assistant who..."></textarea>
            </div>
            <button class="btn-primary" id="save-persona-btn">Create Persona</button>
        `;

        modal.show('Create Custom Persona', content);

        setTimeout(() => {
            const saveBtn = document.getElementById('save-persona-btn');
            if (saveBtn) {
                saveBtn.addEventListener('click', () => this.handleCreatePersona());
            }
        }, 100);
    }

    async handleCreatePersona() {
        const name = document.getElementById('persona-name').value.trim();
        const avatar = document.getElementById('persona-avatar').value.trim();
        const description = document.getElementById('persona-description').value.trim();
        const prompt = document.getElementById('persona-prompt').value.trim();

        if (!name || !description || !prompt) {
            emit('modal:show', {
                title: '⚠️ Validation Error',
                content: 'Please fill in all required fields.',
                type: 'error'
            });
            return;
        }

        await personaEngine.createCustomPersona({
            name,
            avatar: avatar || '👤',
            description,
            systemPrompt: prompt
        });

        modal.hide();
        emit('page:refresh');
        miniappBootstrap.hapticFeedback('success');
    }
}

export default new PersonaUI();