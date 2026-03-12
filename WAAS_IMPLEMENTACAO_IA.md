# WaaS — Guia de Implementação com IA (Cursor)

> **Como usar este documento:** Cole o bloco `## CONTEXTO BASE` no início de cada conversa no Cursor. Depois cole o prompt da task que deseja implementar. A IA terá contexto completo para gerar código correto e consistente com o projeto.

---

## CONTEXTO BASE

> ⚠️ **Cole este bloco no Cursor antes de qualquer prompt específico.**

```
Projeto: WaaS (Website as a Service) — plataforma multi-tenant para venda de sites por assinatura.

Stack:
- Backend: FastAPI (Python 3.11), SQLAlchemy async, PostgreSQL, Alembic, JWT (python-jose), bcrypt, SlowAPI
- Frontend: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- Infra: Docker Compose

Estrutura de pastas:
waas/
├── apps/
│   ├── api/                     ← Backend FastAPI
│   │   └── app/
│   │       ├── api/v1/          ← Routers (auth, blog, catalog, tenant, platform, integration)
│   │       ├── config/          ← settings.py (env vars)
│   │       ├── core/            ← deps.py, security.py, module_guard.py
│   │       ├── models/          ← SQLAlchemy models
│   │       ├── repositories/    ← Acesso a dados
│   │       ├── schemas/         ← Pydantic schemas
│   │       ├── services/        ← Lógica de negócio
│   │       └── main.py
│   └── admin/                   ← Frontend Next.js
│       └── src/
│           ├── app/             ← Rotas Next.js (App Router)
│           ├── components/      ← UI components
│           └── lib/             ← api-client.ts, tenant-api.ts, auth-context.tsx

Padrões obrigatórios:
- Resposta API sempre: { "success": true, "data": ..., "error": null }
- IDs: String(32) UUID hex sem hífens — gerar com: uuid.uuid4().hex
- Auth: JWT Bearer token. Dependências: CurrentUserId, RequiredTenantId, CatalogAdminUserId
- Módulos: require_active_module("codigo") protege rotas de módulo
- Roles de tenant: admin | member | editor
- Global roles: super_admin | catalog_admin
- Migrations Alembic: pasta apps/api/alembic/versions/, seguir padrão 001–013 existentes

Modelos existentes (já implementados):
- User, Tenant, UserTenant, Plan, Niche, Module, PlanNicheModule
- BlogPost, SitePage, PropertyItem, Lead, ScheduleItem, MediaItem
- CatalogAuditLog, WorkspaceExternal, IntegrationApp

Banco existente: tabelas com prefixo correto, FKs em String(32)
Frontend: usa Tailwind CSS, padrão dark theme (bg #0a0b0f), fonte Syne + DM Sans
```

---

## VISÃO GERAL DO PRODUTO

### Fluxo de Venda (MVP Manual)

```
1. Cliente acessa landing page → escolhe plano
2. Pagamento (manual / Stripe fase 2)
3. Cliente preenche briefing no Portal Público (/onboarding)
4. Briefing chega no Workspace do operador (notificação Slack/email)
5. Operador clica em "Provisionar" no Painel da Plataforma
6. Sistema executa automaticamente:
   ├── Cria tenant no banco
   ├── Cria subdomínio no Cloudflare DNS
   ├── Cria repositório Git a partir do template
   ├── Cria usuário admin do tenant
   └── Envia email de boas-vindas
7. Cliente acessa painel e edita/configura seu site
```

### Arquitetura

| Camada | Tech | Responsabilidade |
|---|---|---|
| Backend API | FastAPI + PostgreSQL | Core, auth, multi-tenant, módulos |
| Admin / Workspace | Next.js `/platform` | Operador gerencia todos os tenants |
| Tenant Panel | Next.js `/app` | Cliente gerencia o próprio site |
| Provisioning Service | Python + Cloudflare API | DNS automático na provisão |
| Site Público | Next.js `apps/site` | Site final que o visitante acessa |
| Integrações | Webhooks + REST | Cloudflare, GitHub, SMTP, Stripe, Meta |

---

## FASE 0 — FUNDAÇÃO (fazer primeiro)

### Task 0.1 — Novos campos no modelo Tenant

**Prompt para o Cursor:**
```
No projeto WaaS (contexto colado acima), criar migration Alembic para adicionar os seguintes campos ao modelo Tenant existente em apps/api/app/models/tenant.py:

Campos a adicionar:
- subdomain: String(100), unique=True, nullable=True, index=True
- custom_domain: String(255), nullable=True
- cf_record_id: String(50), nullable=True  ← ID do registro DNS no Cloudflare
- provisioning_status: Enum('pending','provisioning','active','failed'), default='pending', server_default='pending'
- provisioned_at: DateTime(timezone=True), nullable=True
- git_repo_url: String(255), nullable=True
- welcome_email_sent: Boolean, default=False, server_default='false'

Criar também o schema Pydantic TenantUpdate para incluir os novos campos (nullable/optional).
Arquivo da migration: apps/api/alembic/versions/014_tenant_new_fields.py
Seguir exatamente o padrão das migrations existentes (013 e anteriores).
```

---

### Task 0.2 — Tabela briefings

**Prompt para o Cursor:**
```
No projeto WaaS, criar o modelo Briefing completo:

1. Model SQLAlchemy em apps/api/app/models/briefing.py:

class Briefing(Base):
    __tablename__ = "briefings"
    id: String(32) PK default uuid4().hex
    # Dados do cliente
    client_name: String(200) not null
    client_email: String(255) not null
    client_phone: String(50) nullable
    # Configuração do site
    plan_code: String(50) not null
    niche_code: String(50) not null
    slug_requested: String(100) nullable  ← slug desejado pelo cliente
    business_name: String(200) not null
    business_description: Text nullable
    slogan: String(300) nullable
    # Identidade visual
    logo_url: String(500) nullable
    primary_color: String(7) nullable  ← hex #RRGGBB
    secondary_color: String(7) nullable
    # Localização
    address: String(500) nullable
    city: String(100) nullable
    state: String(50) nullable
    zip_code: String(20) nullable
    # Social
    social_links: JSON nullable  ← { instagram, facebook, whatsapp, linkedin }
    # Módulos
    modules_requested: JSON nullable  ← ["blog", "leads", "schedule"]
    # Domínio
    use_custom_domain: Boolean default False
    custom_domain_requested: String(255) nullable
    # Status e controle
    notes: Text nullable  ← observações livres do cliente
    status: Enum('pending','provisioning','provisioned','failed') default='pending'
    tenant_id: String(32) FK→tenants.id nullable  ← preenchido após provisão
    provisioned_at: DateTime nullable
    created_at: DateTime default now
    updated_at: DateTime onupdate now

2. Schema Pydantic em apps/api/app/schemas/briefing.py:
   - BriefingCreate (campos do cliente, sem status/tenant_id)
   - BriefingResponse (todos os campos)
   - BriefingUpdate (status, tenant_id, provisioned_at — para uso interno)

3. Repository em apps/api/app/repositories/briefing_repository.py:
   - get_by_id, list_all(status_filter=None), create, update, delete

4. Migration: apps/api/alembic/versions/015_briefings.py

Seguir padrão exato do projeto (ver BlogPost como referência de model completo).
```

