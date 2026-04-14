# luniverso-auth

API REST de autenticação em **NestJS** + **Fastify**, com **JWT** (access token), **refresh token** rotativo, **sessões** no PostgreSQL (**Prisma**), rate limit (**Redis** opcional) e envio de e-mail (**Resend**) para verificação de conta.

**Base URL:** `http://localhost:{PORT}` (por padrão `PORT=3000`, ajuste conforme o `.env`).

**Formato:** JSON (`Content-Type: application/json`). Respostas de sucesso são JSON; erros seguem o padrão do NestJS (corpo com `message`, `statusCode`, etc.).

---

## Autenticação nas rotas protegidas

Envie o access token JWT no header:

```http
Authorization: Bearer <accessToken>
```

O access token expira em **15 minutos** (configurado no `JwtModule`). Use `POST /auth/refresh` com o refresh token para obter novos tokens.

**E-mail não verificado:** com token válido, só é possível chamar `POST /auth/logout`, `POST /auth/email/send-verification` e `POST /auth/email/verify` até verificar o e-mail. Demais rotas autenticadas retornam **401** com mensagem `Email not verified`.

**Sessão e dispositivo:** o servidor grava `ip` e `user-agent` na sessão. Se estiverem salvos, o request atual deve coincidir; caso contrário, **401** (`Session does not match the current device`).

---

## Rotas

Todas as URLs abaixo são relativas à base (ex.: `POST /auth/register` → `http://localhost:3000/auth/register`).

### `POST /auth/register`

Cria usuário, dispara fluxo de verificação de e-mail e abre uma sessão (tokens).

|                |                               |
| -------------- | ----------------------------- |
| **Rate limit** | 5 requisições / 60 s (por IP) |
| **Auth**       | Não                           |

**Body (JSON)**

| Campo      | Tipo   | Regras              |
| ---------- | ------ | ------------------- |
| `email`    | string | E-mail válido       |
| `password` | string | Mínimo 8 caracteres |
| `username` | string | Não vazio           |

**Resposta `200` / `201`**

```json
{
    "accessToken": "<jwt>",
    "refreshToken": "<tokenId>.<secret>"
}
```

**Erros comuns:** `409` — usuário já existe (`User already exists`); `400` — validação (campos inválidos ou propriedades extras no body — o pipe remove/desaprova campos não listados no DTO).

---

### `POST /auth/login`

|                |          |
| -------------- | -------- |
| **Rate limit** | 5 / 60 s |
| **Auth**       | Não      |

**Body**

| Campo      | Tipo   |
| ---------- | ------ |
| `email`    | string |
| `password` | string |

**Resposta**

```json
{
    "accessToken": "<jwt>",
    "refreshToken": "<tokenId>.<secret>"
}
```

**Erros:** `401` — credenciais inválidas.

---

### `POST /auth/refresh`

|                |           |
| -------------- | --------- |
| **Rate limit** | 10 / 60 s |
| **Auth**       | Não       |

**Body**

| Campo          | Tipo                                     |
| -------------- | ---------------------------------------- |
| `refreshToken` | string — valor completo `tokenId.secret` |

**Resposta**

```json
{
    "accessToken": "<jwt>",
    "refreshToken": "<novo tokenId>.<novo secret>"
}
```

(O refresh token é **rotacionado** a cada uso.)

**Erros:** `401` — refresh inválido ou expirado.

---

### `POST /auth/logout`

Encerra a sessão atual (a do JWT).

| **Auth** | Bearer obrigatório |

**Body:** vazio.

**Resposta**

```json
true
```

---

### `GET /auth/me`

Retorna o usuário autenticado (registro Prisma `User`).

| **Auth** | Bearer obrigatório |

**Resposta:** objeto com os campos do modelo `User` (inclui `password` hash no estado atual do código — em produção convém expor um DTO sem senha).

---

### `GET /auth/sessions`

Lista sessões do usuário, com a atual marcada.

| **Auth** | Bearer obrigatório |

**Resposta:** array de objetos:

```json
[
    {
        "id": "<uuid>",
        "userId": "<id>",
        "createdAt": "<ISO8601>",
        "expiresAt": "<ISO8601>",
        "ip": "<string|null>",
        "userAgent": "<string|null>",
        "current": true
    }
]
```

---

### `DELETE /auth/sessions/:id`

Revoga uma sessão específica (por `id` da sessão).

| **Auth** | Bearer obrigatório |

