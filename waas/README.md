# WaaS — Website as a Service

SaaS multi-tenant: sites/landing pages por assinatura. Provisionamento via API externa (workspace de billing fora do sistema); sem billing interno.

## Stack

- **Backend:** FastAPI, Pydantic, SQLAlchemy (async), PostgreSQL
- **Frontend (admin):** Next.js, TypeScript, Tailwind (em `apps/admin`)
- **Infra:** Docker, migrations Alembic

## Estrutura

```
waas/
├── apps/
│   ├── api/          # FastAPI
│   └── admin/        # Next.js (painel tenant)
├── packages/         # Compartilhados (types, api-client)
├── docker-compose.yml
└── .env.example
```

## Como rodar (API + DB)

1. Copie `.env.example` para `.env` e ajuste (obrigatório: `JWT_SECRET_KEY`).
2. Na raiz do monorepo:
   ```bash
   docker compose up -d
   ```
3. Rode as migrations (uma vez):
   ```bash
   cd apps/api && alembic upgrade head
   ```
   (Ou use um job/script que rode no startup do container.)
4. API: http://localhost:8000 — Docs (se DEBUG): http://localhost:8000/docs

## Provisionamento (integração)

Autenticação por API key (headers `X-Api-Key`, `X-Api-Secret`). Endpoints:

- `POST /api/v1/integration/workspaces` — criar workspace (tenant)
- `GET /api/v1/integration/workspaces/:external_id` — consultar
- `PATCH /api/v1/integration/workspaces/:external_id` — atualizar plano/nicho
- `POST /api/v1/integration/workspaces/:external_id/suspend` — suspender
- `POST /api/v1/integration/workspaces/:external_id/reactivate` — reativar

Crie uma `IntegrationApp` (public_key, secret_key_hash, app_name) no banco para obter credenciais.

## Desenvolvimento local (API)

```bash
cd apps/api
python -m venv .venv
.venv\Scripts\activate   # ou source .venv/bin/activate
pip install -r requirements.txt
# PostgreSQL rodando (local ou docker)
set DATABASE_URL=postgresql+asyncpg://waas:waas@localhost:5432/waas
set JWT_SECRET_KEY=dev-secret-min-32-chars
alembic upgrade head
uvicorn app.main:app --reload
```

Testes (na pasta `apps/api`): `python -m pytest tests/ -v`  
Cobertura (meta ≥80%): `python -m pytest tests/ --cov=app --cov-report=term-missing`

## i18n (English, Portuguese, Spanish)

- **API:** Send header `Accept-Language: en`, `pt`, or `es`. Error messages (`detail`) are returned in the requested language. Locale files: `apps/api/app/locales/{en,pt,es}.json`.
- **Admin (frontend):** Language switcher in the header; locale stored in `localStorage` (`waas-locale`). Messages: `apps/admin/src/lib/i18n/messages/{en,pt,es}.json`. Use `useI18n().t("home.title")` in client components.

## Regras e plano

Arquitetura e fases: ver `waas-architecture-plan.md` na raiz do repositório. Alinhado às project-rules (multi-tenant, `tenant_id` em todas as tabelas de domínio, respostas `{ success, data, error }`).
