# O que está faltando (conforme as rules)

## 1. Testes no Admin (obrigatório pelas rules)

As regras exigem: *"New module/feature: create test coverage alongside"* e *"When editing or adding code: add or update tests"*.

- **Situação:** O app admin não tem nenhum teste automatizado (Jest / React Testing Library).
- **Falta:**
  - Testes para login (form, sucesso, erro).
  - Testes para auth-context (login, logout, getAccessToken, tryRefresh).
  - Testes para o client da API (`api-client.ts` e `catalog-admin-api.ts`) — ao menos com mocks.
  - Testes de componente ou integração para as seções de catálogo (lista, modal create/edit, confirm delete), se fizer sentido para o projeto.

**Ação:** Adicionar `"test": "jest"` (ou similar) no `package.json` do admin, configurar Jest + React Testing Library, e criar testes para os fluxos acima.

---

## 2. CI: working-directory

- **Situação:** O workflow usa `working-directory: apps/api` e `working-directory: apps/admin`.
- **Problema:** Se o **repositório Git** tiver a raiz em **Framwork** (e `waas` for uma pasta dentro), o checkout no GitHub Actions fica na raiz do repo. Nesse caso não existem `apps/api` nem `apps/admin` na raiz — eles estão em `waas/apps/api` e `waas/apps/admin`.
- **Ação:** Se o repo for **Framwork** (raiz = Framwork), ajustar o CI para:
  - `working-directory: waas/apps/api` no job da API.
  - `working-directory: waas/apps/admin` no job do admin.
  - E, se usar cache do npm: `cache-dependency-path: waas/apps/admin/package.json`.

Se o repo for **waas** (raiz = waas), não é necessário mudar nada.

---

## 3. .env.example — variável do Admin

- **Situação:** O `.env.example` documenta variáveis da API. O admin usa `NEXT_PUBLIC_API_URL`.
- **Ação (opcional):** Incluir no `.env.example` um comentário ou linha documentando a URL da API para o front, por exemplo:
  - `# Admin (build-time)`
  - `# NEXT_PUBLIC_API_URL=http://localhost:8000`

---

## 4. Ruff no CI — Alembic

- **Situação:** O job da API roda `ruff check app tests` (não inclui `alembic`). As migrations já foram corrigidas com `ruff --fix`.
- **Risco:** Novas migrations podem ser criadas sem rodar ruff e o CI não falhará por isso.
- **Ação (opcional):** Incluir `alembic` no comando, por exemplo:  
  `ruff check app tests alembic && ruff format --check app tests alembic`  
  Ou documentar que migrations devem ser validadas com ruff antes do commit.

---

## 5. Validação em container (manual)

As regras exigem: *"Validate flow: Test the main flow inside the container"* antes de considerar a entrega feita.

- **Situação:** Não há automação E2E; a validação é manual.
- **Ação:** Antes de dar por concluído um PR/deploy, subir os containers (`docker compose up` em `waas`), testar login no admin, listar/crear/editar/excluir itens do catálogo e um fluxo principal da API. Registrar no PR que a validação foi feita.

---

## 6. Painel Admin — escopo completo (planejamento)

Análise do que o painel admin do tenant deve ter vs. o que existe hoje.

### Sidebar (o que falta hoje)

| Seção       | Rota               | Chave i18n      | Condição                    | API existe? |
|------------|--------------------|-----------------|-----------------------------|-------------|
| Dashboard  | `/`                | nav.dashboard   | Qualquer autenticado       | Sim         |
| Catálogo   | `/admin/catalog`    | nav.catalog     | global_role catalog_admin   | Sim         |
| Propriedades | `/admin/properties` | nav.properties | tenant + módulo property    | Sim         |
| Blog       | `/admin/blog`      | nav.blog        | tenant + módulo blog        | Sim         |
| Leads      | `/admin/leads`     | nav.leads       | tenant + módulo leads       | Sim         |
| Agenda     | `/admin/schedule`  | nav.schedule    | tenant + módulo schedule    | Sim         |
| Mídia      | `/admin/media`     | nav.media       | tenant + módulo media       | Sim         |
| Integrações | `/admin/integrations` | nav.integrations | tenant                      | Parcial     |
| Configurações | `/admin/settings` | nav.settings    | autenticado                 | Não         |
| Usuários   | `/admin/users`     | nav.users       | admin do tenant             | Não         |
| Faturamento | `/admin/billing`  | nav.billing     | link externo                | Não         |

