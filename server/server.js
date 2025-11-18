import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import facebookRoutes from './routes/facebook.js';

// Since we're using ES modules, __dirname is not available directly.
// We can create it using import.meta.url.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Cloud Run provides the PORT environment variable. We fall back to 3001 for local dev.
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// API routes are handled first and are prefixed with /api
app.use('/api/facebook', facebookRoutes);

// --- Static File Serving ---
// In production, serve the built frontend files from the 'dist' directory.
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// --- Catch-all for React Router ---
// For any request that doesn't match an API route or a static file,
// serve the index.html. This allows React Router to handle the routing on the client side.
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});


