# LDAP UI Backend - Architecture Design

## Phase 2: MVP Backend Implementation

### Overview

**Stack:**
- Framework: Fastify (REST API)
- LDAP Client: ldapjs (wrapper für Promise-basierte API)
- Logger: pino (structured logging)
- Session: @fastify/session + @fastify/cookie (HttpOnly Cookies)
- Encryption: crypto-js (session credentials)

**Goals:**
- Stateless REST API für Frontend
- LDAP-Connection per Request (keine Connection Pools, MVP)
- Cookie-based Session Management (URLs + Username)
- Error Handling mit HTTP-Status Mapping
- TypeScript für Type Safety

---

## Directory Structure

```
packages/backend/
├── src/
│   ├── server.ts                # Server entry point
│   ├── cli.ts                   # CLI entry point (npm bin)
│   │
│   ├── api/
│   │   ├── index.ts            # Fastify app factory + middleware setup
│   │   ├── routes.ts           # Route registration
│   │   │
│   │   ├── routes/             # Individual route handlers
│   │   │   ├── auth.ts         # POST /login, POST /logout, GET /whoami
│   │   │   ├── entry.ts        # CRUD: GET/POST/PUT/DELETE /:dn
│   │   │   ├── tree.ts         # GET /tree/:baseDn
│   │   │   └── search.ts       # GET /search?q=...
│   │   │
│   │   └── middleware/
│   │       ├── errorHandler.ts # Global error handler
│   │       ├── logger.ts       # Request logging
│   │       └── auth.ts         # Session validation (protects routes)
│   │
│   ├── handlers/                # Business logic (separated from routes)
│   │   ├── AuthHandler.ts      # bind, login, logout logic
│   │   ├── EntryHandler.ts     # search, get, modify, add, delete
│   │   ├── TreeHandler.ts      # tree traversal
│   │   └── SearchHandler.ts    # search with filters
│   │
│   ├── ldap/
│   │   ├── client.ts           # LdapClient: Promise wrapper over ldapjs
│   │   ├── connection.ts       # Connection factory + management
│   │   ├── operations.ts       # LDAP operations (bind, search, modify, etc)
│   │   └── schema.ts           # Schema parsing (port from Python)
│   │
│   ├── types/
│   │   ├── index.ts            # Shared TypeScript interfaces
│   │   └── fastify.ts          # Fastify type augmentation
│   │
│   ├── utils/
│   │   ├── config.ts           # Environment config loader
│   │   ├── crypto.ts           # Session encryption/decryption
│   │   ├── errors.ts           # Custom error classes + HTTP mapping
│   │   └── logger.ts           # pino logger setup
│   │
│   └── __tests__/
│       ├── setup.ts            # Test utilities + fixtures
│       ├── unit/
│       │   ├── ldap.test.ts
│       │   └── crypto.test.ts
│       └── integration/
│           └── api.test.ts
│
├── dist/                        # Compiled output (esbuild)
├── __tests__/                   # E2E tests (optional for MVP)
├── .env.example
└── vitest.config.ts
```

---

## Core Types

```typescript
// types/index.ts

export interface LdapSession {
  bindDn: string;
  ldapUrl: string;
  encryptedPassword: string;  // AES-256-GCM encrypted
  encryptedAt: number;
  expiresAt: number;
  // Stored in Cookie
}

export interface LdapEntry {
  dn: string;
  attributes: Record<string, string[]>;      // Multi-valued attrs
  rawAttributes?: Record<string, Buffer[]>;  // Binary data
}

export interface LdapAttribute {
  name: string;
  values: string[];
  isMultiValued: boolean;
  syntax?: string;  // e.g., "1.3.6.1.4.1.1466.115037.1" (IA5String)
}

export interface SearchParams {
  baseDn: string;
  filter: string;
  attributes?: string[];
  scope?: 'base' | 'one' | 'sub';
  sizeLimit?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    detail?: string;
  };
}

// Fastify Augmentation
declare module 'fastify' {
  interface Session {
    bindDn: string;
    ldapUrl: string;
    encryptedPassword: string;
  }

  interface FastifyRequest {
    ldapCreds?: {
      bindDn: string;
      password: string;
      ldapUrl: string;
    };
  }
}
```

---

## API Routes (REST Specification)

### Authentication

```
POST /api/auth/login
  Request:  { ldapUrl: string, username: string, password: string }
  Response: { bindDn: string, baseDn: string }
  Sets: HttpOnly Cookie with encrypted session

POST /api/auth/logout
  Response: { success: true }
  Clears: Cookie

GET /api/auth/whoami
  Response: { bindDn: string, ldapUrl: string }
  Protected: Requires valid session
```

### Entry Operations