---

### Task 0.3 — Tabela tenant_integrations

**Prompt para o Cursor:**
```
No projeto WaaS, criar o sistema de integrações por tenant:

1. Model SQLAlchemy em apps/api/app/models/tenant_integration.py:

class TenantIntegration(Base):
    __tablename__ = "tenant_integrations"
    id: String(32) PK
    tenant_id: String(32) FK→tenants.id not null, index=True
    integration_code: String(50) not null  ← ver códigos abaixo
    is_enabled: Boolean default False
    config_encrypted: Text nullable  ← JSON criptografado (chaves sensíveis)
    config_public: Text nullable     ← JSON texto claro (IDs públicos)
    created_at: DateTime default now
    updated_at: DateTime onupdate now
    __table_args__ = UniqueConstraint('tenant_id', 'integration_code')

Códigos válidos de integration_code:
google_oauth, meta_pixel, stripe, google_maps, whatsapp, 
mailchimp, brevo, ga4, google_reviews, calendly, tidio

2. Service em apps/api/app/services/integration_service.py:
   - Usar cryptography.fernet para criptografar/descriptografar config_encrypted
   - Chave master em settings: ENCRYPTION_KEY (Fernet key base64)
   - get_config(tenant_id, code) → dict descriptografado
   - set_config(tenant_id, code, public_data: dict, secret_data: dict)
   - list_integrations(tenant_id) → lista sem expor dados criptografados
   - Os dados secretos NUNCA devem ser retornados na API — apenas booleano "configured: true"

3. Schema Pydantic em apps/api/app/schemas/tenant_integration.py:
   - IntegrationConfigSet (public_data: dict, secret_data: dict)
   - IntegrationResponse (integration_code, is_enabled, configured: bool, config_public: dict)

4. Migration: apps/api/alembic/versions/016_tenant_integrations.py

5. Adicionar ENCRYPTION_KEY ao apps/api/app/config/settings.py

Adicionar cryptography ao requirements.txt.
```

---

### Task 0.4 — Services de infraestrutura

**Prompt para o Cursor:**
```
No projeto WaaS, criar os seguintes services de infraestrutura em apps/api/app/services/:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. cloudflare_service.py
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Classe CloudflareService com métodos async:

async def create_subdomain(slug: str) -> str:
  """
  Cria registro CNAME no Cloudflare:
  {slug}.{CF_BASE_DOMAIN} → {CF_CNAME_TARGET}
  Retorna o cf_record_id (String) para poder deletar depois.
  """
  POST https://api.cloudflare.com/client/v4/zones/{CF_ZONE_ID}/dns_records
  Headers: Authorization: Bearer {CF_API_TOKEN}, Content-Type: application/json
  Body: { "type": "CNAME", "name": f"{slug}.{CF_BASE_DOMAIN}", "content": CF_CNAME_TARGET, "ttl": 1, "proxied": true }
  Retornar result["id"]

async def delete_subdomain(record_id: str) -> bool:
  DELETE https://api.cloudflare.com/client/v4/zones/{CF_ZONE_ID}/dns_records/{record_id}

Usar httpx AsyncClient. Variáveis via settings:
CF_ZONE_ID, CF_API_TOKEN, CF_BASE_DOMAIN (ex: "waasfl.com"), CF_CNAME_TARGET

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. git_service.py
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Classe GitService com método async:

async def create_site_repo(tenant_id: str, slug: str) -> str:
  """
  Faz fork do repositório template no GitHub.
  Retorna a URL do novo repositório.
  """
  POST https://api.github.com/repos/{GIT_TEMPLATE_OWNER}/{GIT_TEMPLATE_REPO}/forks
  Headers: Authorization: Bearer {GIT_TOKEN}, Accept: application/vnd.github+json
  Body: { "name": f"waas-site-{slug}", "default_branch_only": true }
  Retornar clone_url do resultado

Variáveis: GIT_TOKEN, GIT_TEMPLATE_OWNER, GIT_TEMPLATE_REPO

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. email_service.py
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Classe EmailService com métodos async usando aiosmtplib:

async def send_welcome_tenant(to_email: str, name: str, panel_url: str, subdomain: str, temp_password: str)
async def send_briefing_notification(operator_email: str, briefing: dict)
async def send_provisioning_failed(to_email: str, briefing_id: str, error: str)

Templates HTML inline (não usar arquivos externos).
Variáveis: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, OPERATOR_EMAIL
Adicionar aiosmtplib ao requirements.txt.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. Adicionar ao settings.py todas as variáveis:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CF_ZONE_ID, CF_API_TOKEN, CF_BASE_DOMAIN, CF_CNAME_TARGET
GIT_TOKEN, GIT_TEMPLATE_OWNER, GIT_TEMPLATE_REPO
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, OPERATOR_EMAIL
SLACK_WEBHOOK_URL (opcional, para notificações)
ENCRYPTION_KEY (Fernet key)
PANEL_BASE_URL (ex: "https://app.waasfl.com")
```

---

## FASE 1 — PROVISIONAMENTO (core da integração)

### Task 1.1 — API de Provisionamento

