/**
 * Resilient JSON data loader for local and serverless/Netlify environments.
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const currentDir = typeof __dirname !== 'undefined'
  ? __dirname
  : (typeof import.meta !== 'undefined' && import.meta?.url ? dirname(fileURLToPath(import.meta.url)) : process.cwd());

/**
 * Loads JSON data from disk with multi-path fallback for serverless bundles.
 * @param {string} filename - e.g. 'packages.json' or 'destinations.json'
 * @returns {Array} Parsed JSON array or empty array on error
 */
export function loadJsonData(filename) {
  const candidatePaths = [
    join(process.cwd(), 'data', filename),
    join(currentDir, '../../data', filename),
    join(currentDir, '../data', filename),
    join(currentDir, 'data', filename),
    join(process.cwd(), 'src/data', filename)
  ];

  for (const candidate of candidatePaths) {
    try {
      if (existsSync(candidate)) {
        return JSON.parse(readFileSync(candidate, 'utf8'));
      }
    } catch (e) {
      // Continue to next candidate
    }
  }

  // Final direct attempt
  try {
    const fallbackPath = join(__dirname, '../../data', filename);
    return JSON.parse(readFileSync(fallbackPath, 'utf8'));
  } catch (e) {
    return [];
  }
}
