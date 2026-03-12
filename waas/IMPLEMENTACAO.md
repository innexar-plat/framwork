# WaaS — Documentação completa da implementação

Este documento descreve **o que o projeto tem** e **como tudo funciona**: arquitetura, APIs, frontend, autenticação, multi-tenant, catálogo de módulos e fluxos principais.

---

## 1. Visão geral

**WaaS** (Website as a Service) é uma plataforma multi-tenant para **gerenciar sites**: o dono da plataforma configura planos/nichos/módulos; cada **tenant** (workspace/site) tem um plano e um nicho que definem quais **módulos** estão ativos (blog, propriedades, leads, agenda, mídia). Usuários fazem login e acessam um de dois painéis:

- **Painel Plataforma** — para administradores globais: catálogo (planos, nichos, módulos, matriz), lista de tenants, auditoria.
- **Painel Tenant** — para usuários do workspace: dashboard, configurações do site, páginas estáticas, blog, propriedades, leads, agenda, mídia, usuários do tenant.

**Stack:**

- **Backend:** FastAPI (Python 3.11), SQLAlchemy (async), PostgreSQL, Alembic, JWT (python-jose), bcrypt (passlib), SlowAPI (rate limit).
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS.
- **Infra:** Docker Compose (API + Admin + PostgreSQL).

---

## 2. Estrutura de pastas

```
waas/
├── .env.example              # Variáveis de ambiente (copiar para .env)
├── docker-compose.yml        # API, Admin, DB
├── IMPLEMENTACAO.md          # Este arquivo
├── O_QUE_FALTA.md            # Pendências e prioridades
├── .github/workflows/ci.yml  # CI (lint, test API, build admin)
├── apps/
│   ├── api/                  # Backend FastAPI
│   │   ├── app/
│   │   │   ├── api/v1/       # Routers (auth, blog, catalog, tenant, ...)
│   │   │   ├── config/       # Settings (env)
│   │   │   ├── core/         # deps, security, i18n, rate_limit, module_guard
│   │   │   ├── models/       # SQLAlchemy (User, Tenant, BlogPost, ...)
│   │   │   ├── repositories/ # Acesso a dados
│   │   │   ├── schemas/      # Pydantic (request/response)
│   │   │   ├── services/     # Lógica de negócio
│   │   │   └── main.py       # FastAPI app
│   │   ├── alembic/          # Migrations
│   │   ├── tests/
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   └── admin/                # Frontend Next.js
│       ├── src/
│       │   ├── app/          # Rotas (login, /, /platform/*, /app/*, /admin/catalog)
│       │   ├── components/   # UI (modal, confirm-dialog, layouts, sidebars)
│       │   ├── lib/          # api-client, tenant-api, auth-context, i18n
│       │   └── __tests__/
│       ├── package.json
│       └── Dockerfile
```

---

## 3. Banco de dados e modelos

**IDs:** todos os IDs são `String(32)` (UUID em hex, sem hífens). Chaves estrangeiras seguem o mesmo tipo.

**Principais tabelas:**

| Tabela | Descrição |
|--------|-----------|
| `users` | Usuário global (email, password_hash, name, global_role). |
| `tenants` | Workspace/site (name, slug, status, plan_id, niche_id + branding: logo_url, favicon_url, primary_color, footer_text, timezone, meta_title, meta_description). |
| `user_tenants` | Associação N:N user–tenant com `role` (admin, member, editor). |
| `plans` | Planos (code, name, ...). |
| `niches` | Nichos (code, name, ...). |
| `modules` | Módulos (code, name, ...). Ex.: blog, property, leads, schedule, media. |
| `plan_niche_modules` | Matriz: (plan_id, niche_id, module_id, is_enabled). Define quais módulos o tenant tem por plano+nicho. |
| `blog_posts` | Posts do blog (tenant_id, title, slug, content, status, meta_title, meta_description). |
| `site_pages` | Páginas estáticas (tenant_id, title, slug, content, status, sort_order, meta_*). |
| `property_items` | Imóveis (tenant_id, title, address, status). |
| `leads` | Leads (tenant_id, name, email, source, message). |
| `schedule_items` | Itens de agenda (tenant_id, title, start_at, end_at, status, contact_*). |
| `media_items` | Mídia (tenant_id, name, storage_key, mime_type, size_bytes). |
| `catalog_audit_logs` | Auditoria de alterações no catálogo. |
| `workspace_externals` | Integração externa (tenant_id, external_id, etc.). |
| `integration_apps` | Apps de integração (API key, etc.). |

