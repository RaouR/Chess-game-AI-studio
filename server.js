import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const port = process.env.BACKEND_PORT || 3002;
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
    console.log('Received request to llama server:', {
      systemMessage: req.body.systemMessage?.substring(0, 50) + '...',
      userMessage: req.body.userMessage?.substring(0, 50) + '...'
    });
    
    if (!req.body.systemMessage || !req.body.userMessage) {
      throw new Error('Missing required fields: systemMessage and userMessage');
    }

    console.log('Connecting to Llama server at:', llamaServerUrl);
    
    const headers = {
      'Content-Type': 'application/json'
    };
    if (llamaApiKey) {
      headers['Authorization'] = `Bearer ${llamaApiKey}`;
      console.log('Using API key authentication');
    } else {
      console.log('No API key provided');
    }

    const requestBody = {
      model: 'qwen2.5-coder-7b',
      messages: [
        { role: 'system', content: req.body.systemMessage },
        { role: 'user', content: req.body.userMessage }
      ],
      temperature: 0.2,
      max_tokens: 10,
    };

    console.log('Sending request to Llama server with body:', {
      ...requestBody,
      messages: requestBody.messages.map(m => ({ ...m, content: m.content.substring(0, 50) + '...' }))
    });

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
    console.log('Received response from Llama server:', JSON.stringify(data, null, 2));

    // The response comes back as [Object] in the log, so let's explicitly log the message
    console.log('Raw message content:', JSON.stringify(data.choices?.[0]?.message, null, 2));
    
    const move = data.choices?.[0]?.message?.content?.trim();
    
    if (!move) {
      console.error('No move found in response:', JSON.stringify(data, null, 2));
      throw new Error('No valid move received from Llama server');
    }

    console.log('Successfully extracted move:', move);
    
    // Send a simplified response to the frontend
    res.json({ move });
  } catch (error) {
    console.error('Error proxying to llama server:', {
      error: error.message,
      stack: error.stack,
      llamaServerUrl,
      hasApiKey: !!llamaApiKey
    });
    
    res.status(500).json({ 
      error: 'Failed to connect to llama server',
      message: error.message,
      details: error instanceof Error ? error.stack : undefined
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