**Resposta:** resultado da operação (boolean / conforme implementação do serviço).

---

### `DELETE /auth/sessions`

Revoga **todas** as sessões do usuário autenticado.

| **Auth** | Bearer obrigatório |

**Resposta**

```json
true
```

---

### `POST /auth/email/send-verification`

Reenvia e-mail com link de verificação.

|                |                    |
| -------------- | ------------------ |
| **Rate limit** | 3 / 60 s           |
| **Auth**       | Bearer obrigatório |

**Resposta**

```json
true
```

---

### `POST /auth/email/verify`

Confirma o e-mail a partir do `tokenId` (normalmente vindo da query string do link no frontend).

|                |           |
| -------------- | --------- |
| **Rate limit** | 10 / 60 s |
| **Auth**       | Não       |

**Body (JSON)**

| Campo     | Tipo   |
| --------- | ------ |
| `tokenId` | string |

**Resposta**

```json
true
```

**Erros:** `401` — token inválido, expirado ou e-mail já verificado.

---

## CORS

Por padrão, `origin: true` (reflete o `Origin` do cliente). Opcionalmente defina origens explícitas:

```env
CORS_ORIGIN=http://localhost:3000,https://seu-dominio.com
```

(várias origens separadas por vírgula.)

---

## Variáveis de ambiente

| Variável                   | Descrição                                                                                                                                                                                                |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PORT`                     | Porta HTTP (default `3000`)                                                                                                                                                                              |
| `DATABASE_URL`             | URL PostgreSQL. **Senhas com `#`, `@`, etc. devem ser percent-encoded** (ex.: `#` → `%23`). O código normaliza `#` na senha ao montar o pool em alguns casos; prefira já deixar a URL correta no `.env`. |
| `JWT_SECRET`               | Segredo para assinar o JWT                                                                                                                                                                               |
| `FRONTEND_URL`             | Base do site (link no e-mail de verificação)                                                                                                                                                             |
| `REDIS_URL` / `REDIS_PORT` | Redis para o throttler (ex.: `localhost` e `6379`)                                                                                                                                                       |
| `EMAIL_HOST`               | Remetente Resend (`from`)                                                                                                                                                                                |
| `EMAIL_KEY`                | API key Resend                                                                                                                                                                                           |
| `CORS_ORIGIN`              | Opcional — lista de origens permitidas                                                                                                                                                                   |

---

## Prisma: banco de dados

### O que cada comando faz

| Comando                     | Uso                                                                                                                        |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `npx prisma generate`       | Gera o **client** TypeScript em `node_modules`. **Não cria tabelas.** Rode após mudar `schema.prisma` ou ao clonar o repo. |
| `npx prisma migrate deploy` | **Aplica migrations pendentes** no banco (produção ou CI). **Cria/atualiza tabelas.**                                      |
| `npx prisma migrate dev`    | Desenvolvimento: cria uma nova migration a partir das mudanças no schema e aplica localmente.                              |

**Primeira vez / banco vazio:** com `DATABASE_URL` apontando para o banco certo:

```bash
cd luniverso-auth
npx prisma migrate deploy
npx prisma generate
```

Se a tabela não existir, o erro típico é `relation "public.User" does not exist` — falta rodar `migrate deploy` (ou `migrate dev`).

### Schema e migrations

- `prisma/schema.prisma` — modelos `User`, `Session`, `EmailVerification`
- `prisma/migrations/` — SQL versionado

Configuração do Prisma 7: `prisma.config.ts` (inclui URL do datasource).

---

## Como rodar localmente

```bash
cd luniverso-auth
npm install
```

Subir Redis (opcional, mas o throttler está configurado para Redis — sem Redis pode falhar ao iniciar; nesse caso ajuste o módulo ou use Docker):

```bash
# exemplo: script redis.sh se existir na pasta
```

```bash
npm run start:dev
```

Build e produção:

```bash
npm run build
npm run start:prod
```

---

## Comportamento dos tokens (resumo)

- **Access token (JWT):** payload com `sub` (id do usuário) e `sessionId`.
- **Refresh token:** formato `tokenId.secret`; no banco só o segredo fica hasheado; no refresh há **rotação** de `tokenId` e secret.
- **Sessão:** expira em **30 dias** (`expiresAt`), alinhado ao refresh.

---

## Ideias / melhorias futuras

- Redefinição de senha (“esqueci minha senha”)
- Não retornar `password` em `GET /auth/me`
- Health check, logging estruturado, testes e2e atualizados para REST