**Prompt para o Cursor:**
```
No projeto WaaS, criar o sistema de provisionamento automático de tenants.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Service: apps/api/app/services/provisioning_service.py
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Classe ProvisioningService com método principal:

async def provision(briefing_id: str, db: AsyncSession) -> ProvisionResult:
  """
  Executa os 10 passos de provisionamento em sequência.
  Salva o log de cada passo em provisioning_logs.
  Em caso de falha em qualquer passo, atualiza status e lança exceção.
  """

Passos (em ordem):
  1. Buscar briefing → validar status == 'pending'
  2. Gerar slug único: verificar se já existe, adicionar sufixo se necessário
  3. Criar Tenant no banco (plan, niche, name, slug, status='provisioning')
  4. Chamar CloudflareService.create_subdomain(slug) → salvar cf_record_id no tenant
  5. Chamar GitService.create_site_repo(tenant_id, slug) → salvar git_repo_url no tenant
  6. Gerar senha temporária segura (12 chars, letras+números+especial)
  7. Criar User com email do briefing + senha temporária
  8. Criar UserTenant linkando user ao tenant com role='admin'
  9. Chamar EmailService.send_welcome_tenant(...)
  10. Atualizar: tenant.provisioning_status='active', briefing.status='provisioned'

Retornar: ProvisionResult { tenant_id, subdomain, panel_url, admin_email }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. Model: provisioning_logs (migration 017)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
campos: id, briefing_id (FK), step_number (int), step_name (str), 
        status (success|failed|skipped), message (text), created_at

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. Router: apps/api/app/api/v1/platform/provision.py
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Endpoints:

POST /api/v1/platform/provision
  Auth: CatalogAdminUserId
  Body: ProvisionRequest { briefing_id: str, override_slug: str | None }
  Executa ProvisioningService.provision()
  Retorna: { success: true, data: ProvisionResult }

GET /api/v1/platform/provision/{briefing_id}/status
  Auth: CatalogAdminUserId
  Retorna: { briefing_status, provisioning_status, steps: [{ step, name, status, message }] }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. Router: apps/api/app/api/v1/platform/briefings.py
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GET    /api/v1/platform/briefings          ← lista, filtro ?status=pending
POST   /api/v1/platform/briefings          ← criar (público, para o portal de briefing)
GET    /api/v1/platform/briefings/{id}     ← detalhe
PATCH  /api/v1/platform/briefings/{id}     ← atualizar (admin only)
DELETE /api/v1/platform/briefings/{id}     ← deletar (admin only)

Registrar ambos os routers em apps/api/app/main.py.
```

---

### Task 1.2 — Frontend: Página de Briefings

**Prompt para o Cursor:**
```
No projeto WaaS (Next.js 14, App Router, TypeScript, Tailwind CSS, dark theme),
criar a página apps/admin/src/app/platform/briefings/page.tsx

Layout: usar PlatformLayout existente
Visual: seguir padrão do projeto (bg #0a0b0f, surface #111318, accent #4F6EF7)

Funcionalidades:
1. Tabela de briefings com colunas:
   - Cliente (nome + email)
   - Plano (badge colorido: starter=cyan, pro=azul, enterprise=roxo)
   - Nicho (badge com emoji do nicho)
   - Módulos solicitados (chips compactos)
   - Status (badge: pending=laranja, provisioning=azul pulsante, provisioned=verde, failed=vermelho)
   - Data de criação
   - Ações

2. Filtro por status (tabs: Todos | Pendentes | Provisionados | Falhos)

3. Busca por nome/email

4. Coluna "Ações":
   - Se status == 'pending': botão "Provisionar" (primary, verde)
   - Se status == 'provisioning': botão "Ver Status" (link para /platform/provision/:id)
   - Se status == 'provisioned': botão "Ver Tenant" (link para /platform/tenants/:tenant_id)
   - Se status == 'failed': botão "Tentar Novamente" + botão "Ver Erro"

5. Ao clicar em "Provisionar":
   - Abrir modal de confirmação com:
     - Resumo do briefing (nome, plano, nicho)
     - Campo editável para slug (pré-preenchido com slug_requested)
     - Preview da URL final: {slug}.waasfl.com
     - Botão "Confirmar e Provisionar"
   - Ao confirmar: POST /api/v1/platform/provision → redirecionar para /platform/provision/{briefing_id}

6. Adicionar "Briefings" ao sidebar do PlatformLayout com badge de contagem de pendentes

Adicionar função fetchBriefings ao api-client.ts:
  GET /api/v1/platform/briefings → lista
  POST /api/v1/platform/provision → provisionar
```

---

### Task 1.3 — Frontend: Página de Progresso de Provisionamento

**Prompt para o Cursor:**
```
No projeto WaaS, criar a página apps/admin/src/app/platform/provision/[briefingId]/page.tsx

Esta página mostra o progresso em tempo real do provisionamento (os 10 passos).

Layout: usar PlatformLayout existente

Componentes:
1. Header com nome do cliente e plano

2. Progress tracker vertical com os 10 passos:
   - Passo 1: Validar briefing
   - Passo 2: Gerar slug único
   - Passo 3: Criar tenant no banco
   - Passo 4: Configurar DNS Cloudflare
   - Passo 5: Criar repositório Git
   - Passo 6: Gerar credenciais
   - Passo 7: Criar usuário admin
   - Passo 8: Vincular tenant
   - Passo 9: Enviar email de boas-vindas
   - Passo 10: Finalizar provisionamento

   Estados visuais por passo:
   - waiting: círculo vazio cinza
   - running: spinner animado azul
   - success: checkmark verde
   - failed: X vermelho

3. Polling: chamar GET /api/v1/platform/provision/{briefingId}/status a cada 2 segundos
   até status == 'provisioned' ou 'failed'

4. Ao concluir com sucesso:
   - Mostrar card de sucesso com:
     - URL do site: {slug}.waasfl.com
     - URL do painel: app.waasfl.com
     - Email de acesso
   - Botões: "Ver Tenant" e "Voltar para Briefings"

5. Ao falhar:
   - Mostrar qual passo falhou e a mensagem de erro
   - Botão "Tentar Novamente" (re-chama POST /platform/provision)
   - Botão "Voltar"
```

---

### Task 1.4 — Frontend: Configurações Globais da Plataforma

