/*
  Warnings:

  - You are about to drop the column `building` on the `service_orders` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `service_orders` table. All the data in the column will be lost.
  - You are about to drop the column `room` on the `service_orders` table. All the data in the column will be lost.
  - You are about to drop the column `department` on the `users` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT NOT NULL,
    "building" TEXT,
    "floor" TEXT,
    "responsible" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_attachments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceOrderId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "attachments_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_attachments" ("filename", "id", "mimeType", "originalName", "path", "serviceOrderId", "size", "uploadedAt") SELECT "filename", "id", "mimeType", "originalName", "path", "serviceOrderId", "size", "uploadedAt" FROM "attachments";
DROP TABLE "attachments";
ALTER TABLE "new_attachments" RENAME TO "attachments";
CREATE TABLE "new_service_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "assignedAt" DATETIME,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "scheduledAt" DATETIME,
    "diagnosis" TEXT,
    "solution" TEXT,
    "observations" TEXT,
    "requiresMaterial" BOOLEAN NOT NULL DEFAULT false,
    "estimatedHours" REAL,
    "actualHours" REAL,
    CONSTRAINT "service_orders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "service_orders_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_service_orders" ("actualHours", "assignedAt", "assignedToId", "category", "completedAt", "createdAt", "createdById", "description", "diagnosis", "estimatedHours", "id", "number", "observations", "priority", "requiresMaterial", "scheduledAt", "solution", "startedAt", "status", "title", "updatedAt") SELECT "actualHours", "assignedAt", "assignedToId", "category", "completedAt", "createdAt", "createdById", "description", "diagnosis", "estimatedHours", "id", "number", "observations", "priority", "requiresMaterial", "scheduledAt", "solution", "startedAt", "status", "title", "updatedAt" FROM "service_orders";
DROP TABLE "service_orders";
ALTER TABLE "new_service_orders" RENAME TO "service_orders";
CREATE UNIQUE INDEX "service_orders_number_key" ON "service_orders"("number");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "registration" TEXT,
    "phone" TEXT,
    "position" TEXT,
    "departmentId" TEXT,
    "room" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("active", "createdAt", "email", "id", "name", "password", "phone", "position", "registration", "role", "updatedAt") SELECT "active", "createdAt", "email", "id", "name", "password", "phone", "position", "registration", "role", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_registration_key" ON "users"("registration");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");