Hoje a sidebar só tem **Painel** e **Catálogo**. Faltam: Propriedades, Blog, Leads, Agenda, Mídia, Integrações, Configurações, Usuários, Faturamento (e filtrar por role/módulo).

### Dashboard (conteúdo real vs. placeholder)

| Widget            | Fonte de dados                          | Situação atual        |
|------------------|-----------------------------------------|------------------------|
| Leads recentes   | GET /api/v1/leads?limit=5               | Não implementado      |
| Total propriedades | GET /api/v1/property/items (contar)   | Não implementado       |
| Últimos posts    | GET /api/v1/blog/posts?limit=5          | Não implementado      |
| Resumo agenda    | GET /api/v1/schedule/items (período)    | Não implementado      |
| Ações rápidas    | —                                       | Existe (link Catálogo) |
| Atividade recente | —                                       | Placeholder vazio      |

### Header (melhorias)

- **Falta:** Nome do tenant, menu do usuário (dropdown: Perfil, Configurações, Sair), “Admin do catálogo” só se `global_role` permitir.
- **Opcional:** Busca global, notificações (dependem de API).

### Backend — gaps críticos para o painel

1. **JWT sem tenant_id/role** — O token atual só tem `user.id`. Os endpoints tenant-scoped precisam de `tenant_id` (e role) no JWT. Ajustar `create_access_token` e o login para incluir tenant e role; refresh deve preservar tenant.
2. **GET /api/v1/auth/me** — Não existe. Necessário para: nome do tenant, role, `global_role`, módulos habilitados (plan+niche). Usado na sidebar (filtrar itens), header (nome do tenant, menu) e dashboard (saber quais widgets mostrar).
3. **Opcional:** GET /api/v1/dashboard (agregados); GET/PATCH /api/v1/tenant/settings; CRUD de usuários do tenant; GET /api/v1/tenant/integrations (status).

### Ordem sugerida de implementação

1. **Backend:** JWT com tenant_id + role; endpoint GET /auth/me (user, tenant, role, global_role, enabled_modules).
2. **Admin:** Consumir /me no login ou após; guardar tenant e módulos no contexto; filtrar sidebar por role e módulos; mostrar nome do tenant no header; menu do usuário (dropdown).
3. **Sidebar:** Incluir rotas para Propriedades, Blog, Leads, Agenda, Mídia (e depois Integrações, Configurações, Usuários, Faturamento), com páginas mínimas ou “em breve”.
4. **Dashboard:** Widgets com dados reais (leads, propriedades, blog, agenda) usando os endpoints existentes, após o JWT/me estar pronto.

---

## 7. Dois painéis: Plataforma (dono do SaaS) vs Tenant (usuário)

São **dois painéis distintos** no mesmo app, com layouts e sidebars diferentes.

### Visão geral

| Aspecto | Painel Plataforma (dono do SaaS) | Painel Tenant (usuário do workspace) |
|--------|----------------------------------|--------------------------------------|
| **Quem acessa** | `global_role` em `super_admin` ou `catalog_admin` | Usuários com tenant em `user_tenants` |
| **Contexto** | Sem tenant; escopo global | Um tenant por sessão (`tenant_id` no JWT) |
| **Objetivo** | Catálogo, tenants, auditoria, config da plataforma | Conteúdo do workspace: propriedades, blog, leads, agenda, mídia |
| **Base URL** | `/platform` ou `/admin` | `/` ou `/app` |

Um mesmo usuário pode ter **os dois** (ex.: catalog_admin + um tenant). Nesse caso: após login, oferecer **"Admin da plataforma"** ou **"Meu workspace"** (ou switcher no header).

### Painel Plataforma (dono do SaaS)

**Sidebar:** Dashboard (`/platform`), Catálogo (`/admin/catalog`), Tenants (`/platform/tenants`), Auditoria (`/platform/audit`), Configurações (`/platform/settings`), Usuários globais (`/platform/users` opcional).

**Header:** "WaaS Plataforma"; se tiver tenant também, link "Ir para meu workspace"; menu usuário.

**Dashboard:** Total de tenants, planos, últimas alterações no catálogo (audit).

**APIs a criar:** GET /platform/tenants, GET /platform/audit (ou catalog/audit), config e users opcionais.

### Painel Tenant (usuário)

