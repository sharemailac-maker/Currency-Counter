# Security Summary

**Reviewed Files**: 14
**Issues Resolved**: 6

### Issues Resolved
| Area | File | Line | What Was Happening | Impact | Status | How It Was Fixed |
|---|---|---|---|---|---|---|
| Client-Trusted Counter Inflation & Unbounded Rate Limit | `server.ts` | 330 | `POST /api/hits` accepted client-supplied `clientKnownCount` offsets up to +999 per call and lacked per-route rate limiting, while rate-limit sweeps cleared active IP blocks globally when oversized. | Medium | Fixed | Removed `clientKnownCount` trust so every accepted request increments by strictly `+1`, added scoped `hitsWriteLimiter` (30/min) and global `/api` limiter (120/min), and switched eviction to delete expired or oldest keys only. |
| Blocking Sync Disk I/O Under High Traffic | `server.ts` | 269 | `/api/hits` and `/api/feedback` used synchronous `fs.readFileSync`/`fs.writeFileSync` per request, and outbound feedback relay `fetch` had no timeout. | High | Fixed | Served `/api/hits` directly from memory in O(1) with debounced atomic temp-file writes, serialized async feedback writes via a promise queue, added a 5s `AbortSignal.timeout`, and cached production `index.html` in RAM. |
| Reverse-Proxy IP Resolution | `server.ts` | 43 | Raw `X-Forwarded-For` header parsing could trust spoofed proxy headers when unconfigured behind a load balancer. | High | Fixed | Configured `app.set('trust proxy', 1)` and validated resolved `req.ip` addresses with Node's built-in `net.isIP()`. |
| Print Quotation HTML Escaping | `src/components/ConversionView.tsx` | 242 | `handlePrintQuote()` wrote dynamic country, currency, and fee strings directly into an unsandboxed print iframe without HTML escaping. | Medium | Fixed | Added `escapeHtml()` escaping on all interpolated values and restricted the print iframe with `sandbox="allow-same-origin allow-modals"`. |
| Print Slip Script Guard | `src/components/BreakdownModal.tsx` | 143 | Printable slip markup copied into the print iframe had no explicit iframe `sandbox` attribute or `<script>` strip defense-in-depth. | Low | Fixed | Added `sandbox="allow-same-origin allow-modals"` on the print iframe and stripped any `<script>` blocks before writing to `frameDoc`. |
| Outdated Dependencies & Unused Build Plugin | `package.json` | 21 | `vite-plugin-pwa` (unused in codebase), `express`, `body-parser`, `proxy-addr`, `source-map-js`, and `vite` carried known security advisories. | High | Fixed | Removed unused `vite-plugin-pwa`, upgraded `express` (`4.22.2`), `body-parser` (`1.20.9`), `proxy-addr` (`2.0.8`), `source-map-js` (`1.2.2`), `vite` (`6.4.4`), and re-audited with `bun audit`. |

### Safeguards Verified
| Area | File | How It's Protected |
|---|---|---|
| API Keys & Secrets | `server.ts` | `GEMINI_API_KEY` is read strictly on the server via `process.env` and never bundled into Vite client assets. |
| Path Traversal & Protected Files | `server.ts` | Decodes paths with URI-error handling, rejects `..`, `\`, null bytes, non-standard HTTP methods, and blocks `.env`, `.git`, `/data`, `server.ts`, `package.json`, and lockfiles with `403`. |
| Prototype Pollution Defense | `server.ts` | Incoming JSON payloads (capped at `30kb`) are recursively copied into null-prototype objects stripping `__proto__`, `constructor`, and `prototype`. |
| Security Headers & CSP | `server.ts` | Sets `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, and disables `X-Powered-By`. |
| Safe External Links & Data Validation | `src/utils/security.ts`, `src/components/ShareAppModal.tsx` | Validates JSON storage reads with `safeJsonParse`, constrains numbers via `safeNumber`, and uses `rel="noopener noreferrer"` anchors without `window.open`. |

## PoC Verification

### Counter Spoofing & Traffic Spike Blocking I/O

#### Summary
| Field | Value |
|---|---|
| Issue Type | Unvalidated Client Counter Offset & Synchronous Disk Blocking |
| Impact | High |
| Affected File | `server.ts:330` |
| Test Scenario | Burst of concurrent `POST /api/hits` requests carrying `{"clientKnownCount": 9999999}` and >30 rapid POSTs from the same client IP |

#### How It Was Fixed
Removed support for client-supplied count offsets in `POST /api/hits`, served counter reads/writes from in-memory state persisted asynchronously via a 2-second debounced atomic rename, and added a dedicated `hitsWriteLimiter` (30 requests/minute per IP) backed by `trust proxy` IP validation.

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | `POST /api/hits` arrives with `{"clientKnownCount": 9999999}` | Enters Express JSON parser (30kb limit) and prototype sanitizer (`server.ts:233-241`) |
| 2 | Passes through `globalApiLimiter` (`server.ts:247`) and `hitsWriteLimiter` (`server.ts:330`) using `net.isIP`-validated `req.ip` | Requests beyond 30/min receive HTTP `429` with `Retry-After` |
| 3 | Handler ignores `req.body.clientKnownCount`, executes `memoryHitCount += 1`, calls `scheduleHitCounterFlush()`, and responds immediately | **Handled Safely** (`totalHits` increments strictly by 1 with O(1) latency and non-blocking disk flush) |

#### Conclusion
**Fix Verified** - Client count spoofing is ignored and rapid traffic bursts are served cleanly from memory behind per-IP rate limiting without blocking the server event loop.

### Print Quotation Iframe Injection

#### Summary
| Field | Value |
|---|---|
| Issue Type | Unsanitized HTML Template Interpolation |
| Impact | Medium |
| Affected File | `src/components/ConversionView.tsx:242` |
| Test Scenario | Printing a currency quote slip when dynamic labels or strings contain `<img src=x onerror=alert(1)>` |

#### How It Was Fixed
Applied `escapeHtml()` to all interpolated dynamic values (`dateStr`, `feeLabel`, currency names/codes/symbols, rate string) before writing the quotation voucher into the print iframe, and locked the iframe with `sandbox="allow-same-origin allow-modals"`.

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | User clicks Print Quotation Slip (`ConversionView.tsx:239`) | Creates hidden print `<iframe>` with `sandbox="allow-same-origin allow-modals"` (`ConversionView.tsx:242`) |
| 2 | Dynamic fields pass through `escapeHtml()` (`ConversionView.tsx:272-284`) | Angle brackets and quotes are encoded as `&lt;`, `&gt;`, `&quot;`, `&#39;` |
| 3 | Markup is written via `frameDoc.write(...)` with scripts blocked by sandbox | **Handled Safely** (renders plain literal text without script execution) |

#### Conclusion
**Fix Verified** - Any HTML metacharacters are entity-encoded and script execution inside the quotation print iframe is blocked by the sandbox policy.
