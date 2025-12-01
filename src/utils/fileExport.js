import personaEngine from '../core/personaEngine.js';
import { formatDate, formatTime } from './format.js';
import { exportAllData } from './storage.js';

export async function exportToTXT() {
    const data = await exportAllData();
    let content = '=== AI CHAT EXPORT ===\n\n';
    content += `Exported: ${formatDate(new Date())} ${formatTime(new Date())}\n\n`;
    
    for (const conv of data.conversations) {
        const persona = personaEngine.getPersonaById(conv.personaId);
        if (!persona) continue;
        
        content += `\n${'='.repeat(50)}\n`;
        content += `PERSONA: ${persona.name}\n`;
        content += `${'='.repeat(50)}\n\n`;
        
        const messages = conv.value || [];
        messages.forEach(msg => {
            const role = msg.role === 'user' ? 'You' : persona.name;
            const timestamp = formatDate(msg.timestamp) + ' ' + formatTime(msg.timestamp);
            content += `[${timestamp}] ${role}:\n${msg.content}\n\n`;
        });
    }
    
    downloadFile('chat-export.txt', content, 'text/plain');
}

export async function exportToJSON() {
    const exportData = await exportAllData();
    const content = JSON.stringify(exportData, null, 2);
    downloadFile('chat-export.json', content, 'application/json');
}

function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => URL.revokeObjectURL(url), 100);
}