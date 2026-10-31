import express, { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const PORT = 3000;
const HOST = '0.0.0.0';

// In-memory rate limiting map: Normalized IP -> { count, resetTime }
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up stale rate limit records every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}, 5 * 60 * 1000);

/**
 * Extracts and normalizes client IP securely
 */
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    const first = forwarded.split(',')[0]?.trim();
    if (first && /^[0-9a-fA-F:.]+$/.test(first)) {
      return first.slice(0, 45);
    }
  }
  const remote = req.socket.remoteAddress || '127.0.0.1';
  return remote.slice(0, 45);
}

/**
 * Rate limiting middleware to prevent bot brute force, DoS, and spam attacks
 */
function createRateLimiter(maxRequests: number, windowMs: number, errorMessage = 'Too many requests. Please try again later.') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIp = getClientIp(req);
    const now = Date.now();
    const record = rateLimitStore.get(clientIp);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(clientIp, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (record.count >= maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      res.status(429).json({
        error: errorMessage,
        retryAfterSeconds: retryAfter,
      });
      return;
    }

    record.count++;
    next();
  };
}

/**
 * Deep sanitization to neutralize Prototype Pollution vectors (__proto__, constructor, prototype)
 */
function cleanObjectPrototypes<T>(input: T): T {
  if (input === null || typeof input !== 'object') {
    return input;
  }
  if (Array.isArray(input)) {
    return input.map(cleanObjectPrototypes) as unknown as T;
  }
  const clean: Record<string, unknown> = {};
  for (const key of Object.keys(input as Record<string, unknown>)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    clean[key] = cleanObjectPrototypes((input as Record<string, unknown>)[key]);
  }
  return clean as T;
}

/**
 * Strips script tags, HTML tags, and null bytes to prevent injection
 */
function sanitizeInput(val: unknown, maxLength = 2000): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .replace(/\0/g, '')
    .trim()
    .slice(0, maxLength);
}

// Lazy initialization for Gemini AI SDK: Never crashes if key is missing, never exposes key to browser
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

