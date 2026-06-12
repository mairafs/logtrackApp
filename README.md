
# LogTrack v11.1 - Sistema de Gestão Logística PWA

Um **Progressive Web App (PWA)** completo e funcional para gerenciamento de separação, embalagem e expedição de produtos em depósitos, com suporte a operação offline, sincronização automática e arquitetura de segurança de nível empresarial.

## 🆕 Novidades da Última Atualização (Patch de Segurança e Operação)

- 🔒 **Segurança Empresarial:** Implementação de senhas criptografadas (`bcryptjs`), script de criação do usuário *Gênesis* automático e bloqueios rigorosos de rotas baseados em roles.
- 👥 **Gestão de Equipe:** Novo fluxo onde novos administradores entram como "Pendentes" e precisam ser aprovados. Nova aba "Equipe" no Painel Admin para aprovar/recusar cadastros e revogar acessos em 1 clique.
- 🔄 **Fluxo Operacional Contínuo:** Telas de Separação e Embalagem operam em loop perfeito. Ao finalizar uma Nota Fiscal, o sistema limpa os campos e aguarda a próxima bipagem, sem redirecionar ao Dashboard.
- 🛠️ **Padronização de Interface:** A interface de Separação foi reescrita para espelhar a "Máquina de Estados" da Embalagem, garantindo uma curva de aprendizado mais rápida para os operadores.
- 🗃️ **Sanitização de Dados:** Aplicação de travas *Case-Insensitive* (`toUpperCase()`) no backend para evitar NFs duplicadas (ex: `NF-001` vs `nf-001`). 
- 🧹 **Lazy Save e Limpeza:** As NFs agora só são gravadas no banco de dados após a confirmação final. NFs canceladas não geram mais "fantasmas" no banco, e há uma rotina automática de limpeza.
- 📊 **Exportação Nativa e Impressão:** O módulo de Romaneio agora exporta arquivos `.xlsx` nativos utilizando a biblioteca `xlsx` verdadeira, e o sistema de impressão recebeu ajustes CSS (`print:bg-white`) para gerar relatórios perfeitamente legíveis.
- 📁 **Importação Ativada:** O upload real de planilhas de catálogo (Excel/CSV) está conectado e funcional.

---

## 🚀 Recursos Principais

- ✅ **PWA Completo**: Funciona offline, instalável como app nativo
- ✅ **Três Módulos Operacionais**: Separação, Embalagem e Expedição
- ✅ **Interface Mobile-First**: Otimizada para smartphones de operadores
- ✅ **Tempo de Resposta < 500ms**: Conforme RF05 (RNF05)
- ✅ **Gestão Local com Dexie**: IndexedDB para dados offline
- ✅ **Audio Feedback**: Bips sonoros de sucesso/erro (acessibilidade)
- ✅ **Painel Administrativo**: Importação de produtos, KPIs em tempo real e Gestão de Pessoal
- ✅ **Rastreabilidade Completa**: Logs de auditoria para cada ação carimbando o operador
- ✅ **Validação de Produtos**: Suporte a EAN-13 e SKU
- ✅ **Autenticação Segura**: Login administrativo blindado e fluxo de aprovação

## 🏗️ Arquitetura

### Stack Tecnológico


```

Frontend:

* React 18.2 + TypeScript
* Vite (Build Tool)
* Tailwind CSS (Styling)
* React Router v6 (Navigation)
* Zustand (State Management)
* Axios (HTTP Client)
* Dexie 3.2 (IndexedDB ORM)
* xlsx (Manipulação de Planilhas)
* Lucide React (Icons)
* Sonner (Toast Notifications)

PWA:

* Service Worker (Offline Support)
* Workbox (Cache Strategy)
* Web App Manifest
* Installation Prompt

Backend (Node.js):

* Express.js
* PostgreSQL (pg)
* bcryptjs (Criptografia)
* multer (Uploads)

```

### Estrutura de Pastas


```

logtrack/
├── src/
│   ├── components/          # UI Components reutilizáveis
│   │   ├── UI.tsx           # Button, Input, Card, Badge, etc
│   │   └── Toast.tsx        # Sistema de Toast/Notificação
│   ├── pages/               # Telas da Aplicação
│   │   ├── LoginPage.tsx
│   │   ├── AdminLoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── PickingPage.tsx
│   │   ├── PackingPage.tsx
│   │   ├── ShippingPage.tsx
│   │   └── AdminPanel.tsx
│   ├── hooks/               # Custom Hooks
│   │   └── index.ts         # useBarcodeScanner, useNetworkStatus, etc
│   ├── store/               # Zustand Store
│   │   └── index.ts         # Auth, App, Data, Session, UI stores
│   ├── services/            # Serviços
│   │   ├── api.ts           # Cliente de API
│   │   └── database.ts      # Dexie + IndexedDB
│   ├── types/               # TypeScript Types
│   │   └── index.ts         # User, Product, Order, etc
│   ├── utils/               # Funções Utilitárias
│   │   └── index.ts         # Validação, Formatação, etc
│   ├── constants/           # Constantes da App
│   │   └── index.ts         # API URLs, Status, Mensagens
│   ├── App.tsx              # Roteamento Principal
│   ├── main.tsx             # Entry Point
│   └── index.css            # Global Styles
├── backend/
│   └── server.js            # Servidor Node + Configuração do PostgreSQL
├── public/                  # Assets Estáticos
│   ├── sw.js                # Service Worker
│   ├── manifest.json        # PWA Manifest
│   ├── pwa-*.png            # App Icons
│   └── favicon.ico          # Favicon
├── package.json             # Dependências NPM
├── vite.config.ts           # Configuração Vite
├── tsconfig.json            # TypeScript Config
├── tailwind.config.js       # Tailwind CSS Config
└── README.md                # Este arquivo

```

