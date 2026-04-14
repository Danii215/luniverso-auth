export function normalizePostgresDatabaseUrl(raw: string | undefined): string {
    const trimmed = raw?.trim();
    if (!trimmed) {
        throw new Error('DATABASE_URL is not set');
    }

    const match = trimmed.match(
        /^(postgres(?:ql)?:\/\/)([^:]+):([^@]*)@([^\s]+)$/,
    );

    if (match) {
        const [, prefix, user, password, rest] = match;
        if (password.includes('#')) {
            return `${prefix}${user}:${encodeURIComponent(password)}@${rest}`;
        }
    }

    try {
        new URL(trimmed);
        return trimmed;
    } catch {
        throw new Error(
            'DATABASE_URL inválida. Codifique caracteres especiais na senha (ex.: # como %23).',
        );
    }
}
