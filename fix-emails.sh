#!/bin/bash
# Script para corrigir todos os emails de teste

echo "Corrigindo emails de teste em todos os arquivos..."

# Substituir maria.educacao por funcionario
find src/app/api -name "*.ts" -type f -exec sed -i '' 's/maria\.educacao@prefeitura\.gov\.br/funcionario@prefeitura.gov.br/g' {} \;

# Substituir carlos.tech por tecnico  
find src/app/api -name "*.ts" -type f -exec sed -i '' 's/carlos\.tech@prefeitura\.gov\.br/tecnico@prefeitura.gov.br/g' {} \;

# Substituir ana.rh por admin (aprovador)
find src/app/api -name "*.ts" -type f -exec sed -i '' 's/ana\.rh@prefeitura\.gov\.br/admin@prefeitura.gov.br/g' {} \;

echo "Emails corrigidos!"