```
GET /api/entry/:dn
  Returns: { dn: string, attributes: Record<string, string[]> }
  Protected: Yes

POST /api/entry/:parentDn
  Request:  { objectClass: string[], attributes: Record<string, string[]> }
  Response: { dn: string }
  Protected: Yes

PUT /api/entry/:dn
  Request:  { attributes: Record<string, string | string[] | null> }
  Response: { success: true }
  Protected: Yes
  Note: null value = delete attribute

DELETE /api/entry/:dn
  Response: { success: true }
  Protected: Yes

POST /api/entry/:dn/rename
  Request:  { newRdn: string }
  Response: { newDn: string }
  Protected: Yes
```

### Tree Navigation

```
GET /api/tree/:baseDn?scope=one
  Returns: [{ dn: string, hasChildren: boolean, name: string }]
  Protected: No (for login screen)
  Note: scope defaults to 'one' (immediate children)
```

### Search

```
GET /api/search?baseDn=...&q=...&filter=...
  Query Params:
    - baseDn: starting point
    - q: simple search string
    - filter: LDAP filter (if q not provided)
  Response: [{ dn: string, attributes: Record<string, string[]> }]
  Protected: Yes
```

### Schema

```
GET /api/schema
  Returns: {
    objectClasses: { name: ObjectClass[] },
    attributeTypes: { name: AttributeType[] }
  }
  Protected: No
```

---

## Middleware Pipeline

```
Request
  ↓
1. Logger (pino request logger)
  ↓
2. ErrorHandler wrapper (try-catch all routes)
  ↓
3. CORS / Helmet
  ↓
4. Cookie Parser
  ↓
5. Session Manager
  ↓
6. Auth Guard (if route is protected)
  ↓
7. Route Handler
  ↓
Response
```

### Auth Guard Middleware

```typescript
// Marks routes as protected
// Validates session.bindDn exists
// Decrypts password from session
// Attaches request.ldapCreds
// If session invalid → 401 Unauthorized
```

---

## Error Handling Strategy

### LDAP Error → HTTP Mapping

```typescript
const LDAP_ERROR_MAP: Record<string, number> = {
  // LDAP Error Code → HTTP Status
  'UNAVAILABLE': 503,           // Server down
  'INVALID_CREDENTIALS': 401,   // Bad password
  'NO_SUCH_OBJECT': 404,        // DN not found
  'OBJECT_CLASS_VIOLATION': 400, // Invalid schema
  'INSUFFICIENT_ACCESS_RIGHTS': 403,
  'ENTRY_ALREADY_EXISTS': 409,
  'UNWILLING_TO_PERFORM': 403,  // Not allowed
  'OTHER': 500
};

// All errors return JSON:
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid credentials for cn=admin,dc=example,dc=org",
    "detail": "(LDAP error details)"
  }
}
```

---

## Session & Cookie Management

### Cookie Structure

```
Name: ldap-session
Value: base64(encrypted session data)
Flags: HttpOnly, Secure (HTTPS), SameSite=Lax
TTL: 24 hours (configurable)
```

### Session Content (encrypted)

```json
{
  "bindDn": "cn=admin,dc=example,dc=org",
  "ldapUrl": "ldap://server:389",
  "encryptedPassword": "...",  // AES-256-GCM
  "encryptedAt": 1717939200000,
  "expiresAt": 1717939200000 + 24h
}
```

### Cookie History (stored in Cookie for URL history)

**Note:** LDAP-URLs are persisted in Cookie alongside session data.
Cookie contains array of recent URLs for dropdown on login screen.

Example cookie structure:
```json
{
  "bindDn": "...",
  "ldapUrl": "...",
  "encryptedPassword": "...",
  "savedUrls": [
    "ldap://server1:389",
    "ldaps://server2:636"
  ]
}
```

---

## LDAP Client Wrapper

### Promise-based API over ldapjs

```typescript
class LdapClient {
  // Connection
  async connect(url: string, bindDn: string, password: string): Promise<void>
  async disconnect(): Promise<void>

  // Operations
  async search(params: SearchParams): Promise<LdapEntry[]>
  async getEntry(dn: string): Promise<LdapEntry>
  async modify(dn: string, changes: LdapChange[]): Promise<void>
  async add(entry: Partial<LdapEntry>): Promise<void>
  async delete(dn: string): Promise<void>
  async rename(dn: string, newRdn: string): Promise<void>

  // Schema
  async getSchema(): Promise<LdapSchema>

  // Utilities
  async testConnection(): Promise<boolean>
}

// Internal: Convert ldapjs callbacks to Promises
// Timeout handling: 5s default per operation
```

---

## Configuration

### Environment Variables

```bash
# LDAP Defaults (optional)
LDAP_URL=ldap://localhost:389
BASE_DN=dc=example,dc=org
LOGIN_ATTR=uid

# Server Config
HOST=127.0.0.1
PORT=5000
NODE_ENV=development

# Security
SESSION_SECRET=<random-32-chars>
SESSION_TTL=86400000  # 24h in ms

# Logging
LOG_LEVEL=info  # trace, debug, info, warn, error, fatal
```