**Sidebar:** Painel (`/` ou `/app`), Propriedades, Blog, Leads, Agenda, Mídia, Integrações, Configurações, Usuários, Faturamento (link externo). Itens filtrados por **módulos ativos** (plan+niche do tenant).

**Header:** Nome do tenant; se for catalog_admin, link "Admin da plataforma"; menu usuário.

**Dashboard:** Widgets com dados reais (leads, propriedades, blog, agenda).

**APIs:** Já existem (property, blog, leads, schedule, media); faltam JWT com tenant_id, /me, e opcionalmente tenant/settings e tenant/users.

### Fluxo após login

1. Se **só** global_role (sem tenant) → redireciona `/platform`.
2. Se **só** tenant → redireciona `/` ou `/app`.
3. Se **os dois** → escolha "Admin da plataforma" ou "Meu workspace" (ou padrão + switcher no header).

### Rotas frontend (resumo)

| Painel | Rotas | Layout |
|--------|-------|--------|
| Plataforma | `/platform`, `/admin/catalog`, `/platform/tenants`, `/platform/audit`, `/platform/settings` | PlatformLayout |
| Tenant | `/`, `/app/properties`, `/app/blog`, `/app/leads`, `/app/schedule`, `/app/media`, `/app/settings`, `/app/users`, `/app/billing` | TenantLayout |

---

## Resumo

| Item                         | Prioridade | Ação                                              |
|-----------------------------|-----------|----------------------------------------------------|
| Testes no admin             | Alta      | Jest + RTL; testes de login, auth, API client, CRUD |
| CI working-directory        | Média     | Ajustar se o repo for Framwork (raiz acima de waas) |
| .env.example (admin)        | Baixa     | Documentar NEXT_PUBLIC_API_URL                      |
| Ruff incluindo alembic no CI| Baixa     | Incluir `alembic` no ruff check/format             |
| Validação em container      | Obrigatória (manual) | Sempre validar fluxo no Docker antes do PR   |
| Dois painéis (Plataforma + Tenant) | Alta | Sec. 7; dois layouts, rotas /platform vs /app; JWT/me e redirecionamento pós-login |
| Painel admin (JWT/me + sidebar + dashboard) | Alta | Ver sec. 6; JWT/me primeiro, depois sidebar e widgets |

---

## 8. Features para painel de gestão de sites (WaaS)

Análise comparando o que o WaaS já tem com o que é esperado em painéis de gestão de sites/CMS (baseado em referências de mercado: Strapi, Pantheon, Wix, SaaS admin panels, multi-site management).

### O que o WaaS já tem

| Área | Situação |
|------|----------|
| **Auth** | Login, refresh, JWT com tenant_id/role, GET /me (user, tenant, enabled_modules). |
| **Dois painéis** | Plataforma (catálogo, tenants, auditoria) e Tenant (dashboard, módulos). |
| **Catálogo** | Planos, nichos, módulos, matriz plan×nicho×módulo (API + UI admin). |
| **Conteúdo** | Blog (posts CRUD), Propriedades (itens CRUD), Leads (listar/criar/ver), Agenda (itens CRUD), Mídia (listar/criar metadata/excluir). |
| **Integração** | API de workspaces (provisioning por API key). |
| **Multi-tenant** | Tenant por JWT; módulos ativos por plan+niche. |

### O que falta para um painel completo de “gerenciar site”

#### 8.1 Site / configuração do site

| Feature | Descrição | Prioridade |
|--------|-----------|------------|
| **Configurações do tenant/site** | Nome do site, logo, favicon, cores, rodapé, timezone. Hoje o tenant tem name, slug, status, plan_id, niche_id — sem campos editáveis pelo usuário (branding). | Alta |
| **Domínio customizado** | Associar domínio ao site (ex.: meusite.com → tenant). API e UI para adicionar/validar domínio. | Média |
| **SSL** | Certificado (Let’s Encrypt ou similar) ou indicação de “HTTPS ativo”. | Média (se houver domínio) |
| **Páginas estáticas** | Além do blog: páginas como “Sobre”, “Contato”, “Home” editáveis (título, slug, conteúdo, ordem). Hoje só blog posts. | Alta |
| **Menus / navegação** | Definir menu do site (itens, ordem, link interno/externo). | Média |
| **Tema / template** | Escolher tema ou template do site (lista de temas ativos por plan/niche). | Média |

#### 8.2 Conteúdo e mídia