**Prompt para o Cursor:**
```
No projeto WaaS, criar a página apps/admin/src/app/platform/integrations/page.tsx

Esta página permite ao operador configurar as integrações globais da plataforma.

Seções (accordion ou tabs):

1. Cloudflare DNS
   Campos: CF_ZONE_ID, CF_API_TOKEN, CF_BASE_DOMAIN, CF_CNAME_TARGET
   Botão "Testar Conexão" → POST /api/v1/platform/integrations/test/cloudflare
   Status visual: conectado (verde) / não configurado (laranja)

2. GitHub / GitLab
   Campos: GIT_PROVIDER (select: GitHub/GitLab), GIT_TOKEN, GIT_TEMPLATE_OWNER, GIT_TEMPLATE_REPO
   Botão "Testar" → verifica se o repo template existe

3. Email (SMTP)
   Campos: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
   Botão "Enviar email de teste"

4. Slack Notifications
   Campo: SLACK_WEBHOOK_URL
   Toggle: ativar/desativar notificações
   Eventos notificados: checkboxes (novo briefing, provisionamento concluído, provisionamento falhou)

5. Domínio Base
   Campo: PANEL_BASE_URL (ex: https://app.waasfl.com)
   Campo: SITE_BASE_DOMAIN (ex: waasfl.com)

IMPORTANTE: Estes dados são salvos via PATCH /api/v1/platform/settings (novo endpoint)
e armazenados como variáveis de ambiente / secrets da plataforma, NUNCA expostos na resposta da API.
Usar *** para mascarar valores já configurados.
```

---

### Task 1.5 — Portal de Briefing (Público)

**Prompt para o Cursor:**
```
No projeto WaaS, criar o portal público de briefing em apps/admin/src/app/onboarding/page.tsx
(ou criar app separado em apps/onboarding/ se preferir)

Este é o formulário que o cliente preenche após o pagamento.

Wizard de 6 etapas com progress bar no topo:

━━━ Etapa 1: Identificação ━━━
- Nome completo (required)
- Email (required, pré-preenchido se vier ?email= na URL)
- Telefone / WhatsApp
- Nome do negócio (required)

━━━ Etapa 2: Segmento ━━━
- Plano adquirido (select, pré-preenchido se vier ?plan= na URL)
- Nicho (cards visuais com emoji e nome, based on plan):
  real_estate, medical_dental, law_firm, beauty_spa, restaurant,
  home_services, insurance, personal_trainer, immigration, accountant
- Slogan / tagline (opcional)
- Descrição do negócio (textarea)

━━━ Etapa 3: Identidade Visual ━━━
- Upload de logo (aceitar PNG/SVG/JPG, preview em tempo real)
- Cor primária (color picker com swatches pré-definidos)
- Cor secundária (color picker)
- Preview visual: mockup simples mostrando header com logo e cores

━━━ Etapa 4: Localização & Contato ━━━
- Endereço completo
- City, State, ZIP
- Horário de funcionamento (por dia da semana, toggle cada dia)
- Redes sociais (Instagram, Facebook, WhatsApp, LinkedIn, YouTube — todos opcionais)

━━━ Etapa 5: Domínio ━━━
- Opção A: usar subdomínio gratuito (default)
  Campo: nome desejado — preview: {nome}.waasfl.com
  Verificar disponibilidade ao digitar (GET /api/v1/public/check-slug/{slug})
- Opção B: domínio próprio
  Campo: domínio (ex: www.meusite.com)
  Exibir instruções de DNS (CNAME)

━━━ Etapa 6: Módulos & Observações ━━━
- Checkboxes dos módulos disponíveis no plano escolhido (buscar do catálogo)
- Campo de observações livres
- Referências de sites que gosta (opcional)
- Checkbox de aceite de termos

Ao submeter: POST /api/v1/platform/briefings
Exibir tela de confirmação: "Recebemos seu briefing! Em até 24h seu site estará no ar."
Enviar notificação ao operador via EmailService.
```

---

## FASE 2 — NOVOS MÓDULOS

### Task 2.1 — Módulo: reviews

**Prompt para o Cursor:**
```
No projeto WaaS, criar o módulo "reviews" completo (depoimentos e avaliações).

━━━ Backend ━━━

1. Model apps/api/app/models/review_item.py:
   - id: String(32) PK
   - tenant_id: String(32) FK not null, index=True
   - author_name: String(200) not null
   - author_photo: String(500) nullable
   - rating: Integer (1-5) not null
   - text: Text not null
   - source: Enum('manual', 'google') default='manual'
   - google_review_id: String(200) nullable (para deduplicar import)
   - is_published: Boolean default=False
   - sort_order: Integer default=0
   - created_at, updated_at

2. Schema Pydantic: ReviewCreate, ReviewUpdate, ReviewResponse

3. Repository: CRUD + list(tenant_id, published_only=False)

4. Router apps/api/app/api/v1/reviews.py:
   GET    /reviews              — lista (filtro ?published=true)
   POST   /reviews              — criar
   GET    /reviews/{id}         — detalhe
   PATCH  /reviews/{id}         — atualizar (toggle published, editar)
   DELETE /reviews/{id}         — deletar
   POST   /reviews/reorder      — { ids: [] } reordenar
   Todos protegidos por: RequiredTenantId + require_active_module("reviews")

5. Migration: apps/api/alembic/versions/018_review_items.py

━━━ Frontend ━━━

6. Página apps/admin/src/app/app/reviews/page.tsx:
   - Grid de cards de depoimentos (não tabela) com foto, nome, estrelas, texto, status
   - Toggle publicado/rascunho em cada card
   - Botão "Adicionar Depoimento" → modal com formulário
   - Drag-and-drop para reordenar (usar @dnd-kit/core)
   - Aba "Importar do Google" (placeholder por ora — campo para Google Place ID)
   - Filtros: Todos | Publicados | Rascunhos

7. Adicionar ao tenant-api.ts:
   listReviews, createReview, updateReview, deleteReview, reorderReviews

8. Adicionar "Avaliações" ao sidebar do TenantLayout quando módulo "reviews" estiver ativo
```

---

### Task 2.2 — Módulo: stripe_payments

