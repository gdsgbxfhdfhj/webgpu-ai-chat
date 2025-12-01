import { personaEngine } from '../core/personaEngine.js';
import { memoryEngine } from '../core/memoryEngine.js';
import { format } from './format.js';

class FileExport {
    exportToTXT() {
        const conversations = memoryEngine.exportAllConversations();
        let content = '=== AI CHAT EXPORT ===\n\n';
        content += `Exported: ${format.formatDate(new Date())} ${format.formatTime(new Date())}\n\n`;
        
        for (const [personaId, messages] of Object.entries(conversations)) {
            const persona = personaEngine.getPersonaById(personaId);
            if (!persona) continue;
            
            content += `\n${'='.repeat(50)}\n`;
            content += `PERSONA: ${persona.name}\n`;
            content += `${'='.repeat(50)}\n\n`;
            
            messages.forEach(msg => {
                const role = msg.role === 'user' ? 'You' : persona.name;
                const timestamp = format.formatDate(msg.timestamp) + ' ' + format.formatTime(msg.timestamp);
                content += `[${timestamp}] ${role}:\n${msg.content}\n\n`;
            });
        }
        
        this.downloadFile('chat-export.txt', content, 'text/plain');
    }

    exportToJSON() {
        const conversations = memoryEngine.exportAllConversations();
        const exportData = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            conversations: {}
        };
        
        for (const [personaId, messages] of Object.entries(conversations)) {
            const persona = personaEngine.getPersonaById(personaId);
            if (!persona) continue;
            
            exportData.conversations[personaId] = {
                persona: {
                    id: persona.id,
                    name: persona.name,
                    avatar: persona.avatar
                },
                messages: messages
            };
        }
        
        const content = JSON.stringify(exportData, null, 2);
        this.downloadFile('chat-export.json', content, 'application/json');
    }

    downloadFile(filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        requestAnimationFrame(() => {
            URL.revokeObjectURL(url);
        });
    }
}

export const fileExport = new FileExport();