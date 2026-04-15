import type { FastifyRequest } from 'fastify';

interface AuthenticatedRequest extends FastifyRequest {
    user: { id: string; sessionId: string };
}

export type { AuthenticatedRequest };