**Prompt para o Cursor:**
```
No projeto WaaS, criar o módulo "stripe_payments" — permite que o CLIENTE configure
o Stripe DELE para receber pagamentos no próprio site.

IMPORTANTE: o operador da plataforma NÃO tem acesso às chaves Stripe do cliente.

━━━ Backend ━━━

1. Usar TenantIntegration (já criado na Task 0.3) com integration_code='stripe'
   Config public: { mode: 'test'|'live', currency: 'USD', configured: bool }
   Config encrypted: { stripe_pk, stripe_sk, stripe_webhook_secret }

2. Endpoints em apps/api/app/api/v1/tenant/integrations.py:
   GET  /tenant/integrations                    — lista integrações do tenant
   POST /tenant/integrations/{code}             — configurar/atualizar uma integração
   DELETE /tenant/integrations/{code}           — desconectar integração
   POST /tenant/integrations/stripe/test        — testa as chaves (cria/cancela PaymentIntent de $0.50)

3. Model StripeProduct em apps/api/app/models/stripe_product.py:
   id, tenant_id, name, description, price_cents (int), currency, stripe_product_id,
   stripe_price_id, is_active, created_at

4. Endpoints:
   GET/POST   /payments/products          — CRUD de produtos/serviços
   GET/DELETE /payments/products/{id}

━━━ Frontend ━━━

5. Página apps/admin/src/app/app/payments/page.tsx com tabs:

   Tab "Configuração":
   - Card de status (conectado/desconectado)
   - Campos: Stripe Public Key, Stripe Secret Key (input type password), Webhook Secret
   - Toggle Test/Live mode
   - Currency select (USD default)
   - Botão "Salvar e Testar Conexão"
   - Ao salvar: POST /tenant/integrations/stripe
   - Ao testar: POST /tenant/integrations/stripe/test

   Tab "Produtos & Serviços":
   - Lista de produtos com preço
   - Botão "Adicionar Produto" → modal (nome, descrição, preço, moeda)
   - Toggle ativo/inativo por produto

   Tab "Transações":
   - Placeholder "Em breve — transações aparecerão aqui"

6. No painel /app, mostrar aba "Pagamentos" apenas quando módulo "stripe_payments" ativo
```

---

### Task 2.3 — Módulo: team

**Prompt para o Cursor:**
```
No projeto WaaS, criar o módulo "team" (equipe/staff).

━━━ Backend ━━━

Model TeamMember:
  id, tenant_id, name, role_title, bio (text), photo_url,
  email (nullable), phone (nullable),
  social_links (JSON: { linkedin, instagram, facebook }),
  is_published (bool default True), sort_order (int),
  created_at, updated_at

Endpoints em /team/members:
  GET, POST, GET/{id}, PATCH/{id}, DELETE/{id}, POST/reorder
  Proteger com require_active_module("team")

Migration: 019_team_members.py

━━━ Frontend ━━━

Página /app/team:
- Grid de cards com foto circular, nome, cargo, bio resumida
- Modal de criação/edição com upload de foto
- Toggle publicado
- Drag-and-drop para ordenar
```

---

### Task 2.4 — Módulo: faq

**Prompt para o Cursor:**
```
No projeto WaaS, criar o módulo "faq".

━━━ Backend ━━━

Model FaqCategory: id, tenant_id, name, sort_order
Model FaqItem: id, tenant_id, category_id (FK nullable), question, answer (text),
               is_published, sort_order, created_at, updated_at

Endpoints:
  /faq/categories — CRUD
  /faq/items — CRUD + reorder
  Proteger com require_active_module("faq")

Migration: 020_faq.py

━━━ Frontend ━━━

Página /app/faq:
- Accordion agrupado por categoria
- Botões para adicionar categoria e pergunta
- Inline edit para perguntas/respostas
- Toggle publicado por item
- Drag-and-drop para reordenar
```

---

### Task 2.5 — Módulo: menu (cardápio)

**Prompt para o Cursor:**
```
No projeto WaaS, criar o módulo "menu" para restaurantes/serviços com cardápio.

━━━ Backend ━━━

Model MenuCategory: id, tenant_id, name, description, sort_order, is_active
Model MenuItem:
  id, tenant_id, category_id (FK), name, description, price_cents (int),
  currency (String 3, default 'USD'), photo_url, tags (JSON array),
  is_available (bool, default True), sort_order, created_at, updated_at

Endpoints:
  /menu/categories — CRUD
  /menu/items — CRUD + reorder
  Proteger com require_active_module("menu")

Migration: 021_menu.py

━━━ Frontend ━━━

Página /app/menu:
- Sidebar de categorias (clicável)
- Grid de itens da categoria selecionada
- Card de item com foto, nome, descrição, preço, toggle disponível
- Modal criar/editar com upload de foto e campo de preço formatado (R$ / $)
```

---

### Task 2.6 — Integrações no Painel do Tenant

**Prompt para o Cursor:**
```
No projeto WaaS, criar a página de integrações do tenant: apps/admin/src/app/app/integrations/page.tsx

Esta página permite ao cliente conectar serviços externos ao SEU site.

Layout: cards em grid 3 colunas, cada card com:
- Ícone/logo da integração (usar emoji ou SVG inline)
- Nome e descrição
- Status badge (Conectado / Não configurado)
- Botão "Configurar" → abre modal com campos específicos

Integrações a exibir (sempre visíveis, independente de módulo):

1. Google Analytics 4
   Campos: GA4 Measurement ID (ex: G-XXXXXXXXXX)
   Instrução: "Insira seu ID do GA4. O código será injetado automaticamente no seu site."

2. Meta Pixel (Facebook)
   Campos: Pixel ID (numérico)
   Instrução: "Cole o ID do seu Pixel da Meta."

3. Google Maps
   Campos: API Key, Place ID (para Reviews)
   Instrução: "Necessário para o mapa e importação de avaliações."

4. WhatsApp Chat
   Campos: Número com código do país (ex: +15551234567), Mensagem padrão
   Preview: como o botão aparecerá no site

5. Google OAuth (Login Social)
   Campos: Client ID, Client Secret
   Instrução: "Permite que visitantes façam login com Google."

6. Mailchimp
   Campos: API Key, Audience/List ID
   Instrução: "Para o módulo Newsletter — sincroniza contatos."

7. Stripe (se módulo stripe_payments ativo — link para /app/payments)

Ao salvar qualquer integração: POST /tenant/integrations/{code}
Adicionar ao tenant-api.ts: getIntegrations, setIntegration, deleteIntegration
```

---

## FASE 3 — SITE PÚBLICO POR TENANT

### Task 3.1 — App do Site Público

