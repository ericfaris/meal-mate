# Security Review & Hardening Plan

*Last Reviewed: 2026-02-05*

---

## Known Vulnerabilities

### CRITICAL

#### 1. Hardcoded JWT Secret Fallback
**Files**: `middleware/auth.ts:40,175`, `models/user.ts:148`, `utils/invitation.ts:5,19`
```typescript
const secret = process.env.JWT_SECRET || 'meal-mate-secret-key';
```
**Risk**: If `JWT_SECRET` is unset in production, the app falls back to a publicly visible secret. Any attacker could forge valid JWTs, invitation tokens, and impersonate any user. This fallback appears in 5 different locations.
**Fix**: Remove the fallback. Throw at startup if `JWT_SECRET` is missing.

#### 2. Google OAuth Account Takeover
**File**: `controllers/oauth.ts:108-117`
```typescript
if (existingUser.authProvider === 'local') {
    existingUser.authProvider = 'google';
    existingUser.providerId = googleId;
```
**Risk**: When a Google login matches an existing local account's email, it silently takes over the account without verifying the Google email is verified (`email_verified` is stored but not checked as a gate). An attacker who controls a Google account with a victim's email can hijack their account, losing their password-based access entirely.
**Fix**: Only auto-link if `email_verified === true` from Google, and/or require the user to confirm linking via their existing password.

---

### HIGH

#### 3. No Rate Limiting
**File**: `app.ts`
**Risk**: Zero rate limiting on any endpoint. Login, registration, and password attempts are unlimited. Enables brute-force password attacks, credential stuffing, API abuse (AI-powered endpoints like photo import, suggestions), and denial-of-service via expensive operations.
**Fix**: Add `express-rate-limit` globally (100/min) and stricter limits on auth endpoints (5/min).

#### 4. Server-Side Request Forgery (SSRF)
**Files**: `services/recipeParser.ts:76`, `controllers/recipeSubmission.ts:136-153`
```typescript
response = await axios.get(url, { ... });
```
**Risk**: The recipe import fetches arbitrary user-supplied URLs with no restrictions. An attacker can probe internal networks, cloud metadata endpoints (`169.254.169.254`), and internal services. The recipe submission approval flow has the same SSRF vector since it calls `importRecipeFromUrl` with the user-submitted URL.
**Fix**: Validate URLs against an allowlist of schemes (http/https only), block private IP ranges (`10.x.x.x`, `172.16-31.x.x`, `192.168.x.x`, `127.x.x.x`), and block cloud metadata IPs (`169.254.169.254`).

#### 5. CORS Wide Open
**File**: `app.ts:22`
```typescript
app.use(cors());
```
**Risk**: Allows requests from any origin. In production, any malicious website can make authenticated API calls if the user has a valid token stored.
**Fix**: Restrict to your app's domains in production. Use environment-based CORS configuration.

#### 6. No Security Headers
**File**: `app.ts`
**Risk**: No `helmet` middleware. Missing `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security` (HSTS), `Content-Security-Policy`, `X-XSS-Protection`.
**Fix**: Add `helmet()` middleware.

---

### MEDIUM

#### 7. No File Upload Size/Type Validation
**File**: Photo import route (multer config)
**Risk**: The photo import accepts file uploads but needs to enforce max file size and validate MIME types server-side (not just trust `req.file.mimetype`). An attacker could upload arbitrarily large files.
**Fix**: Configure multer with `limits: { fileSize: 5 * 1024 * 1024 }` and validate magic bytes.

#### 8. Missing ObjectId Validation
**Files**: Multiple controllers using `req.params.id`
**Risk**: Invalid IDs cause Mongoose `CastError` resulting in 500 instead of 400 responses. Makes error monitoring noisy and could be used for probing.
**Fix**: Add ObjectId validation middleware or per-route validation.

#### 9. API Error Detail Leakage
**File**: `controllers/imageSearch.ts:63`
```typescript
googleError: errorDetails
```
**Risk**: Google API error internals (potentially including API keys in error messages) are forwarded directly to the client.
**Fix**: Log the full error server-side, return a generic error to the client.

#### 10. No Token Revocation Mechanism
**Risk**: No way to invalidate JWTs before their 7-day expiry. If an account is compromised, the attacker has a valid token for up to a week. No blacklist, no token versioning.
**Fix**: Add `tokenVersion` to User model, increment on password change/security events, check in auth middleware.

#### 11. Role Reset on Household Leave
**File**: `controllers/household.ts:178`
```typescript
await User.findByIdAndUpdate(userId, { householdId: null, role: 'member' });
```
**Risk**: When a member leaves a household, their role is set to `'member'` instead of `'admin'` (the default for standalone users). This means they lose the ability to create recipes, plans, import recipes, etc. since all those endpoints check `user.role !== 'admin'`.
**Fix**: Reset role to `'admin'` when a user leaves a household (matching new user defaults).

#### 12. No Explicit Body Size Limits
**File**: `app.ts:23`
```typescript
app.use(express.json()); // defaults to 100kb, but should be explicit
```
**Fix**: Use `express.json({ limit: '1mb' })` explicitly.

