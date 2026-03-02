const express = require('express');
const multer = require('multer');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { editBackgroundOnly } = require('./imageEditing');
require('dotenv').config();

const isDev = process.env.NODE_ENV !== 'production';

const app = express();
const PORT = process.env.PORT || 5000;
const WORLD_API_BASE = 'https://api.worldlabs.ai/marble/v1';
// Documentation World Labs : header "WLT-Api-Key" — utiliser WLT_API_KEY ou WORLD_API_KEY dans .env
const WORLD_API_KEY = process.env.WLT_API_KEY || process.env.WORLD_API_KEY;

// ── Middleware ───────────────────────────────────────────────────────────────

// CORS — whitelist des origines autorisées
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
];
app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origine (ex : curl, Postman en dev)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`Origine non autorisée par CORS : ${origin}`));
  }
}));

// Limite la taille du payload JSON à 1 Mo
app.use(express.json({ limit: '1mb' }));

app.use('/uploads', express.static('uploads'));
app.use('/generated', express.static('generated'));

// ── Rate Limiting ────────────────────────────────────────────────────────────

// Limite sur les endpoints qui appellent des APIs payantes
const expensiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // fenêtre de 15 minutes
  max: 15,                   // max 15 requêtes par IP par fenêtre
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes. Réessayez dans 15 minutes.' }
});

// Limite générale sur toutes les routes /api
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes. Réessayez dans une minute.' }
});

app.use('/api/', generalLimiter);
app.use('/api/generate', expensiveLimiter);
app.use('/api/worlds/create', expensiveLimiter);

// Ensure directories exist
fs.ensureDirSync('uploads');
fs.ensureDirSync('generated');

// Gallery JSON file path
const GALLERY_FILE = path.join(__dirname, 'gallery.json');