| Feature | Descrição | Prioridade |
|--------|-----------|------------|
| **Upload de mídia** | POST para upload de arquivo (imagem/PDF) → retornar storage_key (e opcionalmente URL). Hoje mídia é só metadata (name, storage_key, mime_type, size). | Alta |
| **Editor rico** | Blog e páginas: editor WYSIWYG ou Markdown no admin (hoje campos texto simples). | Média |
| **Agendamento de publicação** | Publicar post/página em data/hora programada. | Baixa |
| **Rascunho vs publicado** | Já existe status (draft/published) no blog; garantir mesmo conceito em “páginas” quando existirem. | — |

#### 8.3 SEO e descoberta

| Feature | Descrição | Prioridade |
|--------|-----------|------------|
| **SEO por página/post** | Meta title, meta description, OG image, slug editável. | Alta |
| **Sitemap** | Gerar ou expor sitemap (XML) do site do tenant. | Média |
| **robots.txt** | Configuração ou geração de robots.txt por tenant. | Baixa |

#### 8.4 Usuários e permissões

| Feature | Descrição | Prioridade |
|--------|-----------|------------|
| **Usuários do tenant** | CRUD de membros do tenant (user_tenants): convite, role (admin/editor/member), desativar. Hoje não há API nem tela. | Alta |
| **Roles e permissões** | Definir o que cada role pode fazer (ex.: editor só blog, admin tudo). Hoje role existe no JWT mas sem regras granulares. | Média |
| **Log de atividade** | Histórico de ações no tenant (quem editou o quê). Opcional por tenant (hoje só audit do catálogo na plataforma). | Baixa |

#### 8.5 Formulários e leads

| Feature | Descrição | Prioridade |
|--------|-----------|------------|
| **Formulários configuráveis** | Criar formulários (campos, destino) e embutir no site; leads vinculados ao formulário. Hoje leads são genéricos (name, email, source, message). | Média |
| **Notificação de lead** | E-mail ou webhook ao receber lead. | Baixa |

#### 8.6 Analytics e monitoramento

| Feature | Descrição | Prioridade |
|--------|-----------|------------|
| **Métricas no dashboard** | Dashboard tenant com dados reais: total de leads, últimos posts, itens da agenda, total de propriedades (APIs já existem). | Alta |
| **Analytics integrado** | Visualizações por página, visitas, origem (ou integração com Google Analytics). | Média |
| **Notificações / alertas** | Avisos no painel (ex.: lead novo, agendamento próximo). | Baixa |

#### 8.7 Front público do site

| Feature | Descrição | Prioridade |
|--------|-----------|------------|
| **Front do site** | Aplicação ou páginas que o visitante vê (site público do tenant). Hoje o projeto é só API + admin; não há “front” por tenant. | Alta |
| **Preview** | Visualizar alterações antes de publicar. | Média |
| **Multi-idioma (conteúdo)** | Conteúdo do site em vários idiomas (além do i18n do painel). | Baixa |

#### 8.8 Operação e confiabilidade

| Feature | Descrição | Prioridade |
|--------|-----------|------------|
| **Backup** | Export ou backup dos dados do tenant. | Baixa |
| **Faturamento** | Já previsto na sidebar (link externo); integração com Stripe ou similar para planos. | Média |
| **Limites por plano** | Limitar uso por plano (ex.: N posts, N leads, N mídias). | Média |

### Resumo de prioridade (para “gerenciar site”)

1. **Alta:** Configurações do tenant/site (branding), páginas estáticas, upload de mídia, SEO por página/post, usuários do tenant, dashboard com métricas reais, **front do site** (aplicação pública do tenant).
2. **Média:** Domínio/SSL, menus, tema/template, editor rico, sitemap, roles/permissões, formulários configuráveis, analytics, preview, billing, limites por plano.
3. **Baixa:** Agendamento de publicação, robots.txt, log de atividade por tenant, notificação de lead, alertas, backup, multi-idioma do conteúdo.

### Observação

O WaaS hoje é um **back-office (API + painel admin)** para gerenciar catálogo, tenants e conteúdo. Para ser um painel que “gerencia site” de ponta a ponta, falta principalmente: **configurações do site**, **páginas estáticas**, **upload de mídia**, **SEO**, **usuários do tenant**, **dashboard com dados reais** e, de forma crítica, o **front do site** (o que o visitante acessa no domínio do tenant).
