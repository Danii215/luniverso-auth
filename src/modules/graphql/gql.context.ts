export interface GqlContext {
    req: {
        ip: string;
        headers: {
            'user-agent': string;
        };
        user: {
            id: string;
            sessionId: string;
        };
    };
}