### .env.example

```
LDAP_URL=ldap://localhost:389
BASE_DN=dc=example,dc=org
LOGIN_ATTR=uid
HOST=127.0.0.1
PORT=5000
NODE_ENV=development
SESSION_SECRET=your-secret-key-here
LOG_LEVEL=info
```

---

## Implementation Order

### Step 1: Core Infrastructure (Day 1-2)
1. [ ] `src/utils/config.ts` - Load environment
2. [ ] `src/utils/logger.ts` - Setup pino
3. [ ] `src/utils/errors.ts` - Error classes + HTTP mapping
4. [ ] `src/types/index.ts` - Shared types
5. [ ] `src/api/index.ts` - Fastify app factory

### Step 2: LDAP Layer (Day 2-3)
1. [ ] `src/ldap/client.ts` - LdapClient wrapper
2. [ ] `src/ldap/operations.ts` - LDAP operations
3. [ ] `src/ldap/schema.ts` - Schema parser (port from Python)
4. [ ] `src/utils/crypto.ts` - Session encryption

### Step 3: API Routes (Day 3-4)
1. [ ] `src/api/routes/auth.ts` - Login/logout
2. [ ] `src/api/routes/entry.ts` - CRUD
3. [ ] `src/api/routes/tree.ts` - Navigation
4. [ ] `src/api/routes/search.ts` - Search

### Step 4: Handlers & Middleware (Day 4-5)
1. [ ] `src/handlers/AuthHandler.ts`
2. [ ] `src/handlers/EntryHandler.ts`
3. [ ] `src/handlers/TreeHandler.ts`
4. [ ] `src/api/middleware/auth.ts` - Protected routes
5. [ ] `src/api/middleware/errorHandler.ts`

### Step 5: Server Entry Points (Day 5)
1. [ ] `src/server.ts` - Start Fastify server
2. [ ] `src/cli.ts` - CLI wrapper (npm bin ldap-ui)

### Step 6: Testing (Day 6)
1. [ ] Unit tests for ldap/client, utils/crypto
2. [ ] Integration tests for routes

---

## Dependencies Justification

| Dependency | Why | Alternative |
|---|---|---|
| `fastify` | Fast, TypeScript-native, minimal | Express (larger), Hono (unstable) |
| `ldapjs` | Mature LDAP client, JavaScript | ldap3-js (early), activeDirectory (AD-only) |
| `pino` | Fast structured logging | winston (slower), bunyan (dated) |
| `@fastify/session` | Simple session management | express-session (Express only) |
| `@fastify/cookie` | Native cookie parsing | manual parsing |
| `crypto-js` | AES encryption (simple) | native crypto (more verbose) |

---

## Testing Strategy

### Unit Tests

```typescript
// __tests__/unit/ldap.client.test.ts
- LdapClient.connect() succeeds/fails
- LdapClient.search() returns entries
- LdapClient.modify() changes attributes
- Error handling and timeouts

// __tests__/unit/crypto.test.ts
- encrypt/decrypt round-trip
- Invalid encrypted data raises error
```

### Integration Tests

```typescript
// __tests__/integration/api.test.ts
- POST /api/auth/login with valid/invalid credentials
- GET /api/entry/:dn returns entry
- PUT /api/entry/:dn modifies entry
- Auth guard blocks unprotected requests
- Error responses have correct HTTP status
```

---

## Edge Cases & Mitigations

| Case | Mitigation |
|---|---|
| **Session expires during request** | Re-auth (401), Frontend retries |
| **LDAP server disconnects** | Reconnect on next request |
| **Binary attributes** | Base64 encode/decode |
| **Large result sets** | sizeLimit parameter (defaults to 1000) |
| **Schema unavailable** | Fall back to basic rendering |
| **Concurrent modifications** | Last-write-wins (LDAP default) |

---

## Phase Transitions

**Phase 2 → Phase 3:** Frontend needs working API
- Auth endpoint must work (login/logout)
- Entry CRUD endpoints live
- Tree navigation working
- Schema endpoint optional (can use hardcoded fallback)

**Phase 3 → Phase 4:** UI testing & integration
- Vitest for component tests
- Integration tests for API flows
- E2E with Playwright (optional for MVP)

---

## Success Criteria (MVP)

✅ User can login with LDAP credentials  
✅ User sees directory tree  
✅ User can view, edit, create, delete entries  
✅ User can search entries  
✅ URLs + username saved in encrypted cookies  
✅ All errors return proper HTTP status + JSON  
✅ No Python dependencies  
✅ Runs as: `npm install && npm run dev`  

