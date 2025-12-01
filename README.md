# AI Chat - Telegram Mini App

Complete on-device AI chat application powered by WebGPU and WebLLM with production-ready features.

## 🚀 Features

- ✅ 100% on-device AI processing (no backend)
- ✅ WebGPU-powered inference with progressive loading
- ✅ IndexedDB storage for conversations and settings
- ✅ Tamper-resistant quota system with SHA-256 digest
- ✅ Multiple built-in AI personalities
- ✅ Custom persona creation
- ✅ Complete privacy - conversations never leave device
- ✅ Offline support after first load
- ✅ Chat export (TXT/JSON)
- ✅ Automatic lite model fallback for low-memory devices
- ✅ Service worker caching
- ✅ Dark/Light theme
- ✅ Telegram Mini App optimized

## 📋 Requirements

- **Browser:** Chrome 113+, Edge 113+, or Safari 18+
- **Device:** WebGPU-capable GPU
- **Storage:** ~1GB free space for model cache
- **Memory:** 4GB+ RAM recommended

## 🛠️ Local Development

### Quick Start
```bash
# Clone repository
git clone https://github.com/yourusername/telegram-ai-chat.git
cd telegram-ai-chat

# Install dependencies (for build scripts)
npm install archiver

# Start development server
npm run dev

# Open http://localhost:8080 in Chrome/Edge
```

### Build for Production
```bash
# Build and package
npm run release

# Output: ai-chat-release.zip
```

## 🎯 Model Configuration

### Default Model

The app uses **Qwen2.5-0.5B-Instruct** by default (~300MB, fast, recommended).

### Changing Models

Edit `/src/core/modelLoader.js`:
```javascript
const MODEL_CONFIG = {
    default: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",  // 300MB, fast ⭐
    balanced: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", // 900MB, better quality
    lite: "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC"   // 600MB, fallback
};
```

Or change via Settings page in the app.

### Model Comparison

| Model | Size | Speed | Quality | Memory |
|-------|------|-------|---------|--------|
| Qwen 0.5B | 300MB | ⚡⚡⚡ | ⭐⭐ | 2GB+ |
| Qwen 1.5B | 900MB | ⚡⚡ | ⭐⭐⭐ | 4GB+ |
| TinyLlama | 600MB | ⚡⚡ | ⭐⭐ | 2GB+ |

### Automatic Fallback

The app automatically switches to lite model if:
- Device memory < 4GB
- Available heap memory < 2GB
- `window.TEST_LOW_MEMORY = true` (for testing)

## 📦 Deployment

### Option 1: GitHub Pages
```bash
# Push to GitHub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/ai-chat.git
git push -u origin main

# Enable GitHub Pages
# Settings → Pages → Source: main branch → Save

# Your URL: https://USERNAME.github.io/ai-chat
```

### Option 2: Vercel
```bash
npm i -g vercel
vercel

# Follow prompts, get URL: https://ai-chat-xxx.vercel.app
```

### Option 3: Netlify

Drag and drop the `ai-chat-release.zip` to [netlify.com](https://netlify.com)

## 🤖 Telegram Mini App Setup

### Step 1: Create Bot

1. Open @BotFather on Telegram
2. Send `/newbot`
3. Follow prompts to create your bot

### Step 2: Create Mini App

1. Send `/newapp` to @BotFather
2. Select your bot
3. Fill in details:
   - **Title:** AI Chat
   - **Description:** On-device AI chat powered by WebGPU
   - **Photo:** Upload 640x360 image
   - **Short name:** `aichat`
   - **Web App URL:** `https://your-domain.com`

4. Get link: `https://t.me/YOUR_BOT/aichat`

## 💾 Storage & Quota System

### IndexedDB Schema

- `conversations` - Chat history per persona
- `personas` - Custom personas
- `settings` - App settings
- `quota` - Daily usage with SHA-256 integrity
- `model_cache` - Model binaries (managed by WebLLM)

### Quota Management

- **Daily limit:** 20 messages (configurable)
- **Reset:** Midnight local time
- **Tamper protection:** SHA-256 digest + device fingerprint
- **Storage:** IndexedDB (not localStorage)

Edit `/src/core/quotaManager.js` to change limit:
```javascript
this.dailyLimit = 50; // Change from 20 to 50
```

## 🔧 Advanced Configuration

### Service Worker Caching

The service worker caches:
- ✅ Core HTML/CSS/JS files
- ✅ External libraries (WebLLM from CDN)
- ✅ Model files (after first download)

Model files are cached separately in IndexedDB by WebLLM.

### Model Hosting (Advanced)

By default, models load from WebLLM's CDN. To self-host:

1. Download model from [HuggingFace MLC](https://huggingface.co/mlc-ai)
2. Host on your CDN (Cloudflare R2, AWS S3, etc.)
3. Update `/src/core/modelLoader.js`:
```javascript
this.engine = await webllm.CreateMLCEngine({
    model_url: "https://your-cdn.com/models/Qwen/",
    model_lib_url: "https://your-cdn.com/models/Qwen/model.wasm"
}, { initProgressCallback: onProgress });
```

## 🧪 Testing

Open `/test.html` to access the test suite:

- ✅ Memory simulation
- ✅ Quota tampering detection
- ✅ Model loading/fallback
- ✅ IndexedDB operations
- ✅ Event lifecycle logging

## 📊 Lifecycle Events

Monitor console for these events:

- `[LIFECYCLE] app-start`
- `[LIFECYCLE] quota-initialized`
- `[LIFECYCLE] model-download-start`
- `[LIFECYCLE] model-download-complete`
- `[LIFECYCLE] model-compile-start`
- `[LIFECYCLE] model-compile-complete`
- `[LIFECYCLE] generation-start`
- `[LIFECYCLE] generation-cancel`
- `[LIFECYCLE] quota-consumed`

## 🐛 Troubleshooting

### "WebGPU not supported"

- Update to Chrome 113+ / Edge 113+ / Safari 18+
- Check `chrome://gpu` → WebGPU status
- Enable experimental WebGPU in `chrome://flags`

### Model fails to load

- Check internet connection (first load only)
- Clear browser cache and IndexedDB
- Try smaller model (Qwen 0.5B)
- Check console for specific error

### Out of memory

- Close other tabs
- Use Qwen 0.5B instead of 1.5B
- Check available memory in Task Manager
- App will auto-fallback to lite model

### Quota tampering detected

- Normal - conservative reset applied
- Check console: `[QUOTA] Tampering detected`
- Quota reset to daily limit for safety

### Slow first response

- Normal - model compilation takes 10-30 seconds
- Subsequent responses are faster
- Progress shown in loading bar

## 📄 File Structure