# WaaS — Status dos dois painéis

**Atualizado:** análise do que existe vs. o que falta. Build e Docker devem ser executados pelo agente (pipeline completo).

---

## 1. Os dois painéis

| Painel | Rota base | Quem usa | Layout |
|--------|-----------|----------|--------|
| **Painel da plataforma (admin WaaS)** | `/platform`, `/admin/catalog` | Operador (super_admin / catalog_admin) | PlatformLayout, PlatformSidebar |
| **Painel do tenant (cliente)** | `/`, `/app/*` | Cliente (usuário com tenant) | TenantLayout, TenantSidebar |

---

## 2. Painel da plataforma — O QUE JÁ TEM

### Rotas e funcionalidade
- **`/platform`** — Dashboard: contagem de tenants, audit, link “Ver lista”, botão “Novo briefing” → `/onboarding`. Catálogo (link).
- **`/platform/briefings`** — Lista briefings, filtro por status, busca, provisionar (modal), “Criar briefing” no empty state → `/onboarding`. Design dark.
- **`/platform/provision/[briefingId]`** — Progresso do provisionamento (polling), 10 passos.
- **`/platform/tenants`** — Lista tenants, botão “Novo briefing” (topo + empty state) → `/onboarding`.
- **`/platform/audit`** — Log de auditoria (lista).
- **`/platform/integrations`** — Status Cloudflare, Git, SMTP, Domain (somente leitura, env). Testes Cloudflare e SMTP.
- **`/platform/settings`** — Placeholder “Em breve”.
- **`/admin/catalog`** — Planos, nichos, módulos, matriz (CRUD). Título/subtítulo no tema escuro.

### API (platform)
- GET/POST/PATCH/DELETE briefings, POST provision, GET provision status, GET tenants, GET audit, GET integrations/status, POST test cloudflare/smtp.

### Design
- Layout escuro (bg #0a0b0f, surface #111318), sidebar com ícones SVG, nav ativo com borda azul, header/footer escuros, LanguageSwitcher variant dark.

---

## 3. Painel da plataforma — O QUE FALTA

- **`/platform/tenants/[id]`** — Página de detalhe do tenant (WAAS_IMPLEMENTACAO_IA Phase 1).
- **Configurações editáveis** — Hoje integrações são só leitura (env). Falta PATCH `/platform/settings` e tela para editar Cloudflare, Git, SMTP, etc. (se for desejado).
- **Slack / notificações** — Opcional no doc; não implementado.

---

## 4. Painel do tenant — O QUE JÁ TEM

### Rotas e funcionalidade
- **`/`** — Dashboard: leads, properties, posts, schedule (cards), “Ir ao catálogo” (se platform admin), atividade recente.
- **`/app/properties`** — CRUD property (módulo `property`).
- **`/app/blog`** — CRUD posts (módulo `blog`).
- **`/app/pages`** — CRUD site pages.
- **`/app/leads`** — Lista leads (módulo `leads`).
- **`/app/schedule`** — CRUD schedule (módulo `schedule`).
- **`/app/media`** — Upload e CRUD media (módulo `media`).
- **`/app/reviews`** — CRUD reviews (módulo `reviews`).
- **`/app/integrations`** — Integrações do tenant.
- **`/app/settings`** — Configurações do tenant.
- **`/app/users`** — Usuários do tenant.
- **`/app/billing`** — Produtos Stripe (módulo `stripe_payments`), lista quando ativo.

### API (tenant-scoped)
- Auth, catalog (read), tenant settings, blog, property, leads, schedule, media, reviews, payments/products, site_pages, tenant users, integration workspaces.

### Sidebar tenant
- Itens por módulo ativo: dashboard, properties, blog, pages, leads, schedule, media, reviews, integrations, settings, users, billing (stripe_payments).

### Design
- TenantLayout ainda em tema claro (sidebar/header brancos). Dashboard e várias páginas em cinza/branco.

---

## 5. Painel do tenant — O QUE FALTA

- **Alinhar ao design system** — Sidebar/header do tenant em dark (como no platform), cores #0a0b0f, #111318, ícones, nav ativo.
- **Módulos por implementar (Phase 2 doc):** team, faq, map_locations, menu, chat_widget, newsletter — backend e/ou frontend conforme ordem do doc.
- **Páginas placeholder** — Algumas rotas podem estar “coming soon” ou mínimas; revisar uma a uma.

---

## 6. Outros

- **Onboarding** — `/onboarding`: formulário público de briefing (wizard).
- **Login** — `/login`: auth.
- **Site público** — `apps/site`: site por tenant (Phase 3 do doc).
- **Migrations** — 001–018 + 024 (stripe_products). 019–023 (team, faq, menu, locations, newsletter) conforme doc.

---

## 7. Pipeline (o agente deve executar)

1. **Lint:** `ruff check app/` e `ruff format app/` (api). Admin: `npm run lint` (se npm no PATH).
2. **Testes:** `pytest tests/` (api). Admin: `npx tsc --noEmit`.
3. **Build:** `python -c "from app.main import app; ..."` (api). Admin: `npm run build` (feito dentro do Dockerfile).
4. **Docker:** `docker compose -f waas/docker-compose.yml build api admin` depois `up -d`.
5. **Logs:** `docker compose logs api admin --tail=50`; corrigir erros antes de dar por concluído.

**Última execução (pipeline):**
- API: ruff OK, 104 pytest passed, import OK.
- Admin: build feito dentro do Docker (Next.js compiled successfully).
- Docker: build api + admin OK; up -d OK; api e admin healthy. Logs: api "Application startup complete", admin "Ready".
- Nota: no ambiente do agente `npm` pode não estar no PATH; lint/build do admin podem ser feitos localmente ou o build já é validado pelo Docker build.
