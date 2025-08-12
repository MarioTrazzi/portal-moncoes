-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('FUNCIONARIO', 'TECNICO', 'APROVADOR', 'GESTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."ServiceOrderStatus" AS ENUM ('ABERTA', 'EM_ANALISE', 'AGUARDANDO_DESLOCAMENTO', 'EM_EXECUCAO', 'AGUARDANDO_MATERIAL', 'SOLICITAR_ORCAMENTO', 'AGUARDANDO_ORCAMENTO', 'ORCAMENTOS_RECEBIDOS', 'AGUARDANDO_APROVACAO', 'MATERIAL_APROVADO', 'AGUARDANDO_ASSINATURA', 'COMPRA_AUTORIZADA', 'MATERIAL_RECEBIDO', 'FINALIZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('BAIXA', 'NORMAL', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "public"."ProblemCategory" AS ENUM ('HARDWARE', 'SOFTWARE', 'REDE', 'IMPRESSORA', 'TELEFONIA', 'SISTEMA', 'OUTROS');

-- CreateEnum
CREATE TYPE "public"."AttachmentType" AS ENUM ('IMAGE', 'DOCUMENT', 'VIDEO', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."QuoteStatus" AS ENUM ('SOLICITADO', 'RECEBIDO', 'EM_ANALISE', 'APROVADO', 'REJEITADO', 'EXPIRADO');

-- CreateEnum
CREATE TYPE "public"."PurchaseOrderStatus" AS ENUM ('PENDENTE', 'ASSINADO', 'ENVIADO', 'CONFIRMADO', 'ENTREGUE', 'CANCELADO');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('NEW_OS', 'OS_UPDATED', 'OS_ASSIGNED', 'OS_COMPLETED', 'OS_CANCELLED', 'MATERIAL_NEEDED', 'QUOTES_REQUESTED', 'QUOTE_RECEIVED', 'QUOTES_READY', 'PURCHASE_APPROVED', 'AWAITING_SIGNATURE', 'PURCHASE_SIGNED', 'MATERIAL_DELIVERED', 'URGENT', 'INFO');

-- CreateTable
CREATE TABLE "public"."departments" (
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

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
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

-- CreateTable
CREATE TABLE "public"."suppliers" (
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

-- CreateTable
CREATE TABLE "public"."service_orders" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "public"."ProblemCategory" NOT NULL,
    "priority" "public"."Priority" NOT NULL DEFAULT 'NORMAL',
    "status" "public"."ServiceOrderStatus" NOT NULL DEFAULT 'ABERTA',
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
    "materialDescription" TEXT,
    "materialJustification" TEXT,
    "estimatedHours" DOUBLE PRECISION,
    "actualHours" DOUBLE PRECISION,

    CONSTRAINT "service_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."quotes" (
    "id" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "deliveryTime" INTEGER,
    "validity" TIMESTAMP(3),
    "observations" TEXT,
    "status" "public"."QuoteStatus" NOT NULL DEFAULT 'SOLICITADO',
    "requestedById" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."purchase_orders" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "items" JSONB NOT NULL,
    "deliveryAddress" TEXT NOT NULL,
    "observations" TEXT,
    "status" "public"."PurchaseOrderStatus" NOT NULL DEFAULT 'PENDENTE',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "signedById" TEXT,
    "signedAt" TIMESTAMP(3),
    "signatureHash" TEXT,
    "pdfPath" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "receivedById" TEXT,
    "deliveryNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."attachments" (
    "id" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "type" "public"."AttachmentType" NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
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

-- CreateTable
CREATE TABLE "public"."system_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
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

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "public"."departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_registration_key" ON "public"."users"("registration");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_cnpj_key" ON "public"."suppliers"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "service_orders_number_key" ON "public"."service_orders"("number");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_number_key" ON "public"."purchase_orders"("number");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_quoteId_key" ON "public"."purchase_orders"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "system_config_key_key" ON "public"."system_config"("key");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_orders" ADD CONSTRAINT "service_orders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_orders" ADD CONSTRAINT "service_orders_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quotes" ADD CONSTRAINT "quotes_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "public"."service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quotes" ADD CONSTRAINT "quotes_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quotes" ADD CONSTRAINT "quotes_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_orders" ADD CONSTRAINT "purchase_orders_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "public"."service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_orders" ADD CONSTRAINT "purchase_orders_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "public"."quotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_orders" ADD CONSTRAINT "purchase_orders_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_orders" ADD CONSTRAINT "purchase_orders_signedById_fkey" FOREIGN KEY ("signedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_orders" ADD CONSTRAINT "purchase_orders_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attachments" ADD CONSTRAINT "attachments_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "public"."service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "public"."service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "public"."service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
