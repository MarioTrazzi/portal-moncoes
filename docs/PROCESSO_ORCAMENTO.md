# 📋 Processo de Orçamento - Sistema de OS

## 🔄 **Como Funciona o Processo de Orçamento**

### **1. Solicitação de Orçamento (Gestor)**
- **Status:** `AGUARDANDO_MATERIAL` → `AGUARDANDO_ORCAMENTO`
- **Quem:** Gestor ou Admin
- **Ação:** Clica em "Solicitar Orçamento"
- **Sistema:** Envia emails simulados para fornecedores cadastrados

### **2. Recebimento de Orçamentos**
Os orçamentos podem ser recebidos de **duas formas**:

#### **Opção A: Sistema Formal (Futuro)**
- Fornecedores entram no sistema e inserem orçamentos
- Dados estruturados na tabela `quotes`
- **Status:** `ORCAMENTOS_RECEBIDOS`

#### **Opção B: Email/Anexos (Atual)** ✅
- Fornecedores enviam orçamentos por email
- Gestor anexa os orçamentos como documentos na OS
- **Status:** Permanece `AGUARDANDO_ORCAMENTO`

### **3. Geração de PDF para Assinatura**
- **Status:** `AGUARDANDO_ORCAMENTO` → `AGUARDANDO_ASSINATURA`
- **Quem:** Aprovador ou Admin
- **Validação:** Sistema verifica se há:
  - Orçamentos formais no sistema, OU
  - Documentos anexados com orçamentos

### **4. Assinatura do Prefeito**
- **Status:** `AGUARDANDO_ASSINATURA` → `MATERIAL_APROVADO`
- **Quem:** Admin (Prefeito)
- **Ação:** Anexa documento PDF assinado

## 💡 **Fluxo Prático Atual**

```
1. Técnico identifica necessidade de material
   ↓
2. Gestor solicita orçamento (emails enviados)
   ↓
3. Fornecedores respondem por email
   ↓
4. Gestor ANEXA os orçamentos recebidos na OS
   ↓
5. Aprovador gera PDF para assinatura
   ↓
6. Prefeito assina e anexa documento
   ↓
7. Material aprovado
```

## 📁 **Tipos de Anexo Aceitos**

### **Para Orçamentos:**
- PDFs com orçamentos
- Documentos com propostas
- Arquivos que contenham palavras-chave:
  - "orçamento" / "orcamento"
  - "proposta"

### **Limite de Arquivo:**
- **Tamanho máximo:** 10MB por arquivo
- **Formatos:** PDF, DOC, DOCX, XLS, XLSX, JPG, PNG

## 🔧 **Problemas e Soluções**

### **Problema: "Nenhum orçamento encontrado"**
**Solução:** Anexe os orçamentos recebidos por email antes de gerar o PDF.

### **Problema: Erro 500 no upload**
**Causas possíveis:**
1. **Arquivo muito grande** (>10MB)
2. **Limite do PostgreSQL** (50MB total no plano gratuito)
3. **Problema de autenticação**

**Soluções:**
1. Reduzir tamanho do arquivo
2. Usar arquivos comprimidos
3. Verificar se está logado corretamente

### **Problema: PDF vazio**
**Causa:** Sistema não encontra orçamentos nem anexos
**Solução:** Anexar documentos de orçamento antes de gerar PDF

## 📊 **Validações do Sistema**

```typescript
// O sistema verifica:
const hasQuotes = serviceOrder.quotes.length > 0
const hasAttachments = serviceOrder.attachments.some(att => 
  att.type === 'DOCUMENT' && 
  (att.originalName.toLowerCase().includes('orçamento') || 
   att.originalName.toLowerCase().includes('orcamento') ||
   att.originalName.toLowerCase().includes('proposta'))
)

// Se não tem nenhum dos dois, bloqueia a geração
if (!hasQuotes && !hasAttachments) {
  return error("Não há orçamentos disponíveis")
}
```

## 🚀 **Melhorias Futuras**

1. **Portal do Fornecedor:** Sistema web para fornecedores inserirem orçamentos
2. **Integração Email:** Parsing automático de emails com orçamentos
3. **Comparativo Automático:** Análise automática do melhor orçamento
4. **Workflow de Aprovação:** Múltiplos níveis de aprovação
5. **Catálogo de Produtos:** Base de materiais pré-cadastrados

## 📝 **Instruções para Teste**

1. **Como Gestor:**
   - Acesse uma OS em "Aguardando Material"
   - Clique em "Solicitar Orçamento"
   - Verifique o console para ver o email simulado

2. **Anexar Orçamentos:**
   - Na seção "Anexos", faça upload de PDFs
   - Nomeie os arquivos com "orçamento" no nome
   - Exemplo: "orcamento_fornecedor_A.pdf"

3. **Como Aprovador:**
   - Acesse a OS em "Aguardando Orçamento"
   - Clique em "Gerar PDF para Assinatura"
   - PDF será gerado incluindo os anexos

4. **Como Prefeito:**
   - Acesse a OS em "Aguardando Assinatura"
   - Baixe o PDF, assine e anexe de volta
   - Status mudará para "Material Aprovado"
