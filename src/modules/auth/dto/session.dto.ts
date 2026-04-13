export class Session {
    id: string;
    userId: string;
    createdAt: Date;
    expiresAt: Date;
    ip?: string;
    userAgent?: string;
    current?: boolean;
}
