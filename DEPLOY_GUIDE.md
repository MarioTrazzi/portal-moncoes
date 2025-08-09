# 🚀 Guia de Deploy na Vercel - Portal Monções

## ✅ Preparação Completa

O projeto já está **100% preparado** para deploy na Vercel com:
- ✅ Build funcionando perfeitamente
- ✅ Código no GitHub: https://github.com/MarioTrazzi/portal-moncoes.git
- ✅ Configurações de produção otimizadas
- ✅ README.md detalhado

## 🌐 Steps para Deploy na Vercel

### 1. **Acesse a Vercel**
- Vá para: https://vercel.com
- Faça login com sua conta GitHub

### 2. **Importe o Projeto**
- Clique em "New Project"
- Selecione "Import Git Repository"
- Procure por "portal-moncoes" ou cole a URL: `https://github.com/MarioTrazzi/portal-moncoes.git`
- Clique em "Import"

### 3. **Configure o Projeto**
- **Project Name**: `portal-moncoes` (já vem preenchido)
- **Framework Preset**: Next.js (detectado automaticamente)
- **Root Directory**: `.` (raiz do projeto)

### 4. **Configurar Banco de Dados PostgreSQL**

#### Opção A: Neon (Recomendado - Gratuito)
1. Vá para: https://neon.tech
2. Crie conta gratuita
3. Crie um novo projeto
4. Copie a `DATABASE_URL` fornecida

#### Opção B: Supabase (Alternativa Gratuita)
1. Vá para: https://supabase.com
2. Crie conta e novo projeto
3. Vá em Settings > Database
4. Copie a `DATABASE_URL`

#### Opção C: Railway (PostgreSQL Hospedado)
1. Vá para: https://railway.app
2. Crie conta e novo projeto
3. Adicione PostgreSQL
4. Copie a `DATABASE_URL`

### 5. **Configurar Variáveis de Ambiente na Vercel**

Na Vercel, na seção "Environment Variables", adicione:

```
DATABASE_URL=postgresql://user:password@host:5432/database
NEXTAUTH_SECRET=um-secret-muito-seguro-aqui-pelo-menos-32-caracteres
NEXTAUTH_URL=https://portal-moncoes.vercel.app
```

**Importante**: 
- Substitua a `DATABASE_URL` pela URL real do seu banco
- Gere um `NEXTAUTH_SECRET` seguro: https://generate-secret.vercel.app/32
- A `NEXTAUTH_URL` será a URL final do seu projeto na Vercel

### 6. **Deploy**
- Clique em "Deploy"
- Aguarde o build (pode demorar 2-3 minutos)

### 7. **Configurar o Banco de Dados**

Após o primeiro deploy, acesse o terminal da Vercel ou execute localmente:

```bash
# Configure a DATABASE_URL local para a mesma da produção
npx prisma migrate deploy
npx prisma db seed
```

## 🔧 Configurações Adicionais

### A. **Domínio Personalizado (Opcional)**
- Na Vercel, vá em "Settings" > "Domains"
- Adicione seu domínio personalizado

### B. **Configuração de Ambiente**
O projeto já está configurado para produção com:
- Build otimizado
- ESLint e TypeScript configurados para produção
- Prisma pronto para PostgreSQL

### C. **Monitoramento**
A Vercel fornece automaticamente:
- Analytics de performance
- Logs de erro
- Métricas de uso

## 🎯 URLs após Deploy

Após o deploy, você terá:
- **Aplicação**: https://portal-moncoes.vercel.app
- **Dashboard Vercel**: https://vercel.com/[seu-usuario]/portal-moncoes

## 📋 Funcionalidades Disponíveis

### ✅ Sistema Completo
- **Dashboard**: Métricas e estatísticas em tempo real
- **Gestão de OS**: Criação, edição, acompanhamento
- **Notificações**: Sistema de alertas automático
- **Permissões**: Controle por roles (Funcionário, Técnico, Gestor, Admin)
- **Anexos**: Upload e gestão de arquivos
- **Auditoria**: Log completo de todas as ações
- **Responsivo**: Funciona em desktop, tablet e mobile

### 🔐 Usuários de Demonstração
O sistema vem com usuários pré-criados:
- **maria.educacao@prefeitura.gov.br** (Funcionário)
- **carlos.tech@prefeitura.gov.br** (Técnico)
- **ana.rh@prefeitura.gov.br** (Aprovador)
- **gestor@prefeitura.gov.br** (Gestor)
- **admin@prefeitura.gov.br** (Admin)

## 🚨 Checklist Final

Antes de apresentar, verifique:
- [ ] Site carregando normalmente
- [ ] Dashboard mostrando dados
- [ ] Possível criar nova OS
- [ ] Sistema de notificações funcionando
- [ ] Alternância entre tipos de usuário funcionando
- [ ] Upload de anexos funcionando

## 📞 Suporte

Se houver algum problema:
1. Verifique os logs na Vercel
2. Confirme se as variáveis de ambiente estão corretas
3. Teste a conexão com o banco de dados

## 🎉 Parabéns!

Seu MVP está **pronto para apresentação**! 

O Portal Monções é um sistema completo de gestão de OS com todas as funcionalidades essenciais para modernizar a gestão pública.

---
*Deploy realizado em: 9 de agosto de 2025*