// Helper: read gallery data
function readGallery() {
  try {
    if (fs.existsSync(GALLERY_FILE)) {
      return JSON.parse(fs.readFileSync(GALLERY_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Error reading gallery:', e);
  }
  return [];
}

// Helper: write gallery data
function writeGallery(data) {
  fs.writeFileSync(GALLERY_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Styles JSON file path
const STYLES_FILE = path.join(__dirname, 'styles.json');

// Helper: read styles data
function readStyles() {
  try {
    if (fs.existsSync(STYLES_FILE)) {
      return JSON.parse(fs.readFileSync(STYLES_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Error reading styles:', e);
  }
  return { styles: [] };
}

// Helper: write styles data
function writeStyles(data) {
  fs.writeFileSync(STYLES_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-image-preview' });

// Upload endpoint
app.post('/api/upload', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  res.json({
    success: true,
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}`,
    originalName: req.file.originalname
  });
});

// Helpers for image generation
async function readImageAsBase64(relativePath) {
  // Sécurité : s'assurer que le fichier est bien dans le dossier uploads/
  const safeFilename = path.basename(relativePath);
  const uploadsDir = path.resolve(__dirname, 'uploads');
  const imagePath = path.resolve(uploadsDir, safeFilename);

  if (!imagePath.startsWith(uploadsDir + path.sep)) {
    throw new Error('Accès interdit : chemin hors du répertoire autorisé');
  }

  const imageBuffer = await fs.readFile(imagePath);
  return imageBuffer.toString('base64');
}

function buildStylePrompt(style, customPrompt, mode) {
  const stylePrompt = style.prompt || `${style.name} interior design`;

  if (mode === 'background') {
    let prompt = `You are an expert interior design retoucher.
Transform ONLY the background of this room into ${stylePrompt}.
Keep the main subject (any person, main sofa, bed, table or key furniture in the foreground) EXACTLY as in the original image: same shape, position and main colors.
Do NOT change faces, bodies, skin tone, clothing, or the main furniture piece. You may only make very light global lighting adjustments.
Change walls, floor, ceiling, windows, secondary furniture and decorative accessories to match the requested African interior style.
Use these colors: ${style.colors?.join(', ') || 'warm African earth tones'}.
Materials: ${style.materials?.join(', ') || 'traditional African materials'}.
Patterns: ${style.patterns?.join(', ') || 'African geometric patterns'}.
The result must look like high quality architectural interior photography, 4K, photorealistic.`;

    if (customPrompt && customPrompt.trim() !== '') {
      prompt += `\n\nUSER SPECIFIC INSTRUCTIONS (PRIORITIZE THESE HIGHEST, BUT STILL KEEP THE MAIN SUBJECT UNCHANGED):\n${customPrompt}`;
    }

    return prompt;
  }

  let prompt = `Transform this entire room into ${stylePrompt}. 
Use these colors: ${style.colors?.join(', ') || 'warm African earth tones'}.
Materials: ${style.materials?.join(', ') || 'traditional African materials'}.
Patterns: ${style.patterns?.join(', ') || 'African geometric patterns'}.
Maintain the room layout and structure while completely transforming the style.
High quality architectural interior photography style, 4K, photorealistic.`;

  if (customPrompt && customPrompt.trim() !== '') {
    prompt += `\n\nUSER SPECIFIC INSTRUCTIONS (PRIORITIZE THESE HIGHEST):\n${customPrompt}`;
  }

  return prompt;
}

// Generate styled interior endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const { originalImage, style, customPrompt, editMode } = req.body;

    if (!originalImage || !style) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const mode = editMode === 'background' ? 'background' : 'full';

    console.log('Generating styled interior for style:', style.name, 'mode:', mode);

    // Read the original image
    const imageBase64 = await readImageAsBase64(originalImage);

    // Construct the prompt based on style data and mode
    const enhancedPrompt = buildStylePrompt(style, customPrompt, mode);

    let generatedImageBuffer;

    // Optional advanced background-only editing path
    if (mode === 'background' && process.env.ENABLE_VERTEX_IMAGE_EDITING === 'true') {
      const editedBuffer = await editBackgroundOnly({
        imageBase64,
        stylePrompt: enhancedPrompt
      });

      if (editedBuffer && Buffer.isBuffer(editedBuffer)) {
        generatedImageBuffer = editedBuffer;
      }
    }

    // Fallback or default path: use Gemini generateContent
    if (!generatedImageBuffer) {
      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              { text: enhancedPrompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: imageBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 2048,
        }
      });

      const response = await result.response;
      const candidates = response.candidates;

      if (!candidates || candidates.length === 0) {
        throw new Error('No candidates returned from Gemini API');
      }

      const candidate = candidates[0];
      const parts = candidate.content.parts;

      const imagePart = parts.find(part => part.inlineData);

      if (!imagePart || !imagePart.inlineData) {
        throw new Error('No image data returned from Gemini API');
      }

      generatedImageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
    }
    const generatedFilename = `generated-${Date.now()}-${style.id}.png`;
    const generatedPath = path.join('generated', generatedFilename);

    await fs.writeFile(generatedPath, generatedImageBuffer);

    // Auto-save to gallery
    const galleryEntry = {
      id: `gallery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      originalImage: originalImage,
      generatedImage: `/generated/${generatedFilename}`,
      styleName: style.name || 'Unknown',
      styleFamily: style.family || '',
      styleId: style.id || '',
      prompt: enhancedPrompt,
      customPrompt: customPrompt || null,
      mode: mode,
      isFavorite: false,
      createdAt: new Date().toISOString()
    };
    const gallery = readGallery();
    gallery.unshift(galleryEntry);
    writeGallery(gallery);
    console.log('Gallery entry saved:', galleryEntry.id);

    res.json({
      success: true,
      id: galleryEntry.id,
      originalImage: originalImage,
      generatedImage: `/generated/${generatedFilename}`,
      style: style,
      prompt: enhancedPrompt,
      mode: mode
    });

  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({
      error: 'Failed to generate image',
      ...(isDev && { details: error.message })
    });
  }
});

// Get all styles endpoint (dynamic)
app.get('/api/styles', (req, res) => {
  const stylesData = readStyles();
  res.json(stylesData);
});

// Create new style
app.post('/api/styles', (req, res) => {
  try {
    const { name, region, family, description, prompt, materials, colors, patterns, flag } = req.body;

    if (!name || !prompt) {
      return res.status(400).json({ error: 'Name and Prompt are required' });
    }

    const stylesData = readStyles();

    const newStyle = {
      id: `style-${Date.now()}`,
      name,
      region: region || 'Other',
      family: family || 'Other',
      description: description || '',
      prompt,
      materials: materials || [],
      colors: colors || [],
      patterns: patterns || [],
      flag: flag || '🌍'
    };

    stylesData.styles.push(newStyle);
    writeStyles(stylesData);

    res.status(201).json(newStyle);
  } catch (error) {
    console.error('Create style error:', error);
    res.status(500).json({ error: isDev ? error.message : 'Erreur interne' });
  }
});

// Update style
app.put('/api/styles/:id', (req, res) => {
  try {
    const stylesData = readStyles();
    const index = stylesData.styles.findIndex(s => s.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Style not found' });
    }

    const updatedStyle = { ...stylesData.styles[index], ...req.body, id: req.params.id };
    stylesData.styles[index] = updatedStyle;

    writeStyles(stylesData);
    res.json(updatedStyle);
  } catch (error) {
    console.error('Update style error:', error);
    res.status(500).json({ error: isDev ? error.message : 'Erreur interne' });
  }
});

// Delete style
app.delete('/api/styles/:id', (req, res) => {
  try {
    const stylesData = readStyles();
    const index = stylesData.styles.findIndex(s => s.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Style not found' });
    }

    stylesData.styles.splice(index, 1);
    writeStyles(stylesData);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete style error:', error);
    res.status(500).json({ error: isDev ? error.message : 'Erreur interne' });
  }
});

// Gallery: list all entries (newest first)
app.get('/api/gallery', (req, res) => {
  const gallery = readGallery();
  res.json(gallery);
});

// Gallery: delete an entry
app.delete('/api/gallery/:id', async (req, res) => {
  try {
    const gallery = readGallery();
    const entry = gallery.find(e => e.id === req.params.id);
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    // Delete the generated image file
    const imagePath = path.join(__dirname, entry.generatedImage);
    if (await fs.pathExists(imagePath)) {
      await fs.remove(imagePath);
    }
    // Remove from gallery
    const updated = gallery.filter(e => e.id !== req.params.id);
    writeGallery(updated);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Gallery: save world URL to an entry
app.patch('/api/gallery/:id/world', (req, res) => {
  try {
    const gallery = readGallery();
    const entryIndex = gallery.findIndex(e => e.id === req.params.id);

    if (entryIndex === -1) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const { worldUrl, worldOperationId } = req.body;
    if (worldUrl) gallery[entryIndex].worldUrl = worldUrl;
    if (worldOperationId) gallery[entryIndex].worldOperationId = worldOperationId;

    writeGallery(gallery);
    console.log(`🌍 World saved for gallery entry ${req.params.id}: ${worldUrl}`);
    res.json({ success: true, worldUrl: gallery[entryIndex].worldUrl });
  } catch (error) {
    console.error('Save world error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Gallery: toggle favorite status
app.patch('/api/gallery/:id/favorite', (req, res) => {
  try {
    const gallery = readGallery();
    const entryIndex = gallery.findIndex(e => e.id === req.params.id);

    if (entryIndex === -1) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    // Toggle the boolean value (or set to true if undefined)
    gallery[entryIndex].isFavorite = !gallery[entryIndex].isFavorite;

    writeGallery(gallery);
    res.json({ success: true, isFavorite: gallery[entryIndex].isFavorite });
  } catch (error) {
    console.error('Favorite toggle error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create virtual world from generated image (World Labs / Marble)
app.post('/api/worlds/create', async (req, res) => {
  try {
    const { generatedImage, style, worldName } = req.body || {};

    if (!generatedImage) {
      return res.status(400).json({ error: 'Missing generatedImage path' });
    }

    if (!WORLD_API_KEY) {
      return res.status(500).json({ error: 'World Labs API key not configured' });
    }

    // Read the generated image from disk
    const relativePath = generatedImage.replace(/^[/\\]+/, '');
    const imagePath = path.join(__dirname, relativePath);
    const imageBuffer = await fs.readFile(imagePath);
    const extension = (path.extname(imagePath) || '.png').replace('.', '') || 'png';
    const fileName = path.basename(imagePath);

    // 1) Prepare upload (media-assets:prepare_upload)
    const prepareResponse = await axios.post(
      `${WORLD_API_BASE}/media-assets:prepare_upload`,
      {
        file_name: fileName,
        kind: 'image',
        extension: extension
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'WLT-Api-Key': WORLD_API_KEY
        }
      }
    );

    const { media_asset: mediaAsset, upload_info: uploadInfo } = prepareResponse.data || {};

    // L'API World Labs retourne media_asset_id (pas .id)
    const assetId = mediaAsset?.media_asset_id || mediaAsset?.id;

    if (!assetId || !uploadInfo || !uploadInfo.upload_url) {
      console.error('prepare_upload response:', JSON.stringify(prepareResponse.data, null, 2));
      throw new Error('Invalid response from World Labs prepare_upload');
    }

    // 2) Upload file to signed URL
    await axios.put(uploadInfo.upload_url, imageBuffer, {
      headers: uploadInfo.required_headers || {}
    });

    // 3) Request world generation from the uploaded media asset
    const displayName =
      worldName ||
      (style && style.name
        ? `African Interior – ${style.name}`
        : 'African Interior World');

    const textPrompt =
      style && style.name
        ? `A virtual 3D world based on an African interior in the style "${style.name}" from ${style.region || 'Africa'}, family ${style.family || 'Unknown'}.`
        : 'A virtual 3D world based on an African interior design.';

    const generateResponse = await axios.post(
      `${WORLD_API_BASE}/worlds:generate`,
      {
        display_name: displayName,
        world_prompt: {
          type: 'image',
          image_prompt: {
            source: 'media_asset',
            media_asset_id: assetId
          },
          text_prompt: textPrompt
        },
        permission: {
          public: true
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'WLT-Api-Key': WORLD_API_KEY
        }
      }
    );

    const operation = generateResponse.data;
    const operationId = operation?.operation_id || null;
    const worldId = operation?.metadata?.world_id || null;
    const worldUrl = worldId
      ? `https://marble.worldlabs.ai/world/${worldId}`
      : null;

    // La génération est asynchrone : on retourne l'operationId pour que le frontend puisse poller
    res.json({
      success: true,
      mediaAssetId: assetId,
      operationId,
      operation,
      worldId,
      worldUrl,
      pending: !worldUrl
    });
  } catch (error) {
    const apiError = error.response?.data;
    const details = apiError?.message || apiError?.error || (typeof apiError === 'object' ? JSON.stringify(apiError) : apiError) || error.message;
    console.error('World creation error:', apiError || error.message || error);
    res.status(500).json({
      error: 'Failed to create virtual world',
      ...(isDev && { details })
    });
  }
});

// Polling status d'une opération World Labs
app.get('/api/worlds/status/:operationId', async (req, res) => {
  try {
    if (!WORLD_API_KEY) {
      return res.status(500).json({ error: 'World Labs API key not configured' });
    }

    const { operationId } = req.params;
    const statusResponse = await axios.get(
      `${WORLD_API_BASE}/operations/${operationId}`,
      { headers: { 'WLT-Api-Key': WORLD_API_KEY } }
    );

    const op = statusResponse.data;
    const done = op?.done === true;
    const worldId = op?.metadata?.world_id || op?.response?.id || null;
    const worldUrl = worldId ? `https://marble.worldlabs.ai/world/${worldId}` : null;
    const status = op?.metadata?.progress?.status || (done ? 'SUCCEEDED' : 'IN_PROGRESS');
    const errorMsg = op?.error?.message || null;

    res.json({ done, status, worldId, worldUrl, error: errorMsg });
  } catch (error) {
    const apiError = error.response?.data;
    console.error('World status error:', apiError || error.message);
    res.status(500).json({ error: 'Failed to get world status', details: error.message });
  }
});

// ── Marble Reverse Proxy (manual, via axios) ──
// Marble bloque les iframes via X-Frame-Options / CSP frame-ancestors.
// Ce proxy relaye marble.worldlabs.ai en supprimant ces headers.
// On réécrit aussi les URLs d'assets dans le HTML pour qu'ils passent par le proxy.
// Whitelist des préfixes de chemins autorisés sur le proxy Marble
const MARBLE_ALLOWED_PREFIXES = ['/world/', '/_next/', '/static/', '/favicon'];

app.use('/api/marble-proxy', async (req, res) => {
  // Restriction : seuls les chemins whitelistés sont autorisés
  const isAllowed = MARBLE_ALLOWED_PREFIXES.some(prefix => req.url.startsWith(prefix));
  if (!isAllowed) {
    return res.status(403).json({ error: 'Chemin non autorisé via le proxy' });
  }

  try {
    const targetUrl = 'https://marble.worldlabs.ai' + req.url;
    const axiosRes = await axios({
      method: req.method,
      url: targetUrl,
      headers: {
        'accept': req.headers['accept'] || '*/*',
        'accept-encoding': 'identity',
        'accept-language': req.headers['accept-language'] || 'en',
        'user-agent': req.headers['user-agent'] || 'Mozilla/5.0',
        'host': 'marble.worldlabs.ai',
        'referer': 'https://marble.worldlabs.ai/',
        'origin': 'https://marble.worldlabs.ai'
      },
      responseType: 'arraybuffer',
      timeout: 30000,
      maxRedirects: 5,
      validateStatus: () => true
    });

    // Copier les headers de réponse, sauf ceux qui bloquent l'iframe
    const skipHeaders = ['x-frame-options', 'content-security-policy', 'content-security-policy-report-only', 'transfer-encoding', 'connection', 'strict-transport-security'];
    for (const [key, value] of Object.entries(axiosRes.headers)) {
      if (!skipHeaders.includes(key.toLowerCase())) {
        res.set(key, value);
      }
    }

    // Pour les pages HTML : réécrire les URLs d'assets pour passer par notre proxy
    const contentType = (axiosRes.headers['content-type'] || '').toLowerCase();
    if (contentType.includes('text/html')) {
      let html = Buffer.from(axiosRes.data).toString('utf-8');
      html = html.replace(/(["'(])\/(?!api\/marble-proxy\/)/g, '$1/api/marble-proxy/');
      res.status(axiosRes.status).send(html);
    } else {
      res.status(axiosRes.status).send(Buffer.from(axiosRes.data));
    }
  } catch (err) {
    console.error('Marble proxy error:', err.message);
    res.status(502).json({ error: 'Proxy error', ...(isDev && { details: err.message }) });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    model: 'gemini-3.1-flash-image-preview',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: error.message });
});

app.listen(PORT, () => {
  console.log(`✅ African Interior Design API running on port ${PORT}`);
  console.log(`🤖 Model: gemini-3.1-flash-image-preview`);
  console.log(`📁 Uploads: http://localhost:${PORT}/uploads`);
  console.log(`🎨 Generated: http://localhost:${PORT}/generated`);
});