**Migrations:** `apps/api/alembic/versions/` (001 a 013). Rodar: `alembic upgrade head`.

---

## 4. Autenticação e autorização

### 4.1 Login e JWT

- **POST /api/v1/auth/login** — body: `{ "email", "password" }`. Valida usuário, gera access_token e refresh_token. O access token inclui: `sub` (user id), `tenant_id` (primeiro tenant do usuário, se houver), `role` (nesse tenant), `type: "access"`.
- **POST /api/v1/auth/refresh** — body: `{ "refresh_token" }`. Devolve novo par de tokens; o access continua com o mesmo tenant_id/role do usuário.
- **GET /api/v1/auth/me** — exige `Authorization: Bearer <access_token>`. Resposta: `MeResponse` com `user`, `tenant`, `role`, `global_role`, `enabled_modules` (códigos dos módulos ativos para o tenant).

Tokens são armazenados no frontend (localStorage): `waas-access-token`, `waas-refresh-token`. O admin chama `/me` após login e ao montar; usa o access token em todas as requisições e faz refresh em 401.

### 4.2 Dependências (deps.py)

- **CurrentUserId** — exige Bearer e token tipo access; retorna `sub` (user id). 401 se inválido.
- **TenantIdFromToken** — opcional; retorna `tenant_id` do JWT ou null.
- **RoleFromToken** — opcional; retorna `role` do JWT ou null.
- **RequiredTenantId** — exige tenant no JWT; 403 se não houver.
- **require_active_module("blog" | "property" | "leads" | "schedule" | "media")** — exige JWT com tenant_id e que o módulo esteja ativo para esse tenant (via `CatalogService.get_active_module_codes_for_tenant(tenant_id)`). 403 se o módulo não estiver na matriz plan×niche do tenant.

Módulos ativos: o tenant tem `plan_id` e `niche_id`; a tabela `plan_niche_modules` define quais `module_id` estão habilitados para esse (plan, niche). O serviço retorna os **códigos** dos módulos (ex.: `["blog", "property"]`).

### 4.3 Plataforma (admin global)

- Rotas que exigem **catálogo admin**: usam `CatalogAdminUserId` (core/catalog_admin.py), que verifica se o usuário tem `global_role` em `super_admin` ou `catalog_admin`.
- Rotas de plataforma: **GET /api/v1/platform/tenants**, **GET /api/v1/platform/audit** — exigem esse papel.

---

## 5. API — Endpoints por grupo

Base: **/api/v1**. Respostas padronizadas: `{ "success": true, "data": ..., "error": null }`.

### 5.1 Auth

| Método | Rota | Quem | Descrição |
|--------|------|------|-----------|
| POST | /auth/login | Público | Login → access + refresh token |
| POST | /auth/refresh | Público | Novo par de tokens |
| GET | /auth/me | Autenticado | User, tenant, role, global_role, enabled_modules |

### 5.2 Catálogo (público para leitura)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /catalog/plans | Lista planos ativos |
| GET | /catalog/niches | Lista nichos ativos |
| GET | /catalog/modules | Lista módulos ativos |

### 5.3 Catálogo Admin (global_role catalog_admin/super_admin)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET/POST/PATCH/DELETE | /admin/catalog/plans | CRUD planos |
| GET/POST/PATCH/DELETE | /admin/catalog/niches | CRUD nichos |
| GET/POST/PATCH/DELETE | /admin/catalog/modules | CRUD módulos |
| GET/POST/DELETE | /admin/catalog/matrix | Matriz plan×niche×module |

### 5.4 Plataforma

| Método | Rota | Quem | Descrição |
|--------|------|------|-----------|
| GET | /platform/tenants | Catalog admin | Lista todos os tenants |
| GET | /platform/audit | Catalog admin | Últimos logs de auditoria do catálogo |

### 5.5 Tenant (exige tenant no JWT)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /tenant/settings | Configurações do site (branding, SEO) |
| PATCH | /tenant/settings | Atualiza configurações (parcial) |
| GET/POST | /tenant/pages | Lista / cria página estática |
| GET/PATCH/DELETE | /tenant/pages/{id} | Obtém / atualiza / remove página |
| GET | /tenant/users | Lista membros do tenant |
| POST | /tenant/users | Convida usuário por email (admin) |
| PATCH | /tenant/users/{id} | Altera role do membro (admin) |
| DELETE | /tenant/users/{id} | Remove membro (admin) |

