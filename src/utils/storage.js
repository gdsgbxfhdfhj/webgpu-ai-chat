const DB_NAME = 'ai_chat_db';
const DB_VERSION = 1;

let dbInstance = null;

export async function openDB() {
    if (dbInstance) return dbInstance;

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            dbInstance = request.result;
            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            if (!db.objectStoreNames.contains('conversations')) {
                db.createObjectStore('conversations', { keyPath: 'personaId' });
            }

            if (!db.objectStoreNames.contains('personas')) {
                db.createObjectStore('personas', { keyPath: 'id' });
            }

            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'key' });
            }

            if (!db.objectStoreNames.contains('quota')) {
                db.createObjectStore('quota', { keyPath: 'key' });
            }

            if (!db.objectStoreNames.contains('model_cache')) {
                db.createObjectStore('model_cache', { keyPath: 'url' });
            }
        };
    });
}

export async function getItem(key, storeName = 'settings') {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([storeName], 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result?.value);
        request.onerror = () => reject(request.error);
    });
}

export async function setItem(key, value, storeName = 'settings') {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([storeName], 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.put({ key, value });

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });
}

export async function removeItem(key, storeName = 'settings') {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([storeName], 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });
}

export async function getAllItems(storeName = 'settings') {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([storeName], 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function clearStore(storeName) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([storeName], 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });
}

export async function clearAllData() {
    const db = await openDB();
    const storeNames = ['conversations', 'personas', 'settings', 'quota', 'model_cache'];
    
    for (const storeName of storeNames) {
        await clearStore(storeName);
    }
    
    localStorage.clear();
    return true;
}

export async function exportAllData() {
    const data = {
        version: 1,
        exportDate: new Date().toISOString(),
        conversations: await getAllItems('conversations'),
        personas: await getAllItems('personas'),
        settings: await getAllItems('settings')
    };
    return data;
}

export async function importAllData(data) {
    if (data.version !== 1) {
        throw new Error('Incompatible data version');
    }

    if (data.conversations) {
        for (const item of data.conversations) {
            await setItem(item.personaId, item.value, 'conversations');
        }
    }

    if (data.personas) {
        for (const item of data.personas) {
            await setItem(item.id, item.value, 'personas');
        }
    }

    if (data.settings) {
        for (const item of data.settings) {
            await setItem(item.key, item.value, 'settings');
        }
    }

    return true;
}