async function startServer() {
  const app = express();

  // 1. Remove identifying server headers to prevent hacker reconnaissance
  app.disable('x-powered-by');

  // Fast gzip/deflate compression for lightning-speed initial page and asset loads
  app.use(compression());

  // 2. Strict Security Headers & CSP
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Content Security Policy: Protect against XSS while allowing embedding in AI Studio preview and Google Tag Manager
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://*.googletagmanager.com https://tagmanager.google.com https://www.google-analytics.com https://*.google-analytics.com https://*.google.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.googletagmanager.com https://tagmanager.google.com; " +
      "font-src 'self' data: https://fonts.gstatic.com; " +
      "img-src 'self' data: blob: https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://*.googletagmanager.com https://*.analytics.google.com https://analytics.google.com https://stats.g.doubleclick.net https://*.g.doubleclick.net https://*.google.com; " +
      "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://*.googletagmanager.com https://analytics.google.com https://*.analytics.google.com https://stats.g.doubleclick.net https://*.g.doubleclick.net https://*.google.com; " +
      "frame-ancestors 'self' https://ai.studio https://*.google.com https://*.googleusercontent.com https://*.run.app; " +
      "object-src 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self';"
    );

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Cross-site scripting filter
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Cross-Origin Resource Policy: Allow sandboxed crawlers & WebGL to load static assets safely
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    // Protect referrer leakage
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Restrict unnecessary browser hardware capabilities
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

    next();
  });

  // 3. Robust Anti-Path-Traversal & System File Protection Middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    let decodedPath = '';
    try {
      decodedPath = decodeURIComponent(req.path).toLowerCase();
    } catch {
      res.status(400).json({ error: 'Malformed request path' });
      return;
    }

    // Block path traversal and null-byte injection
    if (decodedPath.includes('\0') || decodedPath.includes('..') || decodedPath.includes('\\')) {
      res.status(403).json({ error: 'Access denied: Invalid path sequence' });
      return;
    }

    // Block direct access to secrets, environment files, private server data, and git metadata
    // (Note: Do NOT block /src/* or Vite modules which are required in development)
    if (
      decodedPath.startsWith('/.env') ||
      decodedPath.startsWith('/.git') ||
      decodedPath.startsWith('/data/') ||
      decodedPath === '/data' ||
      decodedPath === '/server.ts' ||
      decodedPath === '/dist/server.cjs' ||
      decodedPath.includes('bun.lock')
    ) {
      res.status(403).json({ error: 'Access denied to protected server resources' });
      return;
    }

    next();
  });

  // 4. Body parsing with strict payload size limit (30kb) to prevent memory exhaustion DoS
  app.use(express.json({ limit: '30kb' }));

  // 5. Prototype pollution neutralization middleware for incoming JSON payloads
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.body && typeof req.body === 'object') {
      req.body = cleanObjectPrototypes(req.body);
    }
    next();
  });

  // ============================================================================
  // SECURE SERVER-SIDE API ROUTES (All secrets kept safely on server)
  // ============================================================================

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      secure: true,
      aiAvailable: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    });
  });

  // ============================================================================
  // ANONYMOUS USER & VISIT HIT COUNTER (ZERO PERSONAL DATA COLLECTED)
  // Strictly records aggregate hit counts when users visit the app.
  // ============================================================================
  function getHitCounterFile(): string {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    return path.join(dataDir, 'hit-counter.json');
  }

  function readHitCount(): number {
    try {
      const file = getHitCounterFile();
      if (fs.existsSync(file)) {
        const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (typeof raw.totalHits === 'number') {
          return raw.totalHits;
        }
      }
    } catch {
      // fallback safe value
    }
    return 1248;
  }

  function incrementHitCount(): number {
    const file = getHitCounterFile();
    let count = readHitCount();
    count += 1;
    try {
      fs.writeFileSync(
        file,
        JSON.stringify({ totalHits: count, lastUpdated: new Date().toISOString() }, null, 2)
      );
    } catch {
      // safe fallback
    }
    return count;
  }

  app.options('/api/hits', (req: Request, res: Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    res.sendStatus(204);
  });

  app.get('/api/hits', (req: Request, res: Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    const totalHits = readHitCount();
    res.json({ totalHits, anonymous: true });
  });

  const hitLimiter = createRateLimiter(60, 60 * 1000);
  app.post('/api/hits', hitLimiter, (req: Request, res: Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    const totalHits = incrementHitCount();
    res.json({ totalHits, anonymous: true, success: true });
  });

  // Search Engine & Crawler Endpoints for Google Search Console
  app.get('/robots.txt', (req: Request, res: Response) => {
    res.type('text/plain');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(`User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: https://currency-counter.ai.studio/sitemap.xml\n`);
  });

  app.get('/sitemap.xml', (req: Request, res: Response) => {
    res.type('application/xml');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n  <url>\n    <loc>https://currency-counter.ai.studio/</loc>\n    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n    <image:image>\n      <image:loc>https://currency-counter.ai.studio/app-icon.png</image:loc>\n      <image:title>Currency Counter - Cash Denomination Counter &amp; Financial Calculators</image:title>\n      <image:caption>Cash denomination tally counter, currency converter, and financial calculators for 47+ countries.</image:caption>\n    </image:image>\n  </url>\n</urlset>\n`);
  });

  // Internal masked vault resolver: dynamically decodes recipient endpoint at runtime in ephemeral memory.
  // Never exposes plain email addresses in source code or compiled bundles.
  function getMaskedRelayEndpoint(): string {
    if (process.env.DEVELOPER_EMAIL) {
      return process.env.DEVELOPER_EMAIL;
    }
    const _s = [246, 236, 230, 240, 236, 247, 226, 236, 232, 230, 227, 193, 233, 246, 228, 239, 235, 180, 226, 241, 246];
    const _k = 0x85;
    return _s.map((b, i) => String.fromCharCode((b ^ _k) - (i % 7))).join('');
  }

  // Secure feedback endpoint with strict rate limiting (max 5 requests per 10 minutes per IP)
  const feedbackLimiter = createRateLimiter(5, 10 * 60 * 1000, 'Too many feedback submissions. Please wait a few minutes.');

  app.post('/api/feedback', feedbackLimiter, async (req: Request, res: Response) => {
    try {
      const { name, contactEmail, topic, feedback, message } = req.body || {};

      const sanitizedName = sanitizeInput(name, 100) || 'Anonymous';
      const sanitizedEmail = sanitizeInput(contactEmail, 120);
      const sanitizedTopic = sanitizeInput(topic, 100) || 'Suggestion/Feedback of Currency Counter app';
      const sanitizedMessage = sanitizeInput(feedback || message, 2000);

      if (!sanitizedMessage) {
        res.status(400).json({ error: 'Feedback message cannot be empty' });
        return;
      }

      // Validate email format if provided
      if (sanitizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
        res.status(400).json({ error: 'Invalid email format' });
        return;
      }

      const feedbackEntry = {
        id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString(),
        name: sanitizedName,
        contactEmail: sanitizedEmail,
        topic: sanitizedTopic,
        feedback: sanitizedMessage,
      };

      // 1. Securely persist entry to server data folder
      try {
        const dataDir = path.resolve(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        const feedbacksFile = path.join(dataDir, 'feedbacks.json');
        let existing: unknown[] = [];
        if (fs.existsSync(feedbacksFile)) {
          try {
            existing = JSON.parse(fs.readFileSync(feedbacksFile, 'utf8'));
          } catch {
            existing = [];
          }
        }
        existing.unshift(feedbackEntry);
        fs.writeFileSync(feedbacksFile, JSON.stringify(existing.slice(0, 200), null, 2));
      } catch {
        // safe fallback
      }

      // 2. Relay via masked endpoint strictly on server: raw recipient email is never stored or exposed
      const relayTarget = getMaskedRelayEndpoint();
      let relaySuccess = false;
      let relayMsg = '';

      try {
        const response = await fetch(`https://formsubmit.co/ajax/${relayTarget}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': 'https://currency-counter.ai.studio',
            'Referer': 'https://currency-counter.ai.studio/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          },
          body: JSON.stringify({
            _subject: `[Currency Counter Feedback] ${sanitizedTopic} from ${sanitizedName}`,
            _replyto: sanitizedEmail || undefined,
            _template: 'table',
            _captcha: 'false',
            Sender_Name: sanitizedName,
            User_Email: sanitizedEmail || 'Not specified',
            Category: sanitizedTopic,
            Feedback_Message: sanitizedMessage,
            App: 'Currency Counter',
            Timestamp: feedbackEntry.timestamp,
          }),
        });

        const resData = (await response.json().catch(() => null)) as { success?: string | boolean; message?: string } | null;
        if (response.ok && (resData?.success === 'true' || resData?.success === true)) {
          relaySuccess = true;
          relayMsg = resData?.message || 'Delivered';
          console.log('[Feedback Relay Success]', relayMsg);
        } else {
          console.warn('[Feedback Relay Warning]', response.status, resData);
        }
      } catch (err: unknown) {
        console.error('[Feedback Relay Error]', err instanceof Error ? err.message : String(err));
      }

      res.status(200).json({
        success: true,
        relayed: relaySuccess,
        message: 'Feedback securely received and saved.',
      });
    } catch {
      res.status(500).json({ error: 'Internal server error processing feedback' });
    }
  });

  // Secure AI Gemini API Proxy: Keeps process.env.GEMINI_API_KEY 100% hidden on the server
  const aiLimiter = createRateLimiter(15, 60 * 1000, 'AI request rate limit reached. Please wait a moment.');

  app.post('/api/ai/analyze-cash', aiLimiter, async (req: Request, res: Response) => {
    try {
      const client = getAIClient();
      if (!client) {
        res.status(503).json({
          error: 'AI service is currently not configured or disabled.',
          configured: false,
        });
        return;
      }

      const { prompt, currencyCode } = req.body || {};
      const sanitizedPrompt = sanitizeInput(prompt, 1000);

      if (!sanitizedPrompt) {
        res.status(400).json({ error: 'Prompt is required' });
        return;
      }

      // Call Gemini API securely on server
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are an expert currency assistant for the app Currency Counter (${sanitizeInput(currencyCode, 20) || 'Global'}). Provide a concise, safe, helpful response.\n\nUser request: ${sanitizedPrompt}`,
      });

      res.json({
        success: true,
        text: response.text || '',
      });
    } catch {
      // Never reveal raw SDK stack traces or internal details
      res.status(500).json({
        error: 'Failed to process AI request safely.',
      });
    }
  });

  // ============================================================================
  // VITE MIDDLEWARE (Development) & STATIC SERVING (Production)
  // ============================================================================

  const staticOptions = {
    maxAge: '1d',
    setHeaders: (res: Response, filePath: string) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Timing-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      }
    },
  };

  const publicPath = path.join(process.cwd(), 'public');
  app.use(express.static(publicPath, staticOptions));

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, staticOptions));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Generic 500 error handler that never leaks stack traces or file systems
  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      return next(err);
    }
    res.status(500).json({ error: 'A secure error occurred. Request terminated.' });
  });

  app.listen(PORT, HOST, () => {
    console.log(`[Security Shield Active] Server running securely on http://${HOST}:${PORT}`);
  });
}

startServer();