**Prompt para o Cursor:**
```
No projeto WaaS, criar o app do site público em apps/site/ (novo Next.js app).

Este app renderiza o site do tenant que o VISITANTE acessa (não o painel do cliente).

━━━ Estrutura ━━━

apps/site/
├── src/
│   ├── app/
│   │   ├── layout.tsx              ← Root layout com GA4, Meta Pixel injetados
│   │   ├── page.tsx                ← Homepage do tenant
│   │   ├── blog/
│   │   │   ├── page.tsx            ← Lista de posts
│   │   │   └── [slug]/page.tsx     ← Post individual
│   │   ├── [pageSlug]/page.tsx     ← Páginas estáticas
│   │   └── sitemap.ts              ← Sitemap dinâmico
│   ├── lib/
│   │   ├── tenant.ts               ← resolveTenant(host) → dados do tenant
│   │   └── api.ts                  ← fetchPublicData do tenant
│   └── components/
│       ├── templates/              ← Templates por nicho
│       │   ├── GenericTemplate.tsx
│       │   ├── RealEstateTemplate.tsx
│       │   └── MedicalTemplate.tsx
│       └── blocks/                 ← Seções reutilizáveis
│           ├── HeroBlock.tsx
│           ├── LeadFormBlock.tsx
│           ├── BlogBlock.tsx
│           └── ReviewsBlock.tsx

━━━ Resolução de Tenant ━━━

middleware.ts:
  - Extrair host da request
  - Se host == "{slug}.waasfl.com" → extrair slug
  - Se host == domínio customizado → buscar tenant por custom_domain
  - Injetar tenant_slug no header x-tenant-slug
  - Passar para a page

apps/site/src/lib/tenant.ts:
  async function resolveTenant(slug: string):
    GET {WAAS_API_URL}/api/v1/public/tenant/{slug}
    Retornar dados públicos do tenant (sem dados sensíveis)

━━━ API Pública (novo endpoint no backend) ━━━

GET /api/v1/public/tenant/{slug} — sem auth
  Retornar: name, slug, subdomain, custom_domain, primary_color, secondary_color,
            logo_url, favicon_url, footer_text, meta_title, meta_description,
            timezone, enabled_modules, integrations_public (GA4, Pixel, Maps Place ID),
            niche_code

GET /api/v1/public/{slug}/posts?page=1&limit=10 — sem auth, só posts publicados
GET /api/v1/public/{slug}/posts/{post_slug}      — sem auth
GET /api/v1/public/{slug}/pages                  — sem auth
GET /api/v1/public/{slug}/pages/{page_slug}      — sem auth
GET /api/v1/public/{slug}/reviews                — sem auth, só publicados
POST /api/v1/public/{slug}/leads                 — sem auth, rate limited (SlowAPI)
GET /api/v1/check-slug/{slug}                    — sem auth, verifica disponibilidade

━━━ Template Genérico (mínimo para MVP) ━━━

Sections padrão (configuráveis no painel):
1. Hero: logo, nome, slogan, CTA (lead form ou WhatsApp)
2. Sobre: descrição do negócio, foto
3. Serviços/Destaques (3 cards)
4. Depoimentos (módulo reviews)
5. Blog (módulo blog, últimos 3 posts)
6. Localização (Google Maps embed)
7. Contato (lead form)
8. Footer: logo, links, redes sociais, CNPJ/EIN

━━━ docker-compose ━━━
Adicionar serviço "site" exposto na porta 3002.
Variável: WAAS_API_URL=http://api:8000
```

---

## FASE 4 — MÓDULOS ADICIONAIS USA/FLORIDA

### Task 4.1 — Módulo: map_locations

**Prompt para o Cursor:**
```
No projeto WaaS, criar o módulo "map_locations" para múltiplas unidades/localização.

Model Location:
  id, tenant_id, name, address, city, state, zip, lat (float), lng (float),
  phone, email, opening_hours (JSON: { mon: "9:00-18:00", tue: ..., ... }),
  is_main (bool, default False), is_active, sort_order

Endpoints: /locations (CRUD + reorder), require_active_module("map_locations")
Migration: 022_locations.py

Frontend /app/locations:
- Lista de unidades com card mostrando endereço e horário
- Modal de criação com campo de endereço + busca automática de lat/lng via Geocoding API
- Toggle unidade principal
- Preview do horário de funcionamento por dia
```

---

### Task 4.2 — Módulo: chat_widget

**Prompt para o Cursor:**
```
No projeto WaaS, criar o módulo "chat_widget".

Não precisa de model próprio — usa TenantIntegration com integration_code='whatsapp'.

Config public: { phone, message, position: 'bottom-right'|'bottom-left', show_after_seconds: int }

Frontend /app/chat-widget (ou dentro de /app/integrations):
- Configurar número do WhatsApp
- Mensagem padrão
- Posição do botão (preview visual)
- Delay para aparecer (slider: 0–30 segundos)
- Cores do botão

O site público injeta o widget automaticamente se a integração whatsapp estiver configurada.
```

---

### Task 4.3 — Módulo: newsletter

**Prompt para o Cursor:**
```
No projeto WaaS, criar o módulo "newsletter".

Model NewsletterSubscriber:
  id, tenant_id, email (unique por tenant), name (nullable),
  source (String: widget/footer/form), is_confirmed (bool, default False),
  confirmation_token (String nullable), confirmed_at (DateTime nullable),
  is_active (bool, default True), created_at

Endpoints:
  GET  /newsletter/subscribers          — lista (admin)
  GET  /newsletter/subscribers/export   — download CSV
  DELETE /newsletter/subscribers/{id}   — remover
  POST /public/{slug}/newsletter/subscribe — público, rate limited, envia email de confirmação
  GET  /public/newsletter/confirm/{token}  — confirma double opt-in

Frontend /app/newsletter:
- Contagem de inscritos (com gráfico mensal simples)
- Tabela de inscritos com status (confirmado/pendente)
- Botão exportar CSV
- Config: ativar/desativar double opt-in, texto do email de confirmação
- Integração Mailchimp (link para /app/integrations)
```

---

## FASE 5 — MELHORIAS NO PAINEL EXISTENTE

### Task 5.1 — Dashboard melhorado

**Prompt para o Cursor:**
```
No projeto WaaS, melhorar a página do dashboard do tenant (apps/admin/src/app/page.tsx).

Adicionar ao dashboard existente:

1. Widget "Próximos Agendamentos" (se módulo schedule ativo):
   - Lista dos próximos 5 agendamentos com data, horário e nome do contato
   - Link "Ver agenda"

2. Widget "Leads Recentes" (se módulo leads ativo):
   - Últimos 5 leads com nome, email e fonte
   - Link "Ver todos"

3. Widget "Posts Publicados" (se módulo blog ativo):
   - Contagem total e último post publicado

4. Widget "Avaliações Pendentes" (se módulo reviews ativo):
   - Contagem de avaliações aguardando aprovação (is_published=False)
   - Link direto para aprovar

5. Card de "Setup Incompleto" (se novos campos faltando):
   - Checklist: logo? cores? domínio? integrações?
   - Progress bar de "perfil completo" 

Buscar dados em um único endpoint:
  GET /api/v1/tenant/dashboard-summary
  Retornar: { leads_today, leads_total, upcoming_schedules[5], recent_posts[3], 
              pending_reviews, storage_used_mb, storage_limit_mb, completeness_score }
```