### 5.6 Módulos por tenant (exigem tenant + módulo ativo)

- **Blog:** GET/POST /blog/posts, GET/PATCH/DELETE /blog/posts/{id}
- **Property:** GET/POST /property/items, GET/DELETE /property/items/{id}
- **Leads:** GET/POST /leads, GET /leads/{id}
- **Schedule:** GET/POST /schedule/items, GET/PATCH/DELETE /schedule/items/{id}
- **Media:** GET/POST /media/items, GET/DELETE /media/items/{id}, **POST /media/upload** (multipart)

Todos os list/get/create/update/delete são **scoped por tenant_id** (vindo do JWT). Nenhum endpoint permite acessar dado de outro tenant.

### 5.7 Integração (API key)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /integration/workspaces | Cria workspace externo (header X-Api-Key) |
| GET/PATCH | /integration/workspaces/{external_id} | Obtém/atualiza |
| POST | /integration/workspaces/{id}/suspend | Suspende |
| POST | /integration/workspaces/{id}/reactivate | Reativa |

---

## 6. Frontend — Rotas e painéis

### 6.1 Rotas

| Rota | Layout | Acesso | Conteúdo |
|------|--------|--------|----------|
| /login | — | Público | Formulário de login |
| / | TenantLayout | Autenticado + tenant | Dashboard tenant (métricas: leads, propriedades, posts, agenda) |
| /app/properties | TenantLayout | Tenant + módulo property | CRUD propriedades |
| /app/blog | TenantLayout | Tenant + módulo blog | CRUD blog |
| /app/pages | TenantLayout | Tenant | CRUD páginas estáticas |
| /app/leads | TenantLayout | Tenant + módulo leads | Lista/cria/vê leads |
| /app/schedule | TenantLayout | Tenant + módulo schedule | CRUD agenda |
| /app/media | TenantLayout | Tenant + módulo media | Lista, upload, excluir mídia |
| /app/settings | TenantLayout | Tenant | Configurações do site (nome, logo, meta) |
| /app/users | TenantLayout | Tenant | Membros; admin pode convidar, alterar role, remover |
| /app/integrations, /app/billing | TenantLayout | Tenant | Placeholder "Em breve" |
| /platform | PlatformLayout | Catalog admin | Dashboard plataforma (totais, audit) |
| /platform/tenants | PlatformLayout | Catalog admin | Lista tenants |
| /platform/audit | PlatformLayout | Catalog admin | Log de auditoria |
| /platform/settings | PlatformLayout | Catalog admin | Placeholder |
| /admin/catalog | PlatformLayout | Catalog admin | CRUD planos, nichos, módulos, matriz |

### 6.2 Fluxo após login

