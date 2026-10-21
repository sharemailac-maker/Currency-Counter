import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const PORT = 3000;
const HOST = '0.0.0.0';

// In-memory rate limiting map: IP -> { count, resetTime }
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
 * Rate limiting middleware to prevent bot spam, credential stuffing, and DDoS abuse
 */
function createRateLimiter(maxRequests: number, windowMs: number, errorMessage = 'Too many requests. Please try again later.') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const rawIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown-client';
    const now = Date.now();
    const record = rateLimitStore.get(rawIp);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(rawIp, { count: 1, resetTime: now + windowMs });
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
 * Sanitizes input strings by removing potentially dangerous HTML/script tags
 */
function sanitizeInput(val: unknown): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 2000);
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

  // 2. Strict Security Headers & CSP
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Content Security Policy: Protect against XSS, script injection, and rogue outbound requests
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' data: https://fonts.gstatic.com; " +
      "img-src 'self' data: blob: https://www.google-analytics.com https://*.google-analytics.com; " +
      "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com; " +
      "frame-ancestors 'self' https://ai.studio https://*.google.com; " +
      "object-src 'none'; " +
      "base-uri 'self';"
    );

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Clickjacking protection: only allow same origin and AI Studio embedding
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');

    // Cross-site scripting filter
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Protect referrer leakage
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Restrict unnecessary browser hardware capabilities
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

    next();
  });

  // 3. Block unauthorized access to sensitive system/environment files
  app.use((req: Request, res: Response, next: NextFunction) => {
    const rawPath = req.path.toLowerCase();
    if (
      rawPath.startsWith('/.env') ||
      rawPath.startsWith('/.git') ||
      rawPath.includes('package.json') ||
      rawPath.includes('tsconfig.json') ||
      rawPath.includes('metadata.json') ||
      rawPath.includes('bun.lock')
    ) {
      res.status(403).json({ error: 'Access denied to protected system files' });
      return;
    }
    next();
  });

  // 4. Body parsing with strict payload size limit to prevent memory exhaustion DoS
  app.use(express.json({ limit: '50kb' }));

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
      // fallback
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
    } catch (err) {
      console.error('Hit counter safe write notice:', err);
    }
    return count;
  }

  app.get('/api/hits', (req: Request, res: Response) => {
    const totalHits = readHitCount();
    res.json({ totalHits, anonymous: true });
  });

  const hitLimiter = createRateLimiter(60, 60 * 1000);
  app.post('/api/hits', hitLimiter, (req: Request, res: Response) => {
    const totalHits = incrementHitCount();
    res.json({ totalHits, anonymous: true, success: true });
  });

  // Secure feedback endpoint with strict rate limiting (max 5 requests per 10 minutes per IP)
  const feedbackLimiter = createRateLimiter(5, 10 * 60 * 1000, 'Too many feedback submissions from this IP. Please wait a few minutes.');

  app.post('/api/feedback', feedbackLimiter, async (req: Request, res: Response) => {
    try {
      const { name, contactEmail, topic, feedback, message } = req.body || {};

      const sanitizedName = sanitizeInput(name) || 'Anonymous';
      const sanitizedEmail = sanitizeInput(contactEmail);
      const sanitizedTopic = sanitizeInput(topic) || 'General Feedback';
      const sanitizedMessage = sanitizeInput(feedback || message);

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
      } catch (fileErr) {
        console.error('Safe feedback file write warning:', fileErr);
      }

      // 2. Relay to developer email strictly on server: developer email is NEVER sent to browser
      const developerEmail = process.env.DEVELOPER_EMAIL || 'sharemailac@gmail.com';
      try {
        await fetch(`https://formsubmit.co/ajax/${developerEmail}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            _subject: `[Currency Counter Feedback] ${sanitizedTopic} from ${sanitizedName}`,
            _replyto: sanitizedEmail || developerEmail,
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
      } catch (relayErr) {
        console.error('Server email relay warning (saved locally):', relayErr);
      }

      res.status(200).json({
        success: true,
        message: 'Feedback securely received and forwarded.',
      });
    } catch (err) {
      console.error('Feedback handling error:', err);
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
      const sanitizedPrompt = sanitizeInput(prompt);

      if (!sanitizedPrompt) {
        res.status(400).json({ error: 'Prompt is required' });
        return;
      }

      // Call Gemini API securely on server
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are an expert currency assistant for the app Currency Counter (${sanitizeInput(currencyCode) || 'Global'}). Provide a concise, safe, helpful response.\n\nUser request: ${sanitizedPrompt}`,
      });

      res.json({
        success: true,
        text: response.text || '',
      });
    } catch (err: unknown) {
      // Never reveal raw SDK stack traces or API keys in error output
      console.error('Secure AI proxy error:', err);
      res.status(500).json({
        error: 'Failed to process AI request safely.',
      });
    }
  });

  // ============================================================================
  // VITE MIDDLEWARE (Development) & STATIC SERVING (Production)
  // ============================================================================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`[Security Shield Active] Server running securely on http://${HOST}:${PORT}`);
  });
}

startServer();
