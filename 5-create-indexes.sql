-- 5. Criar índices únicos
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "users_registration_key" ON "users"("registration");
CREATE UNIQUE INDEX IF NOT EXISTS "suppliers_cnpj_key" ON "suppliers"("cnpj");
CREATE UNIQUE INDEX IF NOT EXISTS "service_orders_number_key" ON "service_orders"("number");
CREATE UNIQUE INDEX IF NOT EXISTS "system_config_key_key" ON "system_config"("key");
