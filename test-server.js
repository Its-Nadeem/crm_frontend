import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Proxy /api requests to the backend
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:5000',
  changeOrigin: true,
  pathRewrite: (path) => '/api' + path,
  logLevel: 'debug'
}));

// Serve static files from dist
app.use(express.static(path.join(__dirname, 'dist')));

// Catch all handler: send back index.html for client-side routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = 4173; // Same as vite preview default
app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log('API calls to /api/* will be proxied to http://localhost:5000');
});