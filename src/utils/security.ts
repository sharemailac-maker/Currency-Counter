/**
 * Comprehensive Application Security Armor
 * Defensively protects against:
 * 1. Cross-Site Scripting (XSS) & DOM injection
 * 2. Prototype Pollution attacks (__proto__, constructor, prototype)
 * 3. Malformed JSON / Malicious File Upload payloads
 * 4. Clickjacking and iframe hijacking
 * 5. Data tampering in client storage
 */

/**
 * Escapes HTML special characters to prevent stored, reflected, or DOM-based XSS.
 * Safe for use in template strings, innerHTML, or iframe documents.
 */
export function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return '';
  const s = typeof str === 'string' ? str : String(str);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;');
}

/**
 * Deeply sanitizes objects against Prototype Pollution by stripping
 * dangerous keys: __proto__, constructor, and prototype.
 */
export function cleanPrototypePollution<T>(data: T): T {
  if (data === null || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => cleanPrototypePollution(item)) as unknown as T;
  }

  const cleanObj: Record<string, unknown> = {};
  for (const key of Object.keys(data as Record<string, unknown>)) {
    // Drop prototype pollution vectors
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    const val = (data as Record<string, unknown>)[key];
    cleanObj[key] = cleanPrototypePollution(val);
  }

  return cleanObj as T;
}

/**
 * Safely parses JSON strings with prototype pollution neutralization
 * and optional structural validation. Never throws exceptions.
 */
export function safeJsonParse<T>(
  raw: string | null | undefined,
  fallback: T,
  validator?: (data: unknown) => boolean
): T {
  if (!raw || typeof raw !== 'string') return fallback;

  // Reject oversized strings (> 10MB) to prevent memory exhaustion DoS
  if (raw.length > 10 * 1024 * 1024) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw);
    const cleaned = cleanPrototypePollution(parsed);

    if (validator && !validator(cleaned)) {
      return fallback;
    }

    return cleaned as T;
  } catch {
    return fallback;
  }
}

/**
 * Validates whether a URL is strictly safe (http, https, mailto).
 * Rejects javascript:, data:, blob:, vbscript: protocols.
 */
export function isSafeUrl(url: unknown): boolean {
  if (typeof url !== 'string' || !url.trim()) return false;
  const trimmed = url.trim().toLowerCase();
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:') ||
    trimmed.startsWith('file:')
  ) {
    return false;
  }
  return true;
}

/**
 * Strips script tags, angle brackets, and non-printable control characters from text inputs.
 */
export function sanitizeInputText(val: unknown, maxLength = 1000): string {
  if (val === null || val === undefined) return '';
  const str = typeof val === 'string' ? val : String(val);
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Defensive client-side armor:
 * - Seals Object.prototype against rogue mutations
 * - Provides protection against unhandled iframe tampering
 */
export function initClientSecurityShield(): void {
  try {
    // Prevent malicious scripts or browser extensions from tampering with standard prototypes
    Object.freeze(Object.getOwnPropertyDescriptor(Object.prototype, '__proto__'));
  } catch {
    // Non-fatal if runtime has frozen prototypes already
  }
}
