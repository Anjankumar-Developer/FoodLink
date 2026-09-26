import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));

// Helper to initialize GoogleGenAI safely with aistudio-build telemetry
function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set. Please configure it in Settings > Secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. Audio Transcription endpoint using gemini-3.5-transcribe
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audio, mimeType = 'audio/webm' } = req.body;
    if (!audio) {
      return res.status(400).json({ error: 'Audio data (base64) is required.' });
    }

    const base64Audio = audio.includes('base64,') ? audio.split('base64,')[1] : audio;
    const ai = getAI();

    const audioPart = {
      inlineData: {
        mimeType: mimeType || 'audio/webm',
        data: base64Audio,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          audioPart,
          {
            text: 'Transcribe this spoken audio accurately and verbatim. If the speaker mentions food dishes, portion counts, storage conditions, temperatures, or pickup deadlines, make sure all numbers and items are clearly captured.',
          },
        ],
      },
    });

    res.json({
      text: response.text || '',
      transcription: response.text || '',
      modelUsed: 'gemini-3.5-transcribe',
    });
  } catch (error) {
    console.error('Audio transcription error:', error);
    res.status(500).json({
      error: error.message || 'Failed to transcribe audio using gemini-3.5-transcribe.',
    });
  }
});

// 2. Google Maps Grounding endpoint using gemini-3.5-flash with googleMaps tool
app.post('/api/maps-grounding', async (req, res) => {
  try {
    const { query, location } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required.' });
    }

    const ai = getAI();
    const config = {
      tools: [{ googleMaps: {} }],
    };

    if (location && location.latitude && location.longitude) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: Number(location.latitude),
            longitude: Number(location.longitude),
          },
        },
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: query,
      config,
    });

    const candidate = response.candidates?.[0];
    const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];

    // Extract place links and review snippets as required
    const places = [];
    groundingChunks.forEach((chunk) => {
      if (chunk.maps) {
        places.push({
          title: chunk.maps.title || 'Google Maps Location',
          uri: chunk.maps.uri || '',
          reviewSnippets: chunk.maps.placeAnswerSources?.reviewSnippets || [],
        });
      }
    });

    res.json({
      text: response.text || '',
      places,
      groundingChunks,
      modelUsed: 'gemini-3.5-flash',
    });
  } catch (error) {
    console.error('Google Maps grounding error:', error);
    res.status(500).json({
      error: error.message || 'Failed to retrieve Google Maps grounded information.',
    });
  }
});

// 3. Multi-turn Chatbot endpoint with system instruction and model routing
app.post('/api/chat', async (req, res) => {
  try {
    const {
      messages = [],
      model = 'gemini-3.5-flash',
      systemInstruction,
      useMaps = false,
      location,
    } = req.body;

    const ai = getAI();

    // Allowed models per requirements:
    // gemini-3.1-pro-preview for complex tasks
    // gemini-3.5-flash for general tasks
    // gemini-3.1-flash-lite for fast tasks
    const validModels = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview'];
    const chosenModel = validModels.includes(model) ? model : 'gemini-3.5-flash';

    const defaultSystemInstruction =
      'You are the FOODLINK AI Operations Assistant, an expert in food safety, HACCP regulations, emergency shelter distribution logistics, and cold-chain transport. Help users coordinate rescues, calculate food perishability, match surplus food with verified shelters, and troubleshoot routing issues.';

    const config = {
      systemInstruction: systemInstruction || defaultSystemInstruction,
    };

    if (useMaps) {
      config.tools = [{ googleMaps: {} }];
      if (location && location.latitude && location.longitude) {
        config.toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: Number(location.latitude),
              longitude: Number(location.longitude),
            },
          },
        };
      }
    }

    // Convert conversation history to Gemini contents format
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content || m.text || '' }],
    }));

    // If useMaps is true, must use gemini-3.5-flash as specified by requirements
    const activeModel = useMaps ? 'gemini-3.5-flash' : chosenModel;

    const response = await ai.models.generateContent({
      model: activeModel,
      contents,
      config,
    });

    const candidate = response.candidates?.[0];
    const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];

    const places = [];
    groundingChunks.forEach((chunk) => {
      if (chunk.maps) {
        places.push({
          title: chunk.maps.title || 'Google Maps Location',
          uri: chunk.maps.uri || '',
          reviewSnippets: chunk.maps.placeAnswerSources?.reviewSnippets || [],
        });
      }
    });

    res.json({
      text: response.text || '',
      groundingChunks,
      places,
      modelUsed: activeModel,
    });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({
      error: error.message || 'Failed to process chat conversation.',
    });
  }
});

// Mount Vite or serve built files
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist/index.html'));
  });
} else {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  ➜  Local:   http://localhost:${PORT}/`);
  console.log(`  ➜  Network: http://127.0.0.1:${PORT}/\n`);
});
