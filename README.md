# LogTrack v12.0 - Sistema de Gestão Logística PWA (Cloud Edition)

Um **Progressive Web App (PWA)** completo e funcional para gerenciamento de separação, embalagem e expedição de produtos em depósitos, com suporte a operação offline, sincronização automática e arquitetura de segurança de nível empresarial.

## 🌐 Ambiente de Produção (Ao Vivo)

- **Frontend (App Web):** [https://magnificent-arithmetic-c241f8.netlify.app/](https://magnificent-arithmetic-c241f8.netlify.app/)
- **Backend (API) & Banco de Dados:** Hospedados no Render (`https://logtrack-api.onrender.com/api`)
- **Modo PWA:** Instalável diretamente pelo navegador do celular como um aplicativo nativo.

## 🆕 Novidades da Última Atualização (v12.0)

- ☁️ **Deploy em Nuvem:** Sistema totalmente migrado do ambiente local (`localhost`) para infraestrutura em nuvem, garantindo acesso 24/7 de qualquer dispositivo no armazém.
- 📶 **Resiliência Offline (PWA Aprimorado):** A interface e o leitor de etiquetas continuam 100% funcionais mesmo em áreas sem Wi-Fi (pontos cegos do depósito). O sistema acumula os dados localmente e sincroniza automaticamente com o banco de dados assim que a conexão retorna e a expedição é finalizada.
- 🔍 **Filtros Avançados de Romaneio:** O módulo de relatórios ganhou filtros dinâmicos por Transportadora e Data, com contadores automatizados para auditoria rápida e exportação para XLSX/CSV.
- 🚚 **Rastreabilidade Dinâmica por Transportadora:** O histórico passou a registrar automaticamente a transportadora responsável pela coleta no exato momento da finalização (ex: `🚚 Volume Expedido - [Nome da Transportadora]`).
- 🗃️ **Segregação Estrita de Fases:** Separação definitiva no banco de dados entre a fase de Separação (`picking`) e Embalagem (`packing`), eliminando a duplicidade de logs prematuros na linha do tempo do pedido.
- 🔒 **Segurança e Gestão:** Autenticação criptografada (`bcryptjs`), aprovação de novos administradores pela aba "Equipe" e rotinas de *Lazy Save* para evitar poluição no banco de dados com NFs canceladas.
- 🛠️ **Padronização de Interface:** A interface de Separação foi reescrita para espelhar a "Máquina de Estados" da Embalagem, garantindo uma curva de aprendizado rápida para a equipe.

---

## 🚀 Recursos Principais

- ✅ **PWA Completo**: Funciona offline, instalável como app nativo
- ✅ **Três Módulos Operacionais**: Separação, Embalagem e Expedição
- ✅ **Interface Mobile-First**: Otimizada para smartphones de operadores
- ✅ **Gestão Local com Dexie**: IndexedDB para dados offline
- ✅ **Painel Administrativo**: Importação de produtos, KPIs em tempo real e Gestão de Pessoal
- ✅ **Rastreabilidade Completa**: Logs de auditoria para cada ação carimbando operador e transportadora
- ✅ **Exportação Nativa**: Geração de arquivos `.xlsx` e layout otimizado para impressão de romaneios.

## 🏗️ Arquitetura

### Stack Tecnológico

```text
Frontend:
* React 18.2 + TypeScript + Vite
* Tailwind CSS (Styling)
* Zustand (State Management)
* Dexie 3.2 (IndexedDB ORM para Offline)
* xlsx (Manipulação de Planilhas)

PWA & Deploy:
* Netlify (Hospedagem Frontend)
* Service Worker & Workbox (Estratégia de Cache)

Backend (Node.js):
* Express.js hospedado no Render
* PostgreSQL (pg) hospedado no Render
* bcryptjs (Criptografia)

📋 Requisitos Funcionais Implementados
Domínio: GESTÃO & RELATÓRIOS
✅ RF01: Autenticação de Usuário (Criptografada)

✅ RF02: Controle de Níveis de Acesso e Aprovações

✅ RF03: Importação de Catálogo de Produtos (Upload Ativo via XLSX)

✅ RF04: Geração de Relatório de Expedição com Filtros Dinâmicos

✅ RF05: Painel de Indicadores (KPIs)

✅ RF19: Rastreabilidade de Ações (Logs de Auditoria detalhados)

Domínio: EMBALAGEM (Packing) e SEPARAÇÃO (Picking)
✅ RF10: Abertura de Caixa via Nota Fiscal (Case-Insensitive)

✅ RF12: Conferência por Imagem e Quantidades Editáveis

✅ RF14: Encerramento Manual e Looping Contínuo (Retorno automático)

✅ RF23: Validação de Quantidades Separadas (Bloqueio Inteligente)

✅ RF31: Auto-foco Mandatório no Input (Trava de cursor contínua otimizada para coletores a laser)

✅ RF32: Persistência de Progresso Local (Recuperação de estado anti-falha via IndexedDB/Zustand)

Domínio: EXPEDIÇÃO (Shipping) & PWA
✅ RF18: Associação de Caixas e Baixa de Saída por Transportadora

✅ RF28: Operação em Contingência Offline (Leitura ativa sem internet)

✅ RF30: Sincronização Automatizada em Background no fechamento

📝 Licença
LogTrack v12.0 © 2026 - Todos os direitos reservados
Autora: Maíra Fernando da Silva
Status: ✅ Produção Otimizada Cloud