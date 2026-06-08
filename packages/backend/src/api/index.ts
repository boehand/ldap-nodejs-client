import Fastify, { FastifyInstance } from 'fastify';
import fastifyHelmet from '@fastify/helmet';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getLogger } from '../utils/logger.js';
import { getConfig } from '../utils/config.js';
import type { LdapConfig } from '../types/index.js';
import { AppError, getHttpStatusCode, getLdapErrorInfo } from '../utils/errors.js';
import { registerAuthMiddleware } from './middleware/auth.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerEntryRoutes } from './routes/entry.js';
import { registerTreeRoutes } from './routes/tree.js';
import { registerSearchRoutes } from './routes/search.js';
import { registerSchemaRoutes } from './routes/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function createApp(config?: LdapConfig): Promise<FastifyInstance> {
  const appConfig = config || getConfig();
  const logger = getLogger();

  const app = Fastify({
    logger: {
      level: appConfig.logLevel,
      transport:
        appConfig.nodeEnv === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
  });

  // Security middleware
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
      },
    },
  });

  // CORS
  await app.register(fastifyCors, {
    origin: true,
    credentials: true,
  });

  // Cookie & Session management
  await app.register(fastifyCookie);
  await app.register(fastifySession, {
    secret: appConfig.sessionSecret,
    cookie: {
      secure: appConfig.nodeEnv === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: appConfig.sessionTtl,
    },
  });

  // Serve static files from frontend build (production only)
  if (appConfig.nodeEnv === 'production') {
    const frontendPath = join(__dirname, '../../frontend/dist');
    try {
      await app.register(fastifyStatic, {
        root: frontendPath,
        wildcard: false,
      });
    } catch {
      logger.debug('Frontend static files not found at %s', frontendPath);
    }
  }

  // Register authentication middleware
  await registerAuthMiddleware(app);

  // Request logging middleware
  app.addHook('onRequest', async (request, reply) => {
    logger.debug(
      { method: request.method, path: request.url },
      'Incoming request'
    );
  });

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    const errorInfo = getLdapErrorInfo(error);
    const statusCode = getHttpStatusCode(error);

    // Log the error
    logger.error(
      {
        code: errorInfo.code,
        message: errorInfo.message,
        detail: error instanceof AppError ? error.detail : undefined,
        path: request.url,
        method: request.method,
      },
      'Request error'
    );

    reply.code(statusCode).send({
      success: false,
      error: {
        code: errorInfo.code,
        message: errorInfo.message,
        detail: error instanceof AppError ? error.detail : undefined,
      },
    });
  });

  // Health check endpoint
  app.get('/api/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register API routes
  await registerAuthRoutes(app);
  await registerEntryRoutes(app);
  await registerTreeRoutes(app);
  await registerSearchRoutes(app);
  await registerSchemaRoutes(app);

  // 404 handler
  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${request.method} ${request.url} not found`,
      },
    });
  });

  return app;
}

export async function startServer(config?: LdapConfig): Promise<FastifyInstance> {
  const appConfig = config || getConfig();
  const logger = getLogger();

  const app = await createApp(appConfig);

  try {
    await app.listen({ host: appConfig.host, port: appConfig.port });
    logger.info(
      `🚀 Server listening at http://${appConfig.host}:${appConfig.port}`
    );
    return app;
  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
}
