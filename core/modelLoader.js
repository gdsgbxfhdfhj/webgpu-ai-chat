import { eventBus } from '../utils/events.js';

const MODEL_CONFIG = {
    default: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
    balanced: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    lite: "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC"
};

class ModelLoader {
    constructor() {
        this.engine = null;
        this.isLoaded = false;
        this.currentModel = null;
        this.webllm = null;
    }

    async initWebLLM() {
        if (this.webllm) return this.webllm;
        
        const module = await import('https://esm.run/@mlc-ai/web-llm');
        this.webllm = module;
        return module;
    }

    async checkWebGPUSupport() {
        if (!navigator.gpu) {
            throw new Error('WebGPU is not supported. Please use Chrome 113+, Edge 113+, or Safari 18+.');
        }
        
        try {
            const adapter = await navigator.gpu.requestAdapter();
            if (!adapter) {
                throw new Error('No WebGPU adapter found.');
            }
            return true;
        } catch (error) {
            throw new Error(`WebGPU initialization failed: ${error.message}`);
        }
    }

    async checkMemoryAvailability() {
        if (window.TEST_LOW_MEMORY) {
            console.log('[MEMORY] Test mode: forcing low memory');
            return false;
        }

        if (navigator.deviceMemory && navigator.deviceMemory < 4) {
            console.log('[MEMORY] Low device memory detected:', navigator.deviceMemory, 'GB');
            return false;
        }

        if (performance.memory) {
            const used = performance.memory.usedJSHeapSize;
            const limit = performance.memory.jsHeapSizeLimit;
            const available = limit - used;
            
            if (available < 2 * 1024 * 1024 * 1024) {
                return false;
            }
        }

        return true;
    }

    async selectModel(preferredModel) {
        const hasMemory = await this.checkMemoryAvailability();
        
        if (!hasMemory) {
            console.warn('[MODEL] Low memory detected, using lite model');
            return MODEL_CONFIG.lite;
        }
        
        return preferredModel || MODEL_CONFIG.default;
    }

    async loadModel(modelName, onProgress) {
        console.log('[LIFECYCLE] model-download-start', { model: modelName });
        
        await this.checkWebGPUSupport();
        await this.initWebLLM();
        
        const selectedModel = await this.selectModel(modelName);
        console.log('[MODEL] Selected model:', selectedModel);

        try {
            this.engine = await this.webllm.CreateMLCEngine(selectedModel, {
                initProgressCallback: (report) => {
                    const progress = Math.round(report.progress * 100);
                    
                    onProgress({
                        progress,
                        text: report.text,
                        stage: this.getStage(report.text)
                    });
                },
            });

            this.isLoaded = true;
            this.currentModel = selectedModel;
            
            console.log('[LIFECYCLE] model-download-complete', { model: selectedModel });
            
            return this.engine;
        } catch (error) {
            console.error('[MODEL] Loading error:', error);
            
            if (selectedModel !== MODEL_CONFIG.lite && error.message.includes('memory')) {
                console.warn('[MODEL] Retrying with lite model due to memory error');
                return this.loadModel(MODEL_CONFIG.lite, onProgress);
            }
            
            throw new Error(`Failed to load model: ${error.message}`);
        }
    }

    getStage(text) {
        const lowerText = text.toLowerCase();
        if (lowerText.includes('fetch') || lowerText.includes('download') || lowerText.includes('loading')) {
            return 'loading';
        }
        if (lowerText.includes('compil')) return 'compiling';
        if (lowerText.includes('initializ')) return 'initializing';
        return 'processing';
    }

    async generateStream(messages, onToken, onComplete, signal) {
        if (!this.isLoaded || !this.engine) {
            throw new Error('Model not loaded');
        }

        console.log('[LIFECYCLE] generation-start');

        try {
            let fullResponse = '';
            
            const completion = await this.engine.chat.completions.create({
                messages,
                temperature: 0.7,
                max_tokens: 800,
                stream: true,
            });

            for await (const chunk of completion) {
                if (signal?.aborted) {
                    console.log('[LIFECYCLE] generation-cancel');
                    await this.engine.interruptGenerate();
                    break;
                }

                const content = chunk.choices[0]?.delta?.content;
                if (content) {
                    fullResponse += content;
                    onToken(content);
                }
            }

            onComplete(fullResponse);
            return fullResponse;
        } catch (error) {
            if (signal?.aborted) {
                console.log('[LIFECYCLE] generation-cancel');
                return '';
            }
            throw error;
        }
    }

    async resetChat() {
        if (this.engine) {
            try {
                await this.engine.resetChat();
            } catch (error) {
                console.error('[MODEL] Reset error:', error);
            }
        }
    }

    isReady() {
        return this.isLoaded && this.engine !== null;
    }

    getCurrentModel() {
        return this.currentModel;
    }

    getModelConfig() {
        return MODEL_CONFIG;
    }
}

export const modelLoader = new ModelLoader();