---

### Task 5.2 — Detalhe do Tenant (visão do operador)

**Prompt para o Cursor:**
```
No projeto WaaS, criar a página apps/admin/src/app/platform/tenants/[tenantId]/page.tsx

Esta é a visão completa de um tenant para o operador da plataforma.

Seções:
1. Header: nome, slug, status badge, plano, nicho, data de criação, botões (editar, suspender)

2. Visão Geral (cards):
   - Leads totais
   - Posts publicados
   - Agendamentos
   - Storage usado

3. Informações Técnicas:
   - Subdomínio (link clicável)
   - Domínio customizado (se houver)
   - Status DNS (verde se CNAME ativo)
   - Repositório Git (link)
   - Email do admin
   - Data do último login do admin

4. Módulos Ativos:
   - Grid de chips mostrando módulos ativados pelo plano+nicho
   - Possibilidade de override manual (ativar/desativar módulo específico)

5. Integrações Configuradas:
   - Lista de integrações ativas (sem mostrar chaves)

6. Ações Rápidas:
   - Mudar plano (modal com select)
   - Suspender / Reativar
   - Resetar senha do admin
   - Acessar painel como admin (impersonate — gerar token temporário)
   - Deletar tenant (com confirmação dupla)

Endpoint novo: GET /api/v1/platform/tenants/{id}/details
```

---

## CATÁLOGO DE NICHOS (USA / FLORIDA)

### Configuração no banco — SQL seed

```sql
-- Nichos focados em Florida
INSERT INTO niches (id, code, name, is_active) VALUES
  (replace(gen_random_uuid()::text,'-',''), 'real_estate',       'Real Estate',           true),
  (replace(gen_random_uuid()::text,'-',''), 'mortgage',          'Mortgage Broker',        true),
  (replace(gen_random_uuid()::text,'-',''), 'law_firm',          'Law Firm',               true),
  (replace(gen_random_uuid()::text,'-',''), 'medical_dental',    'Medical / Dental',       true),
  (replace(gen_random_uuid()::text,'-',''), 'beauty_spa',        'Beauty & Spa',           true),
  (replace(gen_random_uuid()::text,'-',''), 'restaurant',        'Restaurant & Food',      true),
  (replace(gen_random_uuid()::text,'-',''), 'home_services',     'Home Services',          true),
  (replace(gen_random_uuid()::text,'-',''), 'insurance',         'Insurance Agency',       true),
  (replace(gen_random_uuid()::text,'-',''), 'personal_trainer',  'Personal Trainer',       true),
  (replace(gen_random_uuid()::text,'-',''), 'immigration',       'Immigration Services',   true),
  (replace(gen_random_uuid()::text,'-',''), 'accountant',        'CPA / Accounting',       true),
  (replace(gen_random_uuid()::text,'-',''), 'auto_dealer',       'Auto Dealer',            true),
  (replace(gen_random_uuid()::text,'-',''), 'cleaning',          'Cleaning Services',      true),
  (replace(gen_random_uuid()::text,'-',''), 'event_venue',       'Event Venue',            true),
  (replace(gen_random_uuid()::text,'-',''), 'ecommerce',         'Online Store',           true);

-- Módulos completos (existentes + novos)
INSERT INTO modules (id, code, name, is_active) VALUES
  -- Existentes
  (replace(gen_random_uuid()::text,'-',''), 'blog',              'Blog / News',            true),
  (replace(gen_random_uuid()::text,'-',''), 'property',          'Property Listings',      true),
  (replace(gen_random_uuid()::text,'-',''), 'leads',             'Lead Capture',           true),
  (replace(gen_random_uuid()::text,'-',''), 'schedule',          'Appointments',           true),
  (replace(gen_random_uuid()::text,'-',''), 'media',             'Media Library',          true),
  -- Novos Fase 1
  (replace(gen_random_uuid()::text,'-',''), 'reviews',           'Reviews & Testimonials', true),
  (replace(gen_random_uuid()::text,'-',''), 'stripe_payments',   'Stripe Payments',        true),
  (replace(gen_random_uuid()::text,'-',''), 'team',              'Team / Staff',           true),
  (replace(gen_random_uuid()::text,'-',''), 'faq',               'FAQ',                    true),
  (replace(gen_random_uuid()::text,'-',''), 'menu',              'Menu / Cardápio',        true),
  (replace(gen_random_uuid()::text,'-',''), 'map_locations',     'Locations & Map',        true),
  (replace(gen_random_uuid()::text,'-',''), 'chat_widget',       'Chat Widget',            true),
  (replace(gen_random_uuid()::text,'-',''), 'newsletter',        'Newsletter',             true),
  -- Novos Fase 2
  (replace(gen_random_uuid()::text,'-',''), 'gallery',           'Photo Gallery',          true),
  (replace(gen_random_uuid()::text,'-',''), 'events',            'Events',                 true),
  (replace(gen_random_uuid()::text,'-',''), 'analytics_dash',    'Analytics Dashboard',    true);
```

### Módulos Recomendados por Nicho

| Nicho | Módulos Obrigatórios | Módulos Opcionais |
|---|---|---|
| real_estate | property, leads, map_locations | blog, gallery, reviews, schedule |
| mortgage | leads, contact_form | blog, faq, schedule, reviews |
| law_firm | leads, team, faq | blog, schedule, reviews |
| medical_dental | schedule, leads, team | blog, reviews, map_locations, gallery |
| beauty_spa | schedule, leads, gallery | reviews, menu, chat_widget |
| restaurant | menu, gallery, map_locations | leads, events, chat_widget, reviews |
| home_services | leads, reviews | gallery, faq, schedule, map_locations |
| insurance | leads, faq, team | blog, reviews, schedule |
| personal_trainer | schedule, leads | blog, stripe_payments, gallery, reviews |
| immigration | leads, team, faq | blog, schedule, reviews |
| accountant | leads, team, faq | blog, schedule, reviews |
| cleaning | leads, schedule, reviews | gallery, faq, map_locations |
| event_venue | events, gallery, leads | stripe_payments, schedule, reviews |
| ecommerce | stripe_payments, gallery | blog, newsletter, reviews |

