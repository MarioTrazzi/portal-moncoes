-- 3. Criar tabela de ordens de serviço
CREATE TABLE IF NOT EXISTS "service_orders" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
