const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const port = process.env.BACKEND_PORT || 3001;
const llamaServerUrl = process.env.LLAMA_SERVER_URL || 'http://llama_server:8080/v1/chat/completions';
const llamaApiKey = process.env.LLAMA_API_KEY;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (llamaApiKey) {
      headers['Authorization'] = `Bearer ${llamaApiKey}`;
    }

    const llamaHealth = await fetch(`${llamaServerUrl}/health`, { headers });
    
    res.json({
      status: 'healthy',
      backend: 'connected',
      llamaServer: llamaHealth.ok ? 'connected' : 'disconnected',
      llamaApiKey: llamaApiKey ? 'configured' : 'not configured',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      backend: 'connected',
      llamaServer: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Proxy endpoint for llama server
app.post('/api/llama', async (req, res) => {
  try {
    console.log('Received request to llama server:', req.body);
    
    const headers = {
      'Content-Type': 'application/json'
    };
    if (llamaApiKey) {
      headers['Authorization'] = `Bearer ${llamaApiKey}`;
    }

    const response = await fetch(llamaServerUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'qwen2.5-coder-7b',
        messages: [
          { role: 'system', content: req.body.systemMessage },
          { role: 'user', content: req.body.userMessage }
        ],
        temperature: 0.2,
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      throw new Error(`Llama server responded with status: ${response.status}`);
    }

    const data = await response.json();
    const move = data.choices[0]?.message?.content?.trim();
    
    if (!move) {
      throw new Error('No valid move received from Llama server');
    }

    res.json({ move });
  } catch (error) {
    console.error('Error proxying to llama server:', error);
    res.status(500).json({ 
      error: 'Failed to connect to llama server',
      message: error.message 
    });
  }
});

// Serve static files from the dist directory
app.use(express.static('dist'));

// Handle client-side routing - return index.html for all non-api requests
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile('index.html', { root: 'dist' });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
  console.log(`Llama server URL: ${llamaServerUrl}`);
});