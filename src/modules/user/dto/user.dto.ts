export class User {
    id: string;
    email: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    phone?: string;
    createdAt: Date;
    updatedAt: Date;
}
