# LDAP UI - Quick Start Guide

A modern, fast LDAP editor built with Node.js backend and Vue.js frontend.

## Installation

### Prerequisites
- Node.js 20+
- pnpm (`npm install -g pnpm`)
- An LDAP server (OpenLDAP, 389 DS, etc.)

### Setup

```bash
# Install dependencies
pnpm install

# Configure environment (optional)
cp packages/backend/.env.example packages/backend/.env
# Edit .env with your settings (optional)
```

## Development

### Start Everything

```bash
# Terminal 1: Backend (Node.js server on port 5000)
cd packages/backend
pnpm dev

# Terminal 2: Frontend (Vite dev server on port 5173)
cd packages/frontend
pnpm dev
```

Then open: **http://localhost:5173**

### Individual Commands

```bash
# Backend
pnpm run dev:backend          # Start backend
pnpm run build:backend        # Build backend
pnpm run test:backend         # Run unit tests

# Frontend  
pnpm run dev:frontend         # Start frontend
pnpm run build:frontend       # Build frontend
pnpm run test:frontend        # Run component tests

# Both
pnpm dev                      # Start both in parallel
pnpm build                    # Build both
pnpm test                     # Test both
```

## Configuration

### Backend (.env)

```env
# LDAP Defaults
LDAP_URL=ldap://localhost:389
BASE_DN=dc=example,dc=org
LOGIN_ATTR=uid

# Server
HOST=127.0.0.1
PORT=5000
NODE_ENV=development

# Security
SESSION_SECRET=your-32-char-secret-key-here
SESSION_TTL=86400000  # 24 hours in ms

# Logging
LOG_LEVEL=info
```

### Frontend (.env)

```env
VITE_API_BASE=/api
VITE_DEFAULT_LDAP_URL=ldap://localhost:389
```

## Usage

1. **Login**: Enter LDAP server URL, username, password
   - Recently used URLs are saved in cookies
   - Username can be simple (`admin`) or full DN (`cn=admin,dc=example,dc=org`)

2. **Browse**: Explore directory tree in left sidebar

3. **Edit**: Click on entry to view/edit attributes
   - Click pencil icon to toggle edit mode
   - Modify attributes and save
   - Delete entire entries

4. **Search**: Use search endpoints (coming in Phase 4)

## API Endpoints

### Auth
- `POST /api/auth/login` - Login with LDAP credentials
- `POST /api/auth/logout` - Logout
- `GET /api/auth/whoami` - Current user info

### Entries
- `GET /api/entry/:dn` - Get entry
- `POST /api/entry/:parentDn` - Create entry
- `PUT /api/entry/:dn` - Modify entry
- `DELETE /api/entry/:dn` - Delete entry
- `POST /api/entry/:dn/rename` - Rename entry

### Navigation
- `GET /api/tree/:baseDn` - Get tree structure
- `GET /api/tree/root` - Get root DSE

### Search
- `GET /api/search` - Search with query
- `POST /api/search/advanced` - Advanced search with filter

### Schema
- `GET /api/schema` - Get LDAP schema

## Docker

```bash
# Build image
docker build -t ldap-ui .

# Run container
docker run -p 5000:5000 \
  -e LDAP_URL=ldap://your-server \
  -e BASE_DN=dc=example,dc=org \
  ldap-ui
```

## Architecture

```
ldap-nodejs-ui (npm monorepo)
├── packages/backend/      # Node.js + Fastify REST API
│   ├── src/api/          # REST routes + middleware
│   ├── src/ldap/         # LDAP client with pooling
│   └── src/utils/        # Config, logging, errors
│
└── packages/frontend/     # Vue.js 3 + Vuetify UI
    ├── src/views/        # Pages (Login, Main)
    ├── src/components/   # Vuetify components
    ├── src/stores/       # Pinia auth store
    └── src/api/          # API client wrapper
```

**Backend Stack:**
- Fastify (REST framework)
- ldapjs (LDAP client)
- pino (logging)
- Pinia (session store)

**Frontend Stack:**
- Vue 3 (UI framework)
- Vuetify 3 (Material Design)
- Pinia (state management)
- Vite (dev server & bundler)

## Browser Support

Modern browsers (ES2020+):
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Can't connect to LDAP server
- Check LDAP_URL format: `ldap://host:389` or `ldaps://host:636`
- Verify server is running and accessible
- Check firewall rules

### Login fails with "Invalid credentials"
- Verify username/password
- For simple username, check LOGIN_ATTR matches your LDAP (default: `uid`)
- Try full DN: `cn=username,dc=example,dc=org`

### API requests fail in browser
- Check backend is running on port 5000
- Verify Vite proxy config in `vite.config.ts`
- Check browser console for network errors

### Cannot save entries
- Verify LDAP user has write permissions
- Check LDAP ACLs

## Development Notes

- Backend: Uses ES modules, TypeScript, strict mode
- Frontend: Vue 3 Composition API, TypeScript
- No external databases required (stateless REST API)
- Session credentials encrypted in cookies (AES-256-GCM)
- All API responses include `{ success, data, error }`

## Next Steps (Phase 4+)

- [ ] LDIF Import/Export
- [ ] Image support (jpegPhoto)
- [ ] Schema-aware validation
- [ ] Advanced search UI
- [ ] Password change dialog
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Mobile responsive

## License

GPL-3.0

## Support

For issues and feature requests, see GitHub issues.
