const axios = require('axios');

/**
 * Optional advanced background-only editing using external image editing APIs (e.g. Vertex AI Imagen).
 * Currently acts as a placeholder and returns null so that the caller can safely fall back
 * to the standard Gemini generateContent flow.
 *
 * When you are ready to plug in Imagen / Vertex:
 * - Use process.env.VERTEX_PROJECT_ID, process.env.VERTEX_LOCATION and service account auth
 * - Call the appropriate background replacement / inpainting endpoint with the provided imageBase64
 * - Return a Buffer containing the edited image data
 */
async function editBackgroundOnly({ imageBase64, stylePrompt }) {
  // Placeholder implementation: no-op, signal caller to use fallback.
  void axios; // keep import for future use
  void stylePrompt;
  void imageBase64;
  return null;
}

module.exports = {
  editBackgroundOnly,
};

