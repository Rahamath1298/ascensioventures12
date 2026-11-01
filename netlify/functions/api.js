/**
 * Netlify Serverless Function Handler
 * Wraps the Express application using serverless-http to serve all /api/* endpoints on Netlify.
 */

import 'dotenv/config';
import serverless from 'serverless-http';
import app from '../../server.js';

export const handler = serverless(app);
