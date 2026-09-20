/**
 * Silt Strider Cloud Save Service (Client SDK)
 *
 * Provides a typed, robust client for frontend components to interact with the
 * Cloudflare Worker cloud save vault API, handling Clerk auth tokens, optimistic
 * concurrency retries, typed quota errors, and automatic payload deserialization.
 */

import {
  SAVE_TYPES,
  packCloudSave,
  unpackCloudSave
} from './cloud-save-codec.mjs';

export { SAVE_TYPES, packCloudSave, unpackCloudSave };

export class CloudSaveError extends Error {
  constructor(message, status = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'CloudSaveError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class QuotaExceededError extends CloudSaveError {
  constructor(message = 'Maximum save slots reached for your account tier (5 for Free, 25 for Paid). Overwrite or delete an existing save to continue.') {
    super(message, 409, 'QUOTA_EXCEEDED');
    this.name = 'QuotaExceededError';
  }
}

export class RevisionConflictError extends CloudSaveError {
  constructor(message = 'Save has been modified by another session. Please reload and retry.', currentRevision = null, expectedRevision = null) {
    super(message, 409, 'REVISION_CONFLICT', { currentRevision, expectedRevision });
    this.name = 'RevisionConflictError';
    this.currentRevision = currentRevision;
    this.expectedRevision = expectedRevision;
  }
}

export class NotFoundError extends CloudSaveError {
  constructor(message = 'Save not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends CloudSaveError {
  constructor(message = 'Valid authentication required') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ValidationError extends CloudSaveError {
  constructor(message = 'Validation failed') {
    super(message, 400, 'VALIDATION_FAILED');
    this.name = 'ValidationError';
  }
}

/**
 * Creates a Cloud Save Client instance configured with authentication provider.
 *
 * @param {Object} options
 * @param {string} [options.baseUrl=''] Base URL prefix (e.g. '' on same origin, or 'https://siltstrider.tools')
 * @param {() => Promise<string|null> | string|null} [options.getToken] Token provider function
 * @param {() => Record<string, string>} [options.getHeaders] Optional extra headers
 * @param {typeof fetch} [options.fetchFn=globalThis.fetch] Fetch implementation
 */
export function createCloudSaveClient({
  baseUrl = '',
  getToken = async () => null,
  getHeaders = () => ({}),
  fetchFn = globalThis.fetch ? globalThis.fetch.bind(globalThis) : null,
} = {}) {
  const cleanBase = baseUrl.replace(/\/+$/, '');

  async function request(endpoint, options = {}) {
    if (!fetchFn) {
      throw new CloudSaveError('No fetch implementation available', 500, 'NO_FETCH');
    }

    const token = typeof getToken === 'function' ? await getToken() : getToken;
    const headers = {
      'Accept': 'application/json',
      ...getHeaders(),
      ...(options.headers || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${cleanBase}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    const response = await fetchFn(url, {
      ...options,
      headers,
    });

    // Parse JSON safely
    let body;
    const contentType = response.headers?.get('Content-Type') || '';
    if (contentType.includes('application/json')) {
      try {
        body = await response.json();
      } catch {
        body = null;
      }
    } else {
      const text = await response.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = { message: text };
      }
    }

    if (!response.ok) {
      const msg = body?.message || body?.error || `HTTP ${response.status}`;
      const code = body?.error || 'HTTP_ERROR';

      if (response.status === 401) {
        throw new UnauthorizedError(msg);
      }
      if (response.status === 404) {
        throw new NotFoundError(msg);
      }
      if (response.status === 409) {
        if (code === 'QUOTA_EXCEEDED' || msg.includes('QUOTA_EXCEEDED')) {
          throw new QuotaExceededError(msg);
        }
        if (code === 'REVISION_CONFLICT' || msg.includes('modified by another session')) {
          throw new RevisionConflictError(msg, body?.currentRevision, body?.expectedRevision);
        }
        throw new CloudSaveError(msg, 409, code, body);
      }
      if (response.status === 400) {
        throw new ValidationError(msg);
      }

      throw new CloudSaveError(msg, response.status, code, body);
    }

    return body;
  }

  return {
    /**
     * Lists save headers for the current authenticated user.
     * @param {Object} [filter]
     * @param {string} [filter.saveType] Filter by save type (openmw_save, character_build, etc.)
     * @param {number} [filter.limit=50] Page limit (1-100)
     * @param {number} [filter.offset=0] Pagination offset
     */
    async listSaves({ saveType, limit = 50, offset = 0 } = {}) {
      const params = new URLSearchParams();
      if (saveType) params.set('type', saveType);
      if (limit) params.set('limit', String(limit));
      if (offset) params.set('offset', String(offset));

      const query = params.toString();
      const endpoint = `/api/saves${query ? '?' + query : ''}`;
      return request(endpoint, { method: 'GET' });
    },

    /**
     * Fetches and unpacks a single save record by ID.
     * @param {string} id Save UUID
     */
    async getSave(id) {
      if (!id || typeof id !== 'string') throw new ValidationError('Invalid save ID');
      return request(`/api/saves/${encodeURIComponent(id)}`, { method: 'GET' });
    },

    /**
     * Creates and uploads a new save record.
     * Enforces user tier quotas (throws QuotaExceededError on tier limit).
     *
     * @param {Object} params
     * @param {string} [params.saveType] Save type (defaults to openmw_save on server if omitted)
     * @param {Object} [params.data] Data payload (will be SLT1 packed)
     * @param {Uint8Array|string} [params.packedPayload] Pre-packed binary payload
     * @param {string} [params.name] Display name
     */
    async createSave({ saveType, data, packedPayload, name } = {}) {
      if (!data && !packedPayload) throw new ValidationError('Save data object or packedPayload required');
      if (data && typeof data !== 'object') throw new ValidationError('Save data must be an object');
      const payload = {};
      if (saveType) payload.saveType = saveType;
      if (data) payload.data = data;
      if (packedPayload) payload.packedPayload = packedPayload;
      if (name !== undefined) payload.name = name;
      return request('/api/saves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    },

    /**
     * Overwrites/updates an existing save using optimistic locking.
     * Throws RevisionConflictError if the revision has changed concurrently.
     * Supports standalone rename when data/packedPayload are omitted.
     *
     * @param {string} id Save UUID
     * @param {Object} params
     * @param {string} [params.saveType] Save type (preserves existing save_type if omitted)
     * @param {Object} [params.data] Data payload
     * @param {Uint8Array|string} [params.packedPayload] Pre-packed binary payload
     * @param {string} [params.name] Display name
     * @param {number} params.revision Current revision counter (required for concurrency)
     */
    async updateSave(id, { saveType, data, packedPayload, name, revision } = {}) {
      if (!id || typeof id !== 'string') throw new ValidationError('Invalid save ID');
      if (revision === undefined || revision === null) throw new ValidationError('Revision required for optimistic locking');
      if (!data && !packedPayload && name === undefined) {
        throw new ValidationError('Update payload must contain data, packedPayload, or name');
      }
      const payload = { revision };
      if (saveType) payload.saveType = saveType;
      if (data) payload.data = data;
      if (packedPayload) payload.packedPayload = packedPayload;
      if (name !== undefined) payload.name = name;
      return request(`/api/saves/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    },

    /**
     * Renames a save record without transmitting save data.
     * @param {string} id Save UUID
     * @param {string} name New display name
     * @param {number} revision Current revision counter
     */
    async renameSave(id, name, revision) {
      return this.updateSave(id, { name, revision });
    },

    /**
     * Deletes a save record, optionally checking revision.
     *
     * @param {string} id Save UUID
     * @param {Object} [options]
     * @param {number} [options.revision] Optional revision check
     */
    async deleteSave(id, { revision } = {}) {
      if (!id || typeof id !== 'string') throw new ValidationError('Invalid save ID');
      let query = '';
      if (revision !== undefined && revision !== null) {
        const parsed = Number(revision);
        if (!Number.isInteger(parsed) || parsed < 1) {
          throw new ValidationError('Revision must be a positive integer');
        }
        query = `?revision=${encodeURIComponent(revision)}`;
      }
      return request(`/api/saves/${encodeURIComponent(id)}${query}`, { method: 'DELETE' });
    },

    /**
     * Fetches current account tier and quota usage.
     */
    async getEntitlements() {
      return request('/api/entitlements', { method: 'GET' });
    },
  };
}