---

## VARIÁVEIS DE AMBIENTE COMPLETAS

### apps/api/.env.example (completo)

```env
# ── Banco de dados ──────────────────────────────────────────────────────────
DATABASE_URL=postgresql+asyncpg://waas:waas@localhost:5432/waas

# ── JWT ────────────────────────────────────────────────────────────────────
JWT_SECRET_KEY=troque-por-string-segura-com-32-chars-minimo
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# ── App ────────────────────────────────────────────────────────────────────
DEBUG=false
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3001,https://app.waasfl.com

# ── Criptografia (integrações do tenant) ───────────────────────────────────
# Gerar com: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
ENCRYPTION_KEY=

# ── URLs da plataforma ─────────────────────────────────────────────────────
PANEL_BASE_URL=https://app.waasfl.com
SITE_BASE_DOMAIN=waasfl.com

# ── Cloudflare DNS ─────────────────────────────────────────────────────────
CF_ZONE_ID=
CF_API_TOKEN=
CF_BASE_DOMAIN=waasfl.com
CF_CNAME_TARGET=sua-plataforma.vercel.app

# ── GitHub ─────────────────────────────────────────────────────────────────
GIT_TOKEN=
GIT_TEMPLATE_OWNER=seu-usuario
GIT_TEMPLATE_REPO=waas-site-template

# ── Email (SMTP) ───────────────────────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@waasfl.com
OPERATOR_EMAIL=voce@waasfl.com

# ── Slack (opcional) ───────────────────────────────────────────────────────
SLACK_WEBHOOK_URL=

# ── Mídia ──────────────────────────────────────────────────────────────────
MEDIA_UPLOAD_DIR=./uploads
MEDIA_MAX_SIZE_BYTES=10485760
```

---

## CHECKLIST GERAL DE IMPLEMENTAÇÃO

### Banco de Dados
- [ ] Migration 014 — campos novos em tenants
- [ ] Migration 015 — tabela briefings
- [ ] Migration 016 — tabela tenant_integrations
- [ ] Migration 017 — tabela provisioning_logs
- [ ] Migration 018 — tabela review_items
- [ ] Migration 019 — tabela team_members
- [ ] Migration 020 — tabela faq_items + faq_categories
- [ ] Migration 021 — tabela menu_items + menu_categories
- [ ] Migration 022 — tabela locations
- [ ] Migration 023 — tabela newsletter_subscribers
- [ ] Migration 024 — tabela stripe_products
- [ ] Seed: nichos USA/Florida (SQL acima)
- [ ] Seed: novos módulos (SQL acima)
- [ ] Seed: matriz plan × niche × modules

### Backend — Services
- [ ] cloudflare_service.py
- [ ] git_service.py
- [ ] email_service.py
- [ ] integration_service.py (criptografia)
- [ ] provisioning_service.py (orquestrador dos 10 passos)

### Backend — Routers
- [ ] /platform/briefings (CRUD)
- [ ] /platform/provision (POST + GET status)
- [ ] /platform/tenants/{id}/details
- [ ] /tenant/integrations (GET/POST/DELETE por code)
- [ ] /tenant/dashboard-summary
- [ ] /reviews (CRUD + reorder)
- [ ] /team/members (CRUD + reorder)
- [ ] /faq/categories + /faq/items
- [ ] /menu/categories + /menu/items
- [ ] /locations
- [ ] /payments/products
- [ ] /newsletter/subscribers
- [ ] /public/{slug}/... (endpoints públicos sem auth)
- [ ] /public/check-slug/{slug}

### Frontend — Plataforma (/platform)
- [ ] /platform/briefings — tabela + botão provisionar
- [ ] /platform/provision/[briefingId] — progresso em tempo real
- [ ] /platform/tenants/[tenantId] — detalhe completo
- [ ] /platform/integrations — Cloudflare, GitHub, SMTP, Slack
- [ ] Sidebar: adicionar "Briefings" com badge de pendentes

### Frontend — Tenant (/app)
- [ ] /app/dashboard — melhorado com widgets
- [ ] /app/integrations — Google, Meta, Maps, WhatsApp, Mailchimp
- [ ] /app/reviews — grid de depoimentos
- [ ] /app/payments — configuração Stripe + produtos
- [ ] /app/team — equipe
- [ ] /app/faq — perguntas frequentes
- [ ] /app/menu — cardápio (nicho restaurante)
- [ ] /app/locations — endereços/unidades
- [ ] /app/newsletter — inscritos + config
- [ ] Sidebar: mostrar novos módulos quando ativos

### Frontend — Portal Público (/onboarding)
- [ ] Wizard de 6 etapas de briefing
- [ ] Verificação de slug disponível
- [ ] Submit → notificar operador

### Site Público (apps/site)
- [ ] Next.js app em apps/site/
- [ ] Middleware de resolução de tenant por subdomínio
- [ ] Endpoints públicos no backend
- [ ] Template Genérico
- [ ] Template Real Estate
- [ ] Template Medical/Service
- [ ] Sitemap dinâmico
- [ ] Injeção automática de GA4 e Meta Pixel

### DevOps
- [ ] Adicionar serviço `site` no docker-compose.yml (porta 3002)
- [ ] Variáveis de ambiente: CF_*, GIT_*, SMTP_*, ENCRYPTION_KEY
- [ ] Configurar Cloudflare Worker para domínios customizados (fase 2)

---

## ORDEM DE IMPLEMENTAÇÃO RECOMENDADA

```
Semana 1-2:  Tasks 0.1 → 0.4 (fundação: migrations + services)
Semana 3-4:  Tasks 1.1 → 1.3 (provisionamento: API + frontend)
Semana 5:    Task 1.4 + 1.5 (configurações globais + portal briefing)
Semana 6-7:  Tasks 2.1 → 2.4 (módulos: reviews, stripe, team, faq)
Semana 8:    Tasks 2.5 + 2.6 (menu + integrações no tenant)
Semana 9-11: Task 3.1 (site público — a mais complexa)
Semana 12:   Tasks 4.1 → 4.3 (módulos extras: maps, chat, newsletter)
Semana 13:   Tasks 5.1 + 5.2 (dashboard melhorado + detalhe tenant)
```

---

*WaaS Platform — Documentação de Implementação v1.0 — USA/Florida Focus*
