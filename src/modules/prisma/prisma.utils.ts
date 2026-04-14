function normalizePostgresDatabaseUrl(raw: string | undefined): string {
    if (!raw) {
        throw new Error('DATABASE_URL não foi configurado. Verifique variáveis de ambiente');
    }

    try {
        return new URL(raw.trim()).toString();
    } catch {
        throw new Error(
            'DATABASE_URL inválida. Possível problema de encodificação de caracteres?',
        );
    }
}

export { normalizePostgresDatabaseUrl }