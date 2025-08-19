# Portal Monções - Sistema de Gestão de OS

Sistema de gerenciamento de ordens de serviço (OS) de TI desenvolvido para a prefeitura, digitalizando e otimizando o processo de OS que atualmente é feito em papel.

## 🚀 Funcionalidades

### ✅ Gestão de Ordens de Serviço
- **Criação de OS**: Interface intuitiva para abertura de solicitações
- **Workflow Completo**: Da abertura até a finalização com controle de status
- **Sistema de Permissões**: Roles hierárquicos (Funcionário, Técnico, Gestor, Admin)
- **Histórico e Auditoria**: Log completo de todas as ações realizadas

### ✅ Sistema de Orçamentos
- **Cadastro de Orçamentos**: Interface para gestores cadastrarem orçamentos recebidos
- **Comparativo de Preços**: Análise automática de menor/maior valor
- **Geração de PDF**: Documentos para assinatura do prefeito com todos os orçamentos
- **Fluxo de Aprovação**: Do recebimento à assinatura do documento

### ✅ Sistema de Anexos
- **Upload de Arquivos**: Suporte a imagens, documentos e vídeos
- **Download Seguro**: Sistema de download autenticado
- **Orçamentos por Email**: Anexação de orçamentos recebidos por email
- **PDF Gerado**: Downloads de documentos gerados pelo sistema

### ✅ Sistema de Notificações
- **Notificações em Tempo Real**: Alertas automáticos sobre mudanças de status
- **Central de Notificações**: Interface unificada com controle de leitura
- **Diferentes Tipos**: Criação, atribuição, conclusão, etc.

### ✅ Controle de Acesso por Roles
- **Funcionário**: Abre OS, acompanha status
- **Técnico**: Recebe, analisa, executa e finaliza OS
- **Aprovador**: Aprova orçamentos e compras
- **Gestor**: Acesso a relatórios e dashboards
- **Admin**: Gestão completa do sistema

### ✅ Interface Moderna
- **Design Responsivo**: Funciona em desktop, tablet e mobile
- **Dark/Light Mode**: Tema adaptável
- **Componentes Acessíveis**: Interface otimizada para acessibilidade
- **Performance**: Carregamento rápido e otimizado

## 🛠️ Tecnologias

- **Frontend**: Next.js 15 com TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: API Routes do Next.js
- **Banco de Dados**: PostgreSQL + Prisma ORM
- **Autenticação**: Sistema de roles customizado
- **Deploy**: Vercel

## 📋 Fluxo Principal

1. **Abertura**: Funcionário abre OS com descrição do problema
2. **Análise**: Técnico recebe e analisa a OS
3. **Materiais**: Se necessário, técnico identifica necessidade de materiais
4. **Orçamentos**: Gestor solicita e recebe orçamentos de fornecedores
5. **Aprovação**: Aprovador gera PDF e envia para assinatura do prefeito
6. **Assinatura**: Prefeito assina documento e aprova compra
7. **Execução**: Técnico executa o serviço (com possível deslocamento)
8. **Finalização**: OS é finalizada com solução aplicada

## 🏛️ Workflow Governamental Específico

### **Processo de Orçamento Completo:**
```
Técnico identifica material → Gestor solicita orçamento → 
Fornecedores respondem → Gestor cadastra orçamentos → 
Aprovador gera PDF → Prefeito assina → Material aprovado
```

### **Roles e Responsabilidades:**
- **Funcionário**: Abre OS, acompanha status
- **Técnico**: Analisa, diagnostica, executa e finaliza OS
- **Aprovador**: Gera documentos para aprovação de orçamentos
- **Gestor**: Solicita orçamentos, cadastra propostas recebidas
- **Admin/Prefeito**: Assina documentos e aprova compras

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js 18+ 
- PostgreSQL
- npm ou yarn

### Instalação

1. **Clone o repositório**
```bash
git clone [URL_DO_REPOSITORIO]
cd portal-moncoes
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o banco de dados**
```bash
# Configure as variáveis de ambiente
cp .env.example .env.local

# Execute as migrações
npx prisma migrate dev

# (Opcional) Execute o seed para dados iniciais
npx prisma db seed
```

4. **Execute o projeto**
```bash
npm run dev
```

Acesse: http://localhost:3000

## 📁 Estrutura do Projeto

```
src/
├── app/                     # App Router (Next.js 13+)
│   ├── (auth)/             # Rotas de autenticação
│   ├── (dashboard)/        # Dashboard principal
│   │   ├── dashboard/      # Páginas do dashboard
│   │   └── layout.tsx      # Layout do dashboard
│   ├── api/                # API Routes
│   │   ├── auth/           # Endpoints de autenticação
│   │   ├── notifications/  # Sistema de notificações
│   │   └── service-orders/ # CRUD de ordens de serviço
│   └── globals.css         # Estilos globais
├── components/             # Componentes reutilizáveis
│   ├── ui/                 # Componentes base (shadcn/ui)
│   ├── dashboard/          # Componentes específicos do dashboard
│   ├── forms/              # Formulários
│   ├── layout/             # Componentes de layout
│   └── notifications/      # Sistema de notificações
├── contexts/               # React Contexts
├── hooks/                  # Custom Hooks
├── lib/                    # Utilitários e configurações
└── types/                  # Definições de tipos TypeScript
```

## 🗄️ Banco de Dados

O projeto utiliza Prisma como ORM com PostgreSQL. As principais entidades são:

- **User**: Usuários do sistema com diferentes roles
- **Department**: Departamentos da prefeitura
- **ServiceOrder**: Ordens de serviço
- **Notification**: Sistema de notificações
- **AuditLog**: Log de auditoria das ações
- **Attachment**: Anexos das OS

## 🚀 Deploy na Vercel

Este projeto está configurado para deploy automático na Vercel:

1. **Conecte com GitHub**: Importe o repositório na Vercel
2. **Configure as variáveis de ambiente**:
   - `DATABASE_URL`: URL do PostgreSQL
   - `NEXTAUTH_SECRET`: Chave secreta para autenticação
   - `NEXTAUTH_URL`: URL do site em produção

3. **Deploy automático**: Cada push na main faz deploy automático

## 🔒 Segurança e Compliance

- **Logs de Auditoria**: Todas as ações são registradas
- **Controle de Acesso**: Sistema de permissões por role
- **Validação de Dados**: Validação tanto no frontend quanto backend
- **Boas Práticas**: Seguindo padrões de gestão pública

## 📊 Características para Gestão Pública

- **Transparência**: Histórico completo de todas as ações
- **Auditoria**: Logs detalhados para compliance
- **Relatórios**: Dashboards para gestão e tomada de decisão
- **Controles**: Workflow de aprovação configurável
- **Rastreabilidade**: Acompanhamento completo do ciclo de vida das OS

## 🤝 Contribuição

Este é um projeto desenvolvido para atender às necessidades específicas da gestão pública municipal, focando em:

- Digitalização de processos manuais
- Otimização do atendimento aos cidadãos
- Transparência e accountability
- Eficiência operacional

## 📝 Licença

Este projeto está licenciado sob a licença MIT.

---

**Portal Monções** - Modernizando a gestão pública através da tecnologia 🏛️💻
