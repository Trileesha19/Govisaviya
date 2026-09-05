import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDatabase } from './database.js';
import { sanitizeInputMiddleware, apiLimiter, authLimiter } from './middleware/security.js';

import authRoutes from './routes/auth.js';
import listingsRoutes from './routes/listings.js';
import reservationsRoutes from './routes/reservations.js';
import statsRoutes from './routes/stats.js';
import reviewsRoutes from './routes/reviews.js';
import messagesRoutes from './routes/messages.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database schema
initDatabase();

// 1. Security HTTP Headers (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: false, // Allowed for embedded UI resources
    crossOriginEmbedderPolicy: false
  })
);

// 2. Strict Payload Size Caps (Mitigates Buffer Overflow DoS)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 3. CORS Configuration
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// 4. Input Sanitization (XSS & HTML Script Tag Stripping)
app.use(sanitizeInputMiddleware);

// 5. Rate Limiters
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// 6. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/messages', messagesRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Local Farmer-to-Buyer Marketplace API is running securely',
    timestamp: new Date().toISOString(),
    sdg: 'UN SDG 2: Zero Hunger',
    security: 'Helmet Enabled • Rate-Limited • XSS Sanitized'
  });
});

// Serve frontend build in production
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

app.get(/^(?!\/api).*/, (req, res) => {
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send('API Server is active. Frontend build not present yet.');
    }
  });
});

// 7. Global Secure Error Handler (Masks Stack Traces in Client Responses)
app.use((err, req, res, next) => {
  console.error('🔒 Internal Security Log:', err);
  
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Payload too large. Request exceeds 10kb limit.' });
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred. Please try again later.' 
      : (err.message || 'Internal Server Error')
  });
});

// Only start standalone HTTP listener when not running as a Vercel serverless function
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Secure Marketplace Server running at http://localhost:${PORT}`);
    console.log(`🌾 SDG 2 Zero Hunger API available at http://localhost:${PORT}/api/listings`);
  });
}

export default app;