- Se o usuário tem **global_role** (super_admin/catalog_admin) e **não tem tenant** → redireciona para **/platform**.
- Se tem **tenant** (e opcionalmente global_role) → redireciona para **/** (dashboard tenant).
- No header: link "Meu workspace" ou "Admin da plataforma" conforme o perfil.

### 6.3 Sidebar tenant

Itens filtrados por **enabled_modules** (vindos de `/me`). Itens sem `module` (Dashboard, Páginas, Configurações, Usuários, etc.) sempre visíveis para quem tem tenant.

### 6.4 Clientes API (frontend)

- **api-client.ts** — login, refresh, getMe, getPlatformTenants, getPlatformAudit. Usado pelo AuthProvider e pelas páginas de plataforma.
- **tenant-api.ts** — todas as chamadas escopadas ao tenant: getTenantSettings, updateTenantSettings; listSitePages, createSitePage, …; listBlogPosts, …; listPropertyItems, …; listLeads, …; listScheduleItems, …; listMediaItems, uploadMediaFile, deleteMediaItem; listTenantMembers, inviteTenantMember, updateTenantMemberRole, removeTenantMember. Todas usam Bearer token e, em 401, tentam refresh e nova requisição.

---

## 7. Configuração e ambiente

### 7.1 Variáveis (API)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| DATABASE_URL | Connection string PostgreSQL (async) | postgresql+asyncpg://waas:waas@localhost:5432/waas |
| JWT_SECRET_KEY | Chave para assinar JWT | string com ≥32 caracteres |
| JWT_ALGORITHM | Algoritmo JWT | HS256 |
| JWT_ACCESS_TOKEN_EXPIRE_MINUTES | Expiração do access token | 30 |
| JWT_REFRESH_TOKEN_EXPIRE_DAYS | Expiração do refresh | 7 |
| DEBUG | Ativa /docs e /redoc | false |
| LOG_LEVEL | Nível de log | INFO |
| CORS_ORIGINS | Origens permitidas (vírgula) | http://localhost:3001 |
| media_upload_dir | Pasta base para upload de mídia | ./uploads |
| media_max_size_bytes | Tamanho máximo por arquivo (bytes) | 10485760 (10 MB) |

### 7.2 Variáveis (Admin)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| NEXT_PUBLIC_API_URL | URL base da API (build-time) | http://localhost:8001 |

Copiar `.env.example` para `.env` e preencher; nunca commitar `.env` com segredos.

---

## 8. Como rodar

### 8.1 Local (sem Docker)

1. **PostgreSQL** rodando (ex.: porta 5432), banco `waas` criado.
2. **API:**  
   `cd apps/api`  
   `pip install -r requirements.txt`  
   `alembic upgrade head`  
   `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
3. **Admin:**  
   `cd apps/admin`  
   `npm install`  
   Definir `NEXT_PUBLIC_API_URL=http://localhost:8000` (ou no .env).  
   `npm run dev` (porta 3000).

### 8.2 Docker Compose

Na raiz de **waas**:

```bash
# Build e subir
docker compose build
docker compose up -d

# Migrations (primeira vez ou após novas migrations)
docker compose exec api alembic upgrade head
```

| Serviço | Porta host | URL |
|---------|------------|-----|
| API | 8001 | http://localhost:8001 |
| Admin | 3001 | http://localhost:3001 |
| PostgreSQL | 5433 | localhost:5433 (user waas, db waas) |

No compose, o admin usa `NEXT_PUBLIC_API_URL=http://localhost:8001` (acesso pelo host). CORS da API deve incluir `http://localhost:3001`.

### 8.3 Usuário de desenvolvimento

Migrations 009 e 010 criam/ajustam um usuário seed:

- **Email:** admin@example.com  
- **Senha:** Dev123!

Esse usuário não tem tenant por padrão; ele entra no **painel plataforma** (/platform). Para testar o painel tenant, é preciso criar um tenant, associar ao usuário em `user_tenants` e, se quiser módulos ativos, definir `plan_id` e `niche_id` no tenant e ter linhas em `plan_niche_modules`.

---

## 9. Fluxos principais (resumo)

1. **Login** → POST /auth/login → access + refresh; frontend guarda tokens e chama GET /auth/me → redireciona para /platform (só admin global) ou / (tenant).
2. **Módulos por tenant** → Tenant tem plan_id e niche_id; CatalogService lê plan_niche_modules e devolve códigos (blog, property, …). Rotas de blog/property/leads/schedule/media usam `require_active_module("...")` e só respondem se o código estiver ativo.
3. **Configurações do site** → GET/PATCH /tenant/settings (qualquer usuário com tenant); dados vêm do modelo Tenant (branding + meta).
4. **Páginas estáticas** → CRUD em /tenant/pages; qualquer usuário com tenant.
5. **Membros do tenant** → GET /tenant/users (todos); POST/PATCH/DELETE só com role admin no tenant.
6. **Upload de mídia** → POST /media/upload (multipart); arquivo salvo em `media_upload_dir/{tenant_id}/{uuid}.ext`; registro em `media_items`.
7. **Plataforma** → Catalog admin gerencia planos, nichos, módulos e matriz; vê lista de tenants e auditoria em /platform/*.

---

## 10. Testes e CI

- **API:** pytest em `apps/api/tests/`. Rodar: `cd apps/api && pytest tests/ -v`.
- **Admin:** Jest + React Testing Library; testes em `src/__tests__/`. Rodar: `cd apps/admin && npm test`.
- **CI:** `.github/workflows/ci.yml` — jobs API (ruff check/format em app, tests, alembic; pytest) e Admin (lint, build). working-directory configurado para `waas/apps/api` e `waas/apps/admin` (repo raiz = Framwork).

---

## 11. O que NÃO está implementado (referência)

- **Front público do site** — aplicação que o visitante vê (por slug/domínio do tenant).
- **Domínio customizado e SSL** por tenant.
- **Editor rico** (WYSIWYG/Markdown) para blog e páginas.
- **Sitemap/robots.txt** por tenant.
- **Analytics** integrado no painel.
- **Faturamento** (Stripe) e limites por plano.
- **Backup/export** por tenant.

Detalhes e prioridades estão em **O_QUE_FALTA.md**.
