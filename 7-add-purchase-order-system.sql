-- 7. Adicionar sistema de pedidos de compra e melhorias no fluxo de materiais

-- Atualizar enum ServiceOrderStatus
ALTER TYPE "ServiceOrderStatus" RENAME TO "ServiceOrderStatus_old";

CREATE TYPE "ServiceOrderStatus" AS ENUM (
  'ABERTA',
  'EM_ANALISE',
  'AGUARDANDO_DESLOCAMENTO',
  'EM_EXECUCAO',
  'AGUARDANDO_MATERIAL',
  'SOLICITAR_ORCAMENTO',
  'AGUARDANDO_ORCAMENTO',
  'ORCAMENTOS_RECEBIDOS',
  'AGUARDANDO_APROVACAO',
  'MATERIAL_APROVADO',
  'AGUARDANDO_ASSINATURA',
  'COMPRA_AUTORIZADA',
  'MATERIAL_RECEBIDO',
  'FINALIZADA',
  'CANCELADA'
);

-- Atualizar coluna status na tabela service_orders
ALTER TABLE "service_orders" ALTER COLUMN "status" TYPE "ServiceOrderStatus" USING "status"::text::"ServiceOrderStatus";

-- Remover enum antigo
DROP TYPE "ServiceOrderStatus_old";

-- Atualizar enum QuoteStatus
ALTER TYPE "QuoteStatus" RENAME TO "QuoteStatus_old";

CREATE TYPE "QuoteStatus" AS ENUM (
  'SOLICITADO',
  'RECEBIDO',
  'EM_ANALISE',
  'APROVADO',
  'REJEITADO',
  'EXPIRADO'
);

-- Atualizar coluna status na tabela quotes
ALTER TABLE "quotes" ALTER COLUMN "status" TYPE "QuoteStatus" USING "status"::text::"QuoteStatus";

-- Remover enum antigo
DROP TYPE "QuoteStatus_old";

-- Criar enum PurchaseOrderStatus
CREATE TYPE "PurchaseOrderStatus" AS ENUM (
  'PENDENTE',
  'ASSINADO',
  'ENVIADO',
  'CONFIRMADO',
  'ENTREGUE',
  'CANCELADO'
);

-- Atualizar enum NotificationType
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";

CREATE TYPE "NotificationType" AS ENUM (
  'NEW_OS',
  'OS_UPDATED',
  'OS_ASSIGNED',
  'OS_COMPLETED',
  'OS_CANCELLED',
  'MATERIAL_NEEDED',
  'QUOTES_REQUESTED',
  'QUOTE_RECEIVED',
  'QUOTES_READY',
  'PURCHASE_APPROVED',
  'AWAITING_SIGNATURE',
  'PURCHASE_SIGNED',
  'MATERIAL_DELIVERED',
  'URGENT',
  'INFO'
);

-- Atualizar coluna type na tabela notifications
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType" USING "type"::text::"NotificationType";

-- Remover enum antigo
DROP TYPE "NotificationType_old";

-- Adicionar novos campos à tabela service_orders
ALTER TABLE "service_orders" ADD COLUMN "materialDescription" TEXT;
ALTER TABLE "service_orders" ADD COLUMN "materialJustification" TEXT;

-- Criar tabela purchase_orders
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "items" JSONB NOT NULL,
    "deliveryAddress" TEXT NOT NULL,
    "observations" TEXT,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'PENDENTE',
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

-- Criar índices únicos
CREATE UNIQUE INDEX "purchase_orders_number_key" ON "purchase_orders"("number");
CREATE UNIQUE INDEX "purchase_orders_quoteId_key" ON "purchase_orders"("quoteId");

-- Adicionar chaves estrangeiras
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_signedById_fkey" FOREIGN KEY ("signedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