## 📋 Requisitos Funcionais Implementados

### Domínio: GESTÃO
- ✅ RF01: Autenticação de Usuário (Criptografada)
- ✅ RF02: Controle de Níveis de Acesso e Aprovações
- ✅ RF03: Importação de Catálogo de Produtos (Upload Ativo)
- ✅ RF04: Geração de Relatório de Expedição (XLSX Nativo / Impressão)
- ✅ RF05: Painel de Indicadores (KPIs)
- ✅ RF06: Mecanismo de Busca de Pedidos
- ✅ RF19: Rastreabilidade de Ações (Logs de Auditoria)
- ✅ RF25: Botão Login do Administrador

### Domínio: EMBALAGEM (Packing) e SEPARAÇÃO (Picking)
- ✅ RF08: Placar Diário do Embalador
- ✅ RF10: Abertura de Caixa via Nota Fiscal (Case-Insensitive)
- ✅ RF11: Inserção de Produto por Código
- ✅ RF12: Conferência por Imagem e Quantidades Editáveis
- ✅ RF13: Cancelamento de Leitura Pronta (Botão Desfazer)
- ✅ RF14: Encerramento Manual e Looping Contínuo
- ✅ RF15: Apontamento de Pedido Pendente (Avarias/Faltas)
- ✅ RF21: Atalho Pular Conferência Detalhada
- ✅ RF23: Validação de Quantidades Separadas (Bloqueio Inteligente)

### Domínio: EXPEDIÇÃO (Shipping)
- ✅ RF18: Associação de Caixas e Baixa de Saída
- ✅ RF27: Validação Legal por Carimbo do Motorista

### PWA & Offline
- ✅ RF28: Operação em Contingência Offline
- ✅ RF29: Gerenciamento de Cache Local
- ✅ RF30: Sincronização Automatizada em Background

## 🛠️ Instalação e Execução

### Pré-requisitos
- Node.js 18+ e npm/yarn
- Banco de Dados PostgreSQL instalado e rodando (Porta 5432)

### Setup Local (Dois Terminais)

```bash
# 1. Clonar/Abrir o repositório
cd logtrack

# 2. Instalar dependências de frontend e backend
npm install
npm install bcryptjs --legacy-peer-deps

# ----------------------------------------------------
# TERMINAL 1: Iniciar o Servidor Backend e Banco
# ----------------------------------------------------
node server.js 
# (O banco criará as tabelas e o usuário adminzig automaticamente)

# ----------------------------------------------------
# TERMINAL 2: Iniciar o Frontend Vite
# ----------------------------------------------------
npm run dev

```

### Acesso Inicial

```text
Login Administrador (Gênesis):
- URL: http://localhost:5173/admin-login
- Usuário: adminzig@gmail.com
- Senha: @Zig1590

Para novos usuários:
1. Cadastre-se na tela desejada.
2. Se for operador, acesso liberado na hora.
3. Se for administrador, o "Gênesis" precisa ir na aba "Equipe" para aprovar o acesso.

```

## 📡 API Endpoints (Node + Express)

```text
AUTENTICAÇÃO & EQUIPE
POST   /api/auth/login          # Login de Usuário e Operador
POST   /api/auth/register       # Cadastro com roles (admin = pending)
GET    /api/auth/me             # Validação de Sessão
GET    /api/users               # Lista toda a equipe
POST   /api/users/:id/approve   # Aprova um administrador
POST   /api/users/:id/revoke    # Revoga o acesso de um usuário

CATÁLOGO
GET    /api/products             # Listar produtos
GET    /api/products/code/{code} # Buscar por código EAN/SKU
POST   /api/products/import      # Upload e Processamento de Excel/CSV

OPERAÇÃO
GET    /api/orders               # Listar todos os pedidos
POST   /api/orders/{nf}/status   # Altera status e grava histórico
POST   /api/picking/sessions     # Iniciar separação
POST   /api/picking/sessions/{id}/complete
POST   /api/packing/sessions     # Iniciar embalagem
POST   /api/packing/sessions/{id}/complete
POST   /api/shipping/sessions    # Iniciar expedição
POST   /api/shipping/sessions/{id}/complete

DASHBOARD
GET    /api/kpi/daily            # Estatísticas dinâmicas do dia
GET    /api/history?q={query}    # Linha do tempo e logs de auditoria
GET    /api/carriers             # Listar transportadoras injetadas

```

## 🔐 Segurança Integrada

* ✅ **Senhas Criptografadas:** Hashes gerados via `bcryptjs`.
* ✅ **Lazy DB Saves:** O sistema só insere Notas Fiscais no banco se o fluxo não for cancelado, impedindo poluição do banco.
* ✅ **Sanitização de Inputs:** Padronização de todas as NFs para `UPPERCASE`.
* ✅ **Proteção de Roles:** Bloqueio direto na base de dados para usuários revogados ou gestores pendentes.

## 📝 Licença

LogTrack v11.1 © 2026 - ZIG Iluminação - Todos os direitos reservados

## 👥 Autora

Maíra Fernando da Silva

---

**Status**: ✅ Produção Otimizada
**Versão**: 11.1.0
**Última Atualização**: Junho / 2026

```

```