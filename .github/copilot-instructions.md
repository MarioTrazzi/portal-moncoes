# Copilot Instructions - Sistema de Gestão de OS para Prefeitura

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

Este é um sistema de gerenciamento de ordens de serviço (OS) de TI para prefeitura. 

## Contexto do Projeto
- **Público-alvo**: Funcionários públicos, técnicos de TI, gestores
- **Propósito**: Digitalizar e otimizar o processo de OS que atualmente é feito em papel
- **Compliance**: Deve seguir boas práticas de gestão pública

## Arquitetura
- **Frontend**: Next.js 15 com TypeScript e Tailwind CSS
- **Backend**: API Routes do Next.js
- **Banco de dados**: PostgreSQL com Prisma ORM
- **Autenticação**: Sistema de roles hierárquicos

## Fluxo Principal
1. Funcionário abre OS com descrição do problema
2. Técnico recebe e analisa a OS
3. Se necessário, técnico se desloca para o local
4. Se precisar de materiais, sistema solicita orçamentos automaticamente para 3+ fornecedores
5. Orçamentos vão para aprovação da gestão
6. Após aprovação, material é adquirido e OS é finalizada

## Roles do Sistema
- **Funcionário**: Abre OS, acompanha status
- **Técnico**: Recebe, analisa e executa OS
- **Aprovador**: Aprova orçamentos e compras
- **Gestor**: Acesso a relatórios e dashboards
- **Admin**: Gestão completa do sistema

## Características Importantes
- Interface responsiva e acessível
- Logs de auditoria completos
- Relatórios para gestão pública
- Workflow de aprovação configurável
- Sistema de notificações
- Integração com fornecedores
- Controle de estoque básico

## Padrões de Código
- Use TypeScript estrito
- Componentes funcionais com hooks
- Tailwind CSS para estilização
- Validação com Zod
- Tratamento de erros adequado
- Comentários em português
- Nomes de variáveis e funções em inglês, mas comentários em português
