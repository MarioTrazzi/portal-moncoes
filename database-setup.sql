-- SQL completo para criar todas as tabelas do Portal Monções
-- Execute este script no SQL Editor do Neon

-- Criação dos ENUMs
CREATE TYPE "UserRole" AS ENUM ('FUNCIONARIO', 'TECNICO', 'APROVADOR', 'GESTOR', 'ADMIN');
CREATE TYPE "ServiceOrderStatus" AS ENUM ('ABERTA', 'EM_ANALISE', 'AGUARDANDO_DESLOCAMENTO', 'EM_EXECUCAO', 'AGUARDANDO_MATERIAL', 'AGUARDANDO_ORCAMENTO', 'AGUARDANDO_APROVACAO', 'MATERIAL_APROVADO', 'FINALIZADA', 'CANCELADA');
CREATE TYPE "Priority" AS ENUM ('BAIXA', 'NORMAL', 'ALTA', 'URGENTE');
CREATE TYPE "ProblemCategory" AS ENUM ('HARDWARE', 'SOFTWARE', 'REDE', 'IMPRESSORA', 'TELEFONIA', 'SISTEMA', 'OUTROS');
CREATE TYPE "AttachmentType" AS ENUM ('IMAGE', 'DOCUMENT', 'VIDEO', 'OTHER');
CREATE TYPE "QuoteStatus" AS ENUM ('SOLICITADO', 'RECEBIDO', 'APROVADO', 'REJEITADO');
CREATE TYPE "NotificationType" AS ENUM ('NEW_OS', 'OS_UPDATED', 'OS_ASSIGNED', 'OS_COMPLETED', 'OS_CANCELLED', 'MATERIAL_NEEDED', 'URGENT', 'INFO');

-- Tabela de departamentos
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT NOT NULL,
    "building" TEXT,
    "floor" TEXT,
    "responsible" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- Tabela de usuários
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "registration" TEXT,
    "phone" TEXT,
    "position" TEXT,
    "departmentId" TEXT,
    "room" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Tabela de fornecedores
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "contact" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "categories" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- Tabela de ordens de serviço
CREATE TABLE "service_orders" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ProblemCategory" NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "status" "ServiceOrderStatus" NOT NULL DEFAULT 'ABERTA',
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assignedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "diagnosis" TEXT,
    "solution" TEXT,
    "observations" TEXT,
    "requiresMaterial" BOOLEAN NOT NULL DEFAULT false,
    "estimatedHours" DOUBLE PRECISION,
    "actualHours" DOUBLE PRECISION,

    CONSTRAINT "service_orders_pkey" PRIMARY KEY ("id")
);

-- Tabela de orçamentos
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "deliveryTime" INTEGER,
    "validity" TIMESTAMP(3),
    "observations" TEXT,
    "status" "QuoteStatus" NOT NULL DEFAULT 'SOLICITADO',
    "requestedById" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- Tabela de anexos
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "type" "AttachmentType" NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- Tabela de logs de auditoria
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "serviceOrderId" TEXT,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- Tabela de configurações do sistema
CREATE TABLE "system_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- Tabela de notificações
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "serviceOrderId" TEXT,
    "actionUrl" TEXT,
    "actionText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- Criação dos índices únicos
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_registration_key" ON "users"("registration");
CREATE UNIQUE INDEX "suppliers_cnpj_key" ON "suppliers"("cnpj");
CREATE UNIQUE INDEX "service_orders_number_key" ON "service_orders"("number");
CREATE UNIQUE INDEX "system_config_key_key" ON "system_config"("key");

-- Criação das chaves estrangeiras
ALTER TABLE "users" ADD CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
