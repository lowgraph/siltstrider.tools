import { createClerkClient } from '@clerk/backend';
import { json, getCorsHeaders } from './cors.mjs';

/**
 * Verifies Bearer session token via @clerk/backend.
 * Enforces trusted origin, non-empty clerk_user_id, and offline PEM verification when configured.
 */
export async function authenticateUser(request, env) {
  const cors = getCorsHeaders(request, env);

  // 1. Service configuration check
  if (!env.CLERK_SECRET_KEY && !env.CLERK_JWT_KEY) {
    return {
      authenticated: false,
      response: json({ error: 'SERVICE_UNAVAILABLE', message: 'Authentication service not configured' }, 503, cors),
    };
  }

  // 2. Explicit Bearer token header verification
  const authHeader = request.headers.get('Authorization') || '';
  if (!/^Bearer \S+$/i.test(authHeader)) {
    return {
      authenticated: false,
      response: json({ error: 'UNAUTHORIZED', message: 'Valid Bearer session token required' }, 401, cors),
    };
  }

  // 3. Origin check (if APP_ORIGIN is enforced)
  const origin = request.headers.get('Origin');
  if (origin && env.APP_ORIGIN && origin !== env.APP_ORIGIN) {
    return {
      authenticated: false,
      response: json({ error: 'FORBIDDEN_ORIGIN', message: 'Request origin not allowed' }, 403, cors),
    };
  }

  // 4. Authenticate request via Clerk Backend SDK
  try {
    const clerk = createClerkClient({
      secretKey: env.CLERK_SECRET_KEY,
      publishableKey: env.CLERK_PUBLISHABLE_KEY,
    });

    const state = await clerk.authenticateRequest(request, {
      acceptsToken: 'session_token',
      ...(env.APP_ORIGIN ? { authorizedParties: [env.APP_ORIGIN] } : {}),
      ...(env.CLERK_JWT_KEY ? { jwtKey: env.CLERK_JWT_KEY } : {}),
    });

    if (!state.isAuthenticated) {
      return {
        authenticated: false,
        response: json({ error: 'UNAUTHORIZED', message: 'Invalid or expired session token' }, 401, cors),
      };
    }

    const auth = state.toAuth();
    const userId = auth?.userId;
    if (!userId) {
      return {
        authenticated: false,
        response: json({ error: 'UNAUTHORIZED', message: 'Authenticated user ID missing' }, 401, cors),
      };
    }

    return {
      authenticated: true,
      userId,
      auth,
    };
  } catch (err) {
    return {
      authenticated: false,
      response: json({ error: 'UNAUTHORIZED', message: 'Authentication verification failed: ' + (err?.message || 'unknown error') }, 401, cors),
    };
  }
}
