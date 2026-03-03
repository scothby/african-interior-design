const express = require('express');
const multer = require('multer');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { editBackgroundOnly } = require('./imageEditing');
const { createClient } = require('@supabase/supabase-js');
const Replicate = require('replicate');
require('dotenv').config();

const isDev = process.env.NODE_ENV !== 'production';

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials missing in .env');
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    // Autoriser les requêtes sans origine (ex : curl, Postman), ou si la liste ALLOWED_ORIGINS contient '*'
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`Origine non autorisée par CORS : ${origin}`));
  }
}));

// Limite la taille du payload JSON à 50 Mo pour autoriser les images base64 (inpainting mask)
app.use(express.json({ limit: '50mb' }));

app.use('/uploads', express.static('uploads'));
app.use('/generated', express.static('generated'));

// ── Auth Middleware ───────────────────────────────────────────────────────────
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant. Connectez-vous.' });
  }
  const token = authHeader.slice(7);
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Token invalide ou expiré.' });
    req.userId = user.id;
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Erreur de vérification du token.' });
  }
};


// Whitelist des préfixes de chemins autorisés sur le proxy Marble
const MARBLE_ALLOWED_PREFIXES = ['/world/', '/_next/', '/static/', '/favicon', '/api/'];

// Route proxy Marble (DÉFINIE AVANT TOUT RATE LIMITER)
app.use('/api/marble-proxy', async (req, res) => {
  const isAllowed = MARBLE_ALLOWED_PREFIXES.some(prefix => req.url.startsWith(prefix));
  if (!isAllowed) {
    return res.status(403).json({ error: 'Chemin non autorisé via le proxy' });
  }

  try {
    const targetUrl = 'https://marble.worldlabs.ai' + req.url;

    // Filtrer les headers sensibles ou conflictuels
    const proxyHeaders = { ...req.headers };
    delete proxyHeaders['host'];
    delete proxyHeaders['connection'];
    delete proxyHeaders['content-length'];

    // Forcer les bons headers pour Marble
    proxyHeaders['host'] = 'marble.worldlabs.ai';
    proxyHeaders['referer'] = 'https://marble.worldlabs.ai' + req.url;
    proxyHeaders['origin'] = 'https://marble.worldlabs.ai';
    proxyHeaders['WLT-Api-Key'] = WORLD_API_KEY;

    const axiosRes = await axios({
      method: req.method,
      url: targetUrl,
      headers: proxyHeaders,
      responseType: 'arraybuffer',
      timeout: 30000,
      maxRedirects: 5,
      validateStatus: () => true
    });

    // Passer les cookies de Marble vers le client
    if (axiosRes.headers['set-cookie']) {
      res.set('set-cookie', axiosRes.headers['set-cookie']);
    }

    // Copier les headers de réponse, sauf ceux qui bloquent l'iframe
    const skipHeaders = ['x-frame-options', 'content-security-policy', 'content-security-policy-report-only', 'transfer-encoding', 'connection', 'strict-transport-security'];
    for (const [key, value] of Object.entries(axiosRes.headers)) {
      if (!skipHeaders.includes(key.toLowerCase())) {
        res.set(key, value);
      }
    }

    // Pour les pages HTML : réécrire les URLs d'assets pour passer par notre proxy
    const contentType = (axiosRes.headers['content-type'] || '').toLowerCase();
    const isHtml = contentType.includes('text/html');
    const isJs = contentType.includes('application/javascript') || contentType.includes('text/javascript');

    if (isHtml || isJs) {
      let content = Buffer.from(axiosRes.data).toString('utf-8');

      // Réécrire les chemins absolus /xxx pour qu'ils passent par le proxy
      if (isHtml) {
        content = content.replace(/(["'(])\/(?!api\/marble-proxy\/)/g, '$1/api/marble-proxy/');
      }

      // Réécrire les URLs complètes marble.worldlabs.ai si présentes
      content = content.replace(/https:\/\/marble\.worldlabs\.ai/g, `${req.protocol}://${req.get('host')}/api/marble-proxy`);

      res.status(axiosRes.status).send(content);
    } else {
      res.status(axiosRes.status).send(Buffer.from(axiosRes.data));
    }
  } catch (err) {
    console.error('Marble proxy error:', err.message);
    res.status(502).json({ error: 'Proxy error', details: err.message });
  }
});


// ── Rate Limiting ────────────────────────────────────────────────────────────

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

// Constants for local fallback/cache directories
const UPLOADS_DIR = 'uploads';
const GENERATED_DIR = 'generated';

fs.ensureDirSync(UPLOADS_DIR);
fs.ensureDirSync(GENERATED_DIR);

// Multer storage config (keeping local cache for GenAI processing before upload)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, `${UPLOADS_DIR}/`),
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
    if (allowedTypes.test(path.extname(file.originalname).toLowerCase()) && allowedTypes.test(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-image-preview' });

// Upload endpoint
app.post('/api/upload', upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const filePath = req.file.path;
    const fileContent = await fs.readFile(filePath);
    const fileName = req.file.filename;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(`public/${fileName}`, fileContent, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(`public/${fileName}`);

    res.json({
      success: true,
      filename: fileName,
      path: publicUrlData.publicUrl, // return Supabase URL
      localPath: filePath,           // keep for Gemini processing
      originalName: req.file.originalname
    });
  } catch (err) {
    console.error('Supabase upload error:', err);
    res.status(500).json({ error: 'Upload to cloud failed', details: err.message });
  }
});

// Helpers for image generation
async function readImageAsBase64(imageRef) {
  // imageRef can be a URL or a local path.
  // Since we just uploaded it, it's safer/faster to read from local cache if available.
  let imagePath = imageRef;

  if (imageRef.startsWith('http')) {
    // If it's a URL, we need to download it or pass the URL if Gemini supports it.
    // For base64 encoding locally:
    const response = await axios.get(imageRef, { responseType: 'arraybuffer' });
    return Buffer.from(response.data, 'binary').toString('base64');
  }

  // Local fallback
  const safeFilename = path.basename(imagePath);
  const uploadsDir = path.resolve(__dirname, 'uploads');
  const resolvedPath = path.resolve(uploadsDir, safeFilename);

  if (!resolvedPath.startsWith(uploadsDir + path.sep)) {
    throw new Error('Accès interdit : chemin hors du répertoire autorisé');
  }

  const imageBuffer = await fs.readFile(resolvedPath);
  return imageBuffer.toString('base64');
}

function buildStylePrompt(style, customPrompt, mode) {
  const stylePrompt = style.prompt || `${style.name} interior design`;

  if (mode === 'background') {
    let prompt = `You are an expert interior design retoucher.
Transform ONLY the background of this room into ${stylePrompt}.
CRITICAL INSTRUCTION: You MUST strictly preserve the exact geometric structure, dimensions, and original shapes of the entire room, including all walls, architectural elements, and spatial proportions. Do NOT alter the size or geometry of the space under any circumstances.
Keep the main subject (any person, main sofa, bed, table or key furniture in the foreground) EXACTLY as in the original image: same shape, position and main colors.
Do NOT change faces, bodies, skin tone, clothing, or the main furniture piece. You may only make very light global lighting adjustments.
Change walls, floor, ceiling, windows, secondary furniture and decorative accessories to match the requested African interior style, but they must perfectly fit the original geometry.
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
CRITICAL INSTRUCTION: You MUST strictly preserve the exact geometric structure, dimensions, and original shapes of the entire room, including all walls, windows, doors, architectural elements, and spatial proportions. Do NOT alter the size, geometry, or the fundamental layout of the space under any circumstances.
Use these colors: ${style.colors?.join(', ') || 'warm African earth tones'}.
Materials: ${style.materials?.join(', ') || 'traditional African materials'}.
Patterns: ${style.patterns?.join(', ') || 'African geometric patterns'}.
Maintain the room layout and structure perfectly while completely transforming the style.
High quality architectural interior photography style, 4K, photorealistic.`;

  if (customPrompt && customPrompt.trim() !== '') {
    prompt += `\n\nUSER SPECIFIC INSTRUCTIONS (PRIORITIZE THESE HIGHEST):\n${customPrompt}`;
  }

  return prompt;
}

// Generate styled interior endpoint
app.post('/api/generate', verifyToken, async (req, res) => {
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

      if (!candidate.content || !candidate.content.parts) {
        console.error("Invalid Gemini response candidate:", JSON.stringify(candidate, null, 2));
        throw new Error('La génération a été bloquée (possiblement par le filtre de sécurité) ou la réponse est invalide.');
      }

      const parts = candidate.content.parts;

      const imagePart = parts.find(part => part.inlineData);

      if (!imagePart || !imagePart.inlineData) {
        throw new Error('No image data returned from Gemini API');
      }

      generatedImageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
    }
    const generatedFilename = `generated-${Date.now()}-${style.id}.png`;
    const generatedPath = path.join('generated', generatedFilename);

    // Save locally for cache/World Labs creation later
    await fs.writeFile(generatedPath, generatedImageBuffer);

    // Upload generated image to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('generated')
      .upload(`public/${generatedFilename}`, generatedImageBuffer, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) throw new Error("Supabase Storage error: " + uploadError.message);

    const { data: publicUrlData } = supabase.storage.from('generated').getPublicUrl(`public/${generatedFilename}`);
    const finalGeneratedUrl = publicUrlData.publicUrl;

    // Save to Supabase DB gallery
    const galleryId = `gallery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const { error: dbError } = await supabase.from('gallery').insert([{
      id: galleryId,
      original_image_url: originalImage,
      generated_image_url: finalGeneratedUrl,
      style_name: style.name || 'Unknown',
      style_family: style.family || '',
      style_id: style.id || '',
      prompt: enhancedPrompt,
      custom_prompt: customPrompt || null,
      mode: mode,
      is_favorite: false,
      user_id: req.userId
    }]);

    if (dbError) throw new Error("Supabase DB error: " + dbError.message);

    res.json({
      success: true,
      id: galleryId,
      originalImage: originalImage,
      generatedImage: finalGeneratedUrl,
      localGeneratedPath: `/generated/${generatedFilename}`, // Used for World Labs creation
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

// Initialize Replicate API
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Inpainting endpoint (Cultural Inpainting)
app.post('/api/inpaint', verifyToken, async (req, res) => {
  try {
    const { originalImage, maskImage, style, customPrompt } = req.body;

    if (!originalImage || !maskImage || !style) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return res.status(500).json({ error: 'Replicate API token not configured in .env' });
    }

    console.log('Generating inpainting for style:', style.name);

    let imageForReplicate = originalImage;
    if (!originalImage.startsWith('http') && !originalImage.startsWith('data:')) {
      // Convert local path to data URL if not http, but Replicate accepts URLs or data URIs
      const imageBase64 = await readImageAsBase64(originalImage);
      imageForReplicate = `data:image/png;base64,${imageBase64}`;
    } else {
      // Si c'est un lien http vers Supabase mais signé, Replicate pourrait avoir du mal. Mais les urls public/ sont ok.
      // On le laisse tel quel s'il commence par http
      if (originalImage.startsWith('http') && !originalImage.includes('localhost')) {
        imageForReplicate = originalImage;
      } else if (originalImage.startsWith('http') && originalImage.includes('localhost')) {
        // Local proxy, we need data URI
        const imageBase64 = await readImageAsBase64(originalImage.replace(`http://localhost:${PORT}/`, ''));
        imageForReplicate = `data:image/png;base64,${imageBase64}`;
      }
    }

    const stylePrompt = style.prompt || `${style.name} interior design`;
    let promptText = `Transform the masked area into ${stylePrompt}. 
Use these colors: ${style.colors?.join(', ') || 'warm African earth tones'}.
Materials: ${style.materials?.join(', ') || 'traditional African materials'}.
Patterns: ${style.patterns?.join(', ') || 'African geometric patterns'}.
The result must look photorealistic.`;

    if (customPrompt && customPrompt.trim() !== '') {
      promptText = `${customPrompt}, ${promptText}`;
    }

    // Call Replicate (using stability-ai/stable-diffusion-inpainting)
    const output = await replicate.run(
      "stability-ai/stable-diffusion-inpainting:95b7223104132402a9ae91cc677285bc5eb997834bd2349fa486f53910fd58bf",
      {
        input: {
          image: imageForReplicate,
          mask: maskImage,
          prompt: promptText,
          num_outputs: 1,
          guidance_scale: 7.5,
          num_inference_steps: 25
        }
      }
    );

    if (!output || output.length === 0) {
      throw new Error('No output from Replicate API');
    }

    const generatedImageUrl = output[0]; // Replicate returns an array of output URLs

    const response = await axios.get(generatedImageUrl, { responseType: 'arraybuffer' });
    const generatedImageBuffer = Buffer.from(response.data, 'binary');

    const generatedFilename = `inpaint-${Date.now()}-${style.id}.png`;
    const generatedPath = path.join('generated', generatedFilename);

    await fs.writeFile(generatedPath, generatedImageBuffer);

    // Upload generated image to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('generated')
      .upload(`public/${generatedFilename}`, generatedImageBuffer, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) throw new Error("Supabase Storage error: " + uploadError.message);

    const { data: publicUrlData } = supabase.storage.from('generated').getPublicUrl(`public/${generatedFilename}`);
    const finalGeneratedUrl = publicUrlData.publicUrl;

    // Save to Supabase DB gallery
    const galleryId = `gallery-inpaint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const { error: dbError } = await supabase.from('gallery').insert([{
      id: galleryId,
      original_image_url: originalImage,
      generated_image_url: finalGeneratedUrl,
      style_name: style.name || 'Unknown',
      style_family: style.family || '',
      style_id: style.id || '',
      prompt: promptText,
      custom_prompt: customPrompt || null,
      mode: 'inpaint',
      is_favorite: false,
      user_id: req.userId
    }]);

    if (dbError) throw new Error("Supabase DB error: " + dbError.message);

    res.json({
      success: true,
      id: galleryId,
      originalImage: originalImage,
      generatedImage: finalGeneratedUrl,
      localGeneratedPath: `/generated/${generatedFilename}`,
      style: style,
      prompt: promptText,
      mode: 'inpaint'
    });

  } catch (error) {
    console.error('Inpainting generation error:', error);
    res.status(500).json({
      error: 'Failed to generate inpainting',
      ...(isDev && { details: error.message })
    });
  }
});

// Get all styles endpoint
app.get('/api/styles', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase.from('styles').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    res.json({ styles: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new style
app.post('/api/styles', verifyToken, async (req, res) => {
  try {
    const { name, region, family, description, prompt, materials, colors, patterns, flag } = req.body;
    if (!name || !prompt) return res.status(400).json({ error: 'Name and Prompt are required' });

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

    const { error } = await supabase.from('styles').insert([newStyle]);
    if (error) throw error;

    res.status(201).json(newStyle);
  } catch (err) {
    console.error('Create style error:', err);
    res.status(500).json({ error: isDev ? err.message : 'Internal error' });
  }
});

// Update style
app.put('/api/styles/:id', verifyToken, async (req, res) => {
  try {
    const { error } = await supabase.from('styles')
      .update(req.body)
      .eq('id', req.params.id);

    if (error) throw error;

    // Fetch updated
    const { data } = await supabase.from('styles').select('*').eq('id', req.params.id).single();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete style
app.delete('/api/styles/:id', verifyToken, async (req, res) => {
  try {
    const { error } = await supabase.from('styles').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Gallery: list all entries (user's own only)
app.get('/api/gallery', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase.from('gallery').select('*').eq('user_id', req.userId).order('created_at', { ascending: false });
    if (error) throw error;

    // Map snake_case db columns to camelCase expected by frontend
    const mapped = data.map(entry => ({
      id: entry.id,
      originalImage: entry.original_image_url,
      generatedImage: entry.generated_image_url,
      styleName: entry.style_name,
      styleFamily: entry.style_family,
      styleId: entry.style_id,
      prompt: entry.prompt,
      customPrompt: entry.custom_prompt,
      mode: entry.mode,
      isFavorite: entry.is_favorite,
      worldUrl: entry.world_url,
      worldOperationId: entry.world_operation_id,
      createdAt: entry.created_at
    }));

    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Gallery: delete an entry
app.delete('/api/gallery/:id', verifyToken, async (req, res) => {
  try {
    const { data: entry } = await supabase.from('gallery').select('*').eq('id', req.params.id).single();
    if (!entry) return res.status(404).json({ error: 'Entry not found' });

    // Try to delete from storage if it exists on Supabase (optional hygiene)
    if (entry.generated_image_url && entry.generated_image_url.includes('supabase.co')) {
      const filename = entry.generated_image_url.split('/').pop();
      await supabase.storage.from('generated').remove([`public/${filename}`]);
    }

    const { error } = await supabase.from('gallery').delete().eq('id', req.params.id);
    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Gallery: save world URL to an entry
app.patch('/api/gallery/:id/world', verifyToken, async (req, res) => {
  try {
    const { worldUrl, worldOperationId } = req.body;
    let updates = {};
    if (worldUrl) updates.world_url = worldUrl;
    if (worldOperationId) updates.world_operation_id = worldOperationId;

    const { error } = await supabase.from('gallery').update(updates).eq('id', req.params.id);
    if (error) throw error;

    res.json({ success: true, worldUrl: worldUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Gallery: toggle favorite status
app.patch('/api/gallery/:id/favorite', verifyToken, async (req, res) => {
  try {
    const { data: entry } = await supabase.from('gallery').select('is_favorite').eq('id', req.params.id).single();
    if (!entry) return res.status(404).json({ error: 'Entry not found' });

    const newValue = !entry.is_favorite;
    const { error } = await supabase.from('gallery').update({ is_favorite: newValue }).eq('id', req.params.id);
    if (error) throw error;

    res.json({ success: true, isFavorite: newValue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create virtual world from generated image (World Labs / Marble)
app.post('/api/worlds/create', verifyToken, async (req, res) => {
  try {
    const { generatedImage, style, worldName } = req.body || {};

    if (!generatedImage) {
      return res.status(400).json({ error: 'Missing generatedImage path' });
    }

    if (!WORLD_API_KEY) {
      return res.status(500).json({ error: 'World Labs API key not configured' });
    }

    // Read the generated image
    let imageBuffer;
    let extension = '.png';
    let fileName = 'world-image.png';

    // Clean up potentially malformed URLs (e.g., if preceded by local paths)
    let cleanImageUrl = generatedImage;
    if (cleanImageUrl.includes('http')) {
      cleanImageUrl = cleanImageUrl.substring(cleanImageUrl.indexOf('http'));
      // Fix missing slashes after http:/ or https:/ if accidentally stripped
      cleanImageUrl = cleanImageUrl.replace(/:\/([^/])/, '://$1');
    }

    if (cleanImageUrl.startsWith('http')) {
      // Download from Supabase or other external URL
      const response = await axios.get(cleanImageUrl, { responseType: 'arraybuffer' });
      imageBuffer = Buffer.from(response.data, 'binary');
      fileName = cleanImageUrl.split('/').pop().split('?')[0] || 'world-image.png';
      extension = (path.extname(fileName) || '.png').replace('.', '') || 'png';
    } else {
      // Read from local disk
      const relativePath = generatedImage.replace(/^[/\\]+/, '');
      const imagePath = path.join(__dirname, relativePath);
      imageBuffer = await fs.promises.readFile(imagePath);
      extension = (path.extname(imagePath) || '.png').replace('.', '') || 'png';
      fileName = path.basename(imagePath);
    }

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
          public: true,
          share_link_enabled: true
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
    console.log('World Labs Generation Response:', JSON.stringify(operation, null, 2));
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
app.get('/api/worlds/status/:operationId', verifyToken, async (req, res) => {
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


// Export app for Vercel serverless
module.exports = app;

// Start local server only when not running in serverless environment
if (process.env.VERCEL !== '1' && require.main === module) {
  app.listen(PORT, () => {
    console.log(`✅ African Interior Design API running on port ${PORT}`);
    console.log(`🤖 Model: gemini-3.1-flash-image-preview`);
    console.log(`📁 Uploads: http://localhost:${PORT}/uploads`);
    console.log(`🎨 Generated: http://localhost:${PORT}/generated`);
  });
}
