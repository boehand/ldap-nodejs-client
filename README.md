# LDAP UI

A modern, fast, and intuitive web-based LDAP directory editor built with Node.js and Vue.js.

**No Python required. Pure npm-based. Production-ready.**

## Overview

LDAP UI provides a clean, modern interface for managing LDAP directories. Whether you're administering OpenLDAP, 389 Directory Server, or Active Directory via LDAP, this tool makes it simple to browse, search, create, and modify directory entries.

### Key Features

✨ **Modern UI** - Built with Vue.js 3 and Vuetify Material Design components  
⚡ **Fast Backend** - Node.js with Fastify and connection pooling  
🔐 **Secure** - AES-256-GCM encrypted sessions, HttpOnly cookies  
🌳 **Tree Navigation** - Browse directory structure intuitively  
📝 **Full CRUD** - Create, read, update, delete LDAP entries  
🔍 **Powerful Search** - Simple and advanced LDAP filtering  
📊 **Schema Aware** - Understand your directory schema  
🎯 **Zero Dependencies** - No external databases required  
📦 **Easy Deployment** - Docker, npm, or standalone binary  

## Quick Start

### Prerequisites

- **Node.js** 20+ ([install](https://nodejs.org))
- **pnpm** ([install](https://pnpm.io))
- **LDAP Server** (OpenLDAP, 389 DS, etc.)

### Installation & Running

```bash
# Clone repository
git clone https://github.com/boehand/ldap-nodejs-ui.git
cd ldap-nodejs-ui

# Install dependencies (once)
pnpm install

# Start backend (Terminal 1)
cd packages/backend
pnpm dev
# Backend runs on http://localhost:5000

# Start frontend (Terminal 2)
cd packages/frontend
pnpm dev
# Frontend runs on http://localhost:5173
# Automatically proxies API calls to backend
```

**Open http://localhost:5173 in your browser.**

### First Login

1. **LDAP Server URL**: `ldap://your-ldap-server:389`
   - Or use `ldaps://` for SSL (port 636)

2. **Username**: Simple name or full DN
   - Simple: `admin` (searches by uid by default)
   - Full: `cn=admin,dc=example,dc=org`

3. **Password**: Your LDAP user password

4. **Saved URLs**: Recent servers are saved in session cookies

## Configuration

### Backend (.env)

Create `packages/backend/.env`:

```env
# LDAP Connection
LDAP_URL=ldap://localhost:389
BASE_DN=dc=example,dc=org
LOGIN_ATTR=uid

# Server
HOST=127.0.0.1
PORT=5000
NODE_ENV=development

# Security
SESSION_SECRET=your-32-character-random-secret-key-here
SESSION_TTL=86400000  # 24 hours in milliseconds

# Logging
LOG_LEVEL=info  # trace, debug, info, warn, error, fatal
```

### Frontend (.env)

Create `packages/frontend/.env`:

```env
# Backend API
VITE_API_BASE=/api

# Default LDAP URL shown in login
VITE_DEFAULT_LDAP_URL=ldap://localhost:389

# App title
VITE_APP_TITLE=LDAP UI
```

## Usage

### Browsing

1. **Login** with your LDAP credentials
2. **Tree Navigation** - Left sidebar shows directory structure
3. **Select Entry** - Click on any DN to view its attributes
4. **View Details** - All attributes displayed in the main panel

### Editing

1. **Click Edit** (pencil icon) to enable edit mode
2. **Modify Attributes** - Change values, add/remove entries
3. **Save Changes** - Click Save button (validation included)
4. **Delete Entry** - Delete icon removes entire entry

### Searching

- **Simple Search** - Type name/email to find users
- **Advanced Search** - Use LDAP filter syntax
  - `cn=john*` - Entries with cn starting with "john"
  - `mail=*@example.com` - Entries with specific email domain

## API Reference

All endpoints require authentication (LDAP bind). Responses always include `{ success, data, error }`.

### Authentication

```
POST   /api/auth/login          - Login with LDAP credentials
POST   /api/auth/logout         - Logout & clear session
GET    /api/auth/whoami         - Current authenticated user
GET    /api/auth/urls           - Saved LDAP server URLs
```

### Entry Operations

```
GET    /api/entry/:dn           - Get entry details
POST   /api/entry/:parentDn     - Create new entry
PUT    /api/entry/:dn           - Modify entry attributes
DELETE /api/entry/:dn           - Delete entry
POST   /api/entry/:dn/rename    - Rename entry (modify RDN)
POST   /api/entry/:dn/change-password - Change user password
```

### Navigation

```
GET    /api/tree/:baseDn        - Get directory tree
GET    /api/tree/root           - Get root DSE & naming contexts
```

### Search

```
GET    /api/search?baseDn=...&q=...     - Simple search
POST   /api/search/advanced             - Advanced search with filter
```

### Schema

```
GET    /api/schema              - Get full LDAP schema
GET    /api/schema/objectClass/:name   - Specific object class
GET    /api/schema/attributeType/:name - Specific attribute type
```

## Architecture

```
ldap-nodejs-ui (npm monorepo)
│
├── packages/backend/
│   ├── src/api/              REST API routes + middleware
│   ├── src/ldap/             LDAP client with connection pooling
│   ├── src/utils/            Config, logging, error handling
│   ├── src/types/            TypeScript shared types
│   └── src/server.ts         Server entry point
│
└── packages/frontend/
    ├── src/views/            Login & main layout
    ├── src/components/       Vuetify UI components
    ├── src/stores/           Pinia state management
    ├── src/api/              API client wrapper
    └── src/App.vue           App shell
```

### Backend Stack

- **Fastify** - Modern, fast REST framework
- **ldapjs** - LDAP client library with pooling
- **Pino** - Structured JSON logging
- **TypeScript** - Type-safe code

### Frontend Stack

- **Vue 3** - Progressive JavaScript framework
- **Vuetify 3** - Material Design components
- **Pinia** - State management
- **Vite** - Next-gen build tool

## Deployment

### Docker

```bash
# Build image
docker build -t ldap-ui .

# Run container
docker run \
  -p 5000:5000 \
  -e LDAP_URL=ldap://your-server:389 \
  -e BASE_DN=dc=example,dc=org \
  -e SESSION_SECRET=your-secret-key \
  ldap-ui
```

### npm Package

```bash
# Install globally
npm install -g @ldap-ui/backend

# Run
ldap-ui --port 5000 --ldap-url ldap://localhost:389
```

### Standalone

```bash
# Build both packages
pnpm build

# Backend: packages/backend/dist/server.js
# Frontend: packages/frontend/dist/

# Run backend
node packages/backend/dist/server.js

# Serve frontend from packages/frontend/dist/
# (e.g., with nginx)
```

## Development

### Project Structure

```
src/
├── backend/
│   ├── api/
│   │   ├── routes/        - API endpoints (auth, entry, tree, search, schema)
│   │   ├── middleware/    - Auth guard, error handling
│   │   └── index.ts       - Fastify app factory
│   ├── ldap/
│   │   ├── client.ts      - LdapClient with pooling
│   │   └── operations.ts  - LDAP operations
│   ├── utils/
│   │   ├── config.ts      - Environment loader
│   │   ├── errors.ts      - Error classes & mapping
│   │   ├── logger.ts      - Pino logger
│   │   └── crypto.ts      - Password encryption
│   └── types/
│       └── index.ts       - Shared TypeScript types
│
└── frontend/
    ├── api/
    │   └── ldap-client.ts - Fetch API wrapper
    ├── stores/
    │   └── auth.ts        - Pinia auth store
    ├── views/
    │   └── LoginView.vue  - Login page
    ├── components/
    │   ├── TreeExplorer.vue  - Tree navigation
    │   └── EntryEditor.vue   - Entry CRUD
    └── App.vue            - Main app shell
```

### Commands

```bash
# Development
pnpm dev                  # Start both (backend + frontend)
pnpm dev:backend          # Start backend only
pnpm dev:frontend         # Start frontend only

# Building
pnpm build                # Build both
pnpm build:backend        # Build backend
pnpm build:frontend       # Build frontend

# Testing
pnpm test                 # Run all tests
pnpm test:backend         # Backend unit tests
pnpm test:frontend        # Frontend component tests

# Linting
pnpm lint                 # Lint both
pnpm type-check           # TypeScript check
```

## Security Considerations

### LDAP Protocol

- **Plain text passwords**: Transmitted to your LDAP server only. Use TLS/SSL for production.
- **Simple bind only**: SASL authentication not supported (can be added if needed).
- **User permissions**: Respected by server. UI shows only what user can access.

### Session Management

- **HttpOnly Cookies**: Session tokens not accessible via JavaScript
- **Secure Flag**: Set in production (HTTPS only)
- **AES-256-GCM Encryption**: LDAP passwords encrypted in session
- **PBKDF2 Key Derivation**: 100k iterations for password encryption

### Deployment

- Deploy behind reverse proxy (nginx, Apache) with TLS
- Set `SESSION_SECRET` to strong random value
- Use `NODE_ENV=production` for hardened defaults
- Restrict network access to LDAP server

## Troubleshooting

### Can't Connect to LDAP

**Problem**: "Connection failed" or "Server unreachable"

**Solution**:
- Verify LDAP URL format: `ldap://host:389` or `ldaps://host:636`
- Check firewall allows connection
- Test with `ldapsearch`: `ldapsearch -H ldap://host -x -b "dc=example,dc=org"`

### Login Fails

**Problem**: "Invalid credentials"

**Solution**:
- Verify username and password
- Check `LOGIN_ATTR` matches your LDAP (default: `uid`)
- Try full DN: `cn=username,dc=example,dc=org`
- Check user has permissions on directory

### API Errors

**Problem**: Browser shows "Cannot reach API" or 404 errors

**Solution**:
- Verify backend running: `curl http://localhost:5000/api/health`
- Check Vite dev proxy in `vite.config.ts`
- Look at browser console for network errors
- Check backend logs for errors

### Slow Operations

**Problem**: Tree navigation or search is slow

**Solution**:
- Check `sizeLimit` in search (defaults to 1000)
- Reduce search scope or use more specific filter
- Look at backend logs for LDAP operation time
- Consider indexing on LDAP server for frequently searched attributes

## Browser Support

Modern browsers (ES2020+):
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Roadmap (Phase 4+)

- [ ] LDIF import/export
- [ ] Image support (jpegPhoto, thumbnailPhoto)
- [ ] Password change dialog
- [ ] Advanced search builder UI
- [ ] Mobile responsive design
- [ ] Dark mode
- [ ] Multi-language support
- [ ] E2E tests (Playwright)
- [ ] GraphQL API alternative

## FAQ

**Q: Do I need a database?**  
A: No. LDAP IS your database. This is a stateless API that reads/writes directly to LDAP.

**Q: Can I use this with Active Directory?**  
A: Yes! AD supports LDAP protocol. Use appropriate login patterns and schema-aware validation.

**Q: Is this secure for production?**  
A: Yes, with proper deployment:
- Run behind TLS reverse proxy
- Set strong SESSION_SECRET
- Restrict network access
- Use secure LDAP connections (ldaps://)

**Q: Can I customize the UI?**  
A: Yes! Full source code. Modify Vue components, Vuetify theme, or add new features.

**Q: Can I embed this in another app?**  
A: Yes! Export the Fastify API from `packages/backend/src/api/index.ts` or use the npm package.

## Acknowledgments

Built with modern tools:
- **Fastify** - Fast REST framework
- **ldapjs** - LDAP client library
- **Vue.js** - Progressive framework
- **Vuetify** - Material Design components
- **Pinia** - State management
- **Vite** - Build tool

## License

GPL-3.0

## Support

For issues, feature requests, or questions:
- GitHub Issues: [Report a bug](https://github.com/boehand/ldap-nodejs-ui/issues)
- Discussions: [Ask a question](https://github.com/boehand/ldap-nodejs-ui/discussions)

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

**Made with ❤️ for LDAP administrators**
