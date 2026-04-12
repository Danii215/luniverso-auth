## `core/` — Backend (NestJS + GraphQL)

Esta pasta contém o **backend** do projeto: uma API **GraphQL** em **NestJS**, rodando em **Fastify**, com:

- **Auth**: login/registro com **JWT (access token)** + **sessões** persistidas no banco, e **refresh token** rotativo.
- **Persistência**: **Prisma** usando **PostgreSQL** (via `@prisma/adapter-pg`).
- **Rate limit**: `@nestjs/throttler` com storage em **Redis** (para funcionar em ambiente distribuído).
- **E-mail**: envio via **Resend** (usado para verificação de e-mail).

### Estrutura da pasta

- **`src/main.ts`**: bootstrap do Nest com `@nestjs/platform-fastify` e `trustProxy`.
- **`src/app.module.ts`**: módulo raiz; registra GraphQL, config, throttling, prisma e módulos de domínio.
- **`src/modules/`**: módulos de domínio/infra:
    - **`graphql/`**: configuração do GraphQL (Apollo). Gera schema automaticamente.
    - **`auth/`**: resolver + service + guard. Gerencia credenciais, tokens e sessões.
    - **`user/`**: resolver/service para perfil do usuário (ex.: `me`).
    - **`prisma/`**: `PrismaService` e módulo.
    - **`throttler/`**: configuração de rate limit com Redis.
    - **`config/`**: wrapper do `@nestjs/config` (global).
    - **`email/`**: serviço de envio de e-mail (Resend).
- **`src/common/GqlThrottlerGuard.ts`**: adaptação do throttler para contexto GraphQL.
- **`prisma/schema.prisma`**: schema do banco e modelos (`User`, `Session`, `EmailVerification`).
- **`prisma/migrations/`**: migrations do Prisma.
- **`dist/`**: build gerado pelo Nest (não edite manualmente).
- **`redis.sh`**: atalho simples para subir um Redis via Docker.

### GraphQL (schema e contexto)

- **Schema**: é gerado automaticamente em `src/schema.gql` (arquivo marcado como **auto-gerado**).
- **Contexto**: o GraphQL injeta `req`/`res` do Fastify (ver `src/modules/graphql/graphql.module.ts`).

### Autenticação e sessões (visão geral)

- **Access token (JWT)**: emitido com `sub` (userId) e `sessionId`. Validade configurada para **15 minutos**.
- **Refresh token**: formato `tokenId.secret`.
    - No banco, o `secret` é armazenado **hasheado**.
    - No refresh, o `tokenId` é **rotacionado** e o `secret` também.
- **Sessão vinculada ao dispositivo**: o guard compara `ip` e `user-agent` atuais com o que foi salvo na sessão (se existirem), para mitigar roubo de token.

### Operações GraphQL disponíveis

Com base em `src/schema.gql`, as principais operações são:

- **Queries**
    - **`me`**: retorna o usuário autenticado.
    - **`activeSessions`**: lista sessões ativas (marcando a sessão atual).
- **Mutations**
    - **`register`**: cria usuário, envia verificação de e-mail e cria sessão.
    - **`login`**: autentica e cria sessão.
    - **`logout`**: encerra a sessão atual.
    - **`refreshToken`**: renova access/refresh token (rotacionando o refresh).
    - **`disconnectSession`** / **`disconnectAllSessions`**: encerra sessões.
    - **`sendEmailVerification`** / **`verifyEmail`**: fluxo de verificação por e-mail.

- **TODO**
    - **Senha**
        - [ ] Solicitar redefinição de senha (Esqueci a senha)
        - [ ] Redefinir senha (Redefinir senha)
        - [ ] Alterar senha (Alterar senha)

    - **Sessões**
        - [ ] Ao invés de deletar do banco, marcar como invalidada (expiresAt < now())

    - **E-mail**
        - [ ] Invalidar tokens antigos ao reenviar (manter só o último válido)
        - [ ] Verificar se o e-mail é válido (usar regex e endereços confiáveis)

    - **Usuário**
        - [ ] Adicionar mutations para atualizar perfil (username, displayName, avatarUrl, dentre outros no futuro)
        - [ ] Adicionar verificação de telefone

    - **API**
        - [ ] Desabilitar graphql playground em produção
        - [ ] Adicionar headers de segurança (CORS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, etc.)
        - [ ] Adicionar logging
        - [ ] Adicionar health check
        - [ ] Adicionar metrics
        - [ ] Adicionar tracing
        - [ ] Adicionar seed
        - [ ] Centralizar variáveis de ambiente e validar na inicialização
        - [ ] Fallback se o Redis cair
        - [ ] Testes

### Variáveis de ambiente (necessárias)

Este serviço depende de variáveis em runtime (ex.: `.env`). Principais:

- **`PORT`**: porta do servidor (default `3000`).
- **`DATABASE_URL`**: conexão do Postgres (usada pelo `pg`/Prisma).
- **`JWT_SECRET`**: segredo para assinar/verificar JWT.
- **`FRONTEND_URL`**: base URL do frontend (usado no link de verificação de e-mail).
- **`REDIS_URL`**: host do Redis (ex.: `localhost`).
- **`REDIS_PORT`**: porta do Redis (default `6379`).
- **`EMAIL_HOST`**: remetente usado pelo Resend (campo `from`).
- **`EMAIL_KEY`**: API key do Resend.

### Como rodar localmente

Instalar dependências:

```bash
pnpm install
```

Subir Redis (opcional, mas recomendado por causa do throttling):

```bash
./redis.sh
```

Rodar em dev (watch):

```bash
pnpm run start:dev
```

Build e produção:

```bash
pnpm run build
pnpm run start:prod
```

### Scripts úteis (package.json)

- **`pnpm run start:dev`**: servidor com watch.
- **`pnpm run lint`**: eslint (com `--fix`).
- **`pnpm run test`** / **`pnpm run test:e2e`**: testes.

### Notas rápidas

- **`node_modules/`** está dentro de `core/` (projeto Node isolado).
- O schema GraphQL em `src/schema.gql` é **gerado**; a fonte de verdade são os decorators GraphQL nos resolvers/DTOs.