#### 13. Invitation Tokens Share JWT Secret
**Risk**: Auth tokens and invitation tokens use the same `JWT_SECRET`. Sharing the same signing key means a compromise affects both auth and invitations simultaneously.
**Fix**: Use a derived key (e.g., `JWT_SECRET + '-invite'`) for invitation tokens, or a separate env var.

---

### LOW

#### 14. Password Policy Weak
**File**: `controllers/auth.ts:12`
**Risk**: Only enforces `min: 8` characters. No complexity requirements.
**Fix**: Require at least one uppercase, one digit, and one special character, or use a library like `zxcvbn` for strength scoring.

#### 15. Verbose Error Logging
**Files**: `controllers/recipePhotoImport.ts:90-95,125-130`
**Risk**: Logs AI response content and full error stacks. Could leak data in shared logging systems.
**Fix**: Sanitize log output in production. Use structured logging with log levels.

#### 16. No Audit Trail
**Risk**: No logging of security-relevant events: failed logins, role changes, household membership changes, recipe deletions. Makes incident investigation difficult.
**Fix**: Add audit trail collection for security events.

#### 17. OAuth Access Tokens Stored in DB
**Files**: `controllers/oauth.ts:178`, `models/user.ts`
**Risk**: Google access tokens are persisted in MongoDB. If the DB is compromised, these could be used to access users' Google data.
**Fix**: Don't persist OAuth tokens (they're short-lived), or encrypt at rest.

#### 18. No Request Timeouts on Some External Calls
**Files**: `controllers/imageSearch.ts`, `controllers/oauth.ts`
**Risk**: Image search and Google OAuth verification don't set explicit timeouts. Could hang indefinitely.
**Fix**: Set `timeout: 10000` on all external axios calls.

---

## Hardening Plan

### Phase 1 - Critical (Do Immediately)

| # | Task | Files |
|---|------|-------|
| 1 | Remove JWT secret fallback - crash on startup if missing | `middleware/auth.ts`, `models/user.ts`, `utils/invitation.ts` |
| 2 | Fix OAuth account linking - require `email_verified === true` | `controllers/oauth.ts` |
| 3 | Add rate limiting (`express-rate-limit`) on auth (5/min) and global (100/min) | `app.ts`, `routes/auth.ts` |
| 4 | SSRF protection - validate/block private IPs and metadata endpoints | `services/recipeParser.ts`, `controllers/recipeImport.ts` |
| 5 | Restrict CORS - environment-based origin allowlist | `app.ts` |

### Phase 2 - High Priority (This Week)

| # | Task | Files |
|---|------|-------|
| 6 | Add `helmet` middleware for security headers | `app.ts` |
| 7 | Validate file uploads - max size (5MB), validate MIME type via magic bytes | Multer config route file |
| 8 | ObjectId validation middleware - return 400 for invalid IDs | New middleware or per-route |
| 9 | Stop leaking API error details to clients | `controllers/imageSearch.ts` |
| 10 | Fix role reset on household leave - reset to `'admin'` | `controllers/household.ts` |

### Phase 3 - Medium Priority (This Sprint)

| # | Task | Files |
|---|------|-------|
| 11 | Add explicit body size limits (`express.json({ limit: '1mb' })`) | `app.ts` |
| 12 | Add request timeouts to all external HTTP calls | `controllers/imageSearch.ts`, `controllers/oauth.ts` |
| 13 | Security event logging - log failed logins, role changes, deletions | Auth + household controllers |
| 14 | Stronger password policy - require complexity | `controllers/auth.ts` |
| 15 | Token revocation - add `tokenVersion` to User model, check in auth middleware | `models/user.ts`, `middleware/auth.ts` |

### Phase 4 - Nice to Have

| # | Task | Files |
|---|------|-------|
| 16 | Separate signing keys for auth tokens vs invitation tokens | `utils/invitation.ts` |
| 17 | Don't store OAuth tokens in DB (or encrypt at rest) | `controllers/oauth.ts`, `models/user.ts` |
| 18 | Add audit trail collection for security events | New model + service |
| 19 | Add HTTPS redirect middleware for production | `app.ts` |
| 20 | Add input sanitization library (e.g., `mongo-sanitize`) for defense-in-depth | `app.ts` |

---

## Security Checklist for New Features

When adding new endpoints or features, verify:

- [ ] All routes require `authenticate` middleware (unless intentionally public)
- [ ] Queries are scoped by `userId` or household membership
- [ ] Role checks (`requireAdmin`, `requireAdminIfInHousehold`) are applied where needed
- [ ] User input is validated (types, formats, lengths)
- [ ] ObjectId parameters are validated before use in queries
- [ ] External URLs are validated against SSRF allowlists
- [ ] Error responses don't leak internal details
- [ ] File uploads have size and type restrictions
- [ ] No use of `Alert.alert()` on frontend (use `alertManager` instead)
- [ ] Sensitive data is not logged in production
