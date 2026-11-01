/**
 * Main application server.
 * Express server providing static asset hosting and travel package search APIs.
 * Supports both standalone Node.js and Netlify Serverless Functions.
 */

import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import searchRouter from './src/routes/search.js';
import { isAiConfigured, getApiKey } from './src/ai/client.js';
import { info as logInfo } from './src/utils/logger.js';

const currentDir = typeof __dirname !== 'undefined'
  ? __dirname
  : (typeof import.meta !== 'undefined' && import.meta?.url ? dirname(fileURLToPath(import.meta.url)) : process.cwd());

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const AI_MODEL = process.env.AI_MODEL || 'llama-3.3-70b-versatile';

// Middleware
app.use(express.json());
app.use(express.static(join(currentDir, 'public')));

// Example queries for hero search placeholder rotation and chips
const EXAMPLE_QUERIES = [
  '3 day industrial visit for 60 mechanical students to Coimbatore in August, budget 4500 per head',
  'school trip for 40 class 8 students to Ooty, 2 days',
  'college trip to Goa for 25 people',
  'vacation to Manali',
  '3-day automobile engineering tour to Pune for 50 students',
  '4-day tech innovation visit to Bengaluru for 30 students'
];

// Unified API Router for local Express, Netlify redirects, and direct function invocations
const apiRouter = express.Router();

// Health check endpoint conforming to master prompt contract and deployment diagnostics
apiRouter.get('/health', (req, res) => {
  const configured = isAiConfigured();
  const rawKey = getApiKey();
  const maskedKey = rawKey ? `${rawKey.slice(0, 4)}...${rawKey.slice(-4)}` : null;
  const envKeysFound = Object.keys(process.env).filter(k => 
    k.toUpperCase().includes('KEY') || 
    k.toUpperCase().includes('AI') || 
    k.toUpperCase().includes('GROQ') || 
    k.toUpperCase().includes('TOKEN')
  );

  res.json({
    ok: true,
    ai: configured ? 'configured' : 'rules_only',
    model: AI_MODEL,
    keyDetected: configured,
    maskedKey,
    matchingEnvNamesFound: envKeysFound
  });
});

// Examples endpoint for client-side placeholder rotating
apiRouter.get('/examples', (req, res) => {
  res.json(EXAMPLE_QUERIES);
});

// Contact form submission endpoint
apiRouter.post('/contact', (req, res) => {
  const { name, email, phone, tripType, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, error: 'Name, email, and message are required.' });
  }
  logInfo('Contact form submission received', { name, email, phone, tripType, messageLength: message.length });
  res.json({
    ok: true,
    message: 'Your inquiry has been successfully received. Our travel specialist will be in touch shortly.'
  });
});

// Search routes
apiRouter.use(searchRouter);

// Mount API router across standard path aliases for local and Netlify serverless routing
app.use('/api', apiRouter);
app.use('/.netlify/functions/api', apiRouter);
app.use('/', apiRouter);

// Start standalone server only when executed directly (node server.js), not when imported by Netlify functions
const isDirectRun = Boolean(
  process.argv[1] &&
  !process.env.NETLIFY &&
  !process.env.AWS_LAMBDA_FUNCTION_NAME &&
  !process.env.LAMBDA_TASK_ROOT &&
  process.argv[1].endsWith('server.js')
);

if (isDirectRun && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    const aiReady = isAiConfigured();
    if (aiReady) {
      logInfo('Trip Package Search server started', { port: PORT, aiConfigured: true, model: AI_MODEL });
    } else {
      logInfo('AI disabled — running in rules-only mode', { port: PORT, aiConfigured: false });
    }
  });
}

export default app;
