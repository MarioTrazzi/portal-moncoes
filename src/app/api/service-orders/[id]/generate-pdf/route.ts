import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

/**
 * Gera HTML formatado para o PDF do orçamento
 */
function generatePDFHTML(data: any): string {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Orçamento OS ${data.serviceOrder.number}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin: 20px 0; }
        .section h3 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 5px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0; }
        .info-item { padding: 5px 0; }
        .info-label { font-weight: bold; }
        .quotes-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        .quotes-table th, .quotes-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .quotes-table th { background-color: #f2f2f2; }
        .signature-area { margin-top: 50px; }
        .signature-line { border-top: 1px solid #000; width: 300px; margin: 30px auto; text-align: center; padding-top: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>PREFEITURA MUNICIPAL</h1>
        <h2>Solicitação de Aprovação de Orçamento</h2>
        <p><strong>OS #${data.serviceOrder.number}</strong></p>
    </div>

    <div class="section">
        <h3>Informações da Ordem de Serviço</h3>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Título:</span> ${data.serviceOrder.title}
            </div>
            <div class="info-item">
                <span class="info-label">Prioridade:</span> ${data.serviceOrder.priority}
            </div>
            <div class="info-item" style="grid-column: 1 / -1;">
                <span class="info-label">Descrição:</span> ${data.serviceOrder.description}
            </div>
            ${data.serviceOrder.materialDescription ? `
            <div class="info-item" style="grid-column: 1 / -1;">
                <span class="info-label">Material Necessário:</span> ${data.serviceOrder.materialDescription}
            </div>
            ` : ''}
            ${data.serviceOrder.materialJustification ? `
            <div class="info-item" style="grid-column: 1 / -1;">
                <span class="info-label">Justificativa:</span> ${data.serviceOrder.materialJustification}
            </div>
            ` : ''}
        </div>
    </div>

    <div class="section">
        <h3>Solicitante</h3>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Nome:</span> ${data.requester.name}
            </div>
            <div class="info-item">
                <span class="info-label">Email:</span> ${data.requester.email}
            </div>
            <div class="info-item">
                <span class="info-label">Departamento:</span> ${data.requester.department || 'N/A'}
            </div>
            <div class="info-item">
                <span class="info-label">Localização:</span> ${data.requester.location || 'N/A'}
            </div>
        </div>
    </div>

    ${data.technician.name ? `
    <div class="section">
        <h3>Técnico Responsável</h3>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Nome:</span> ${data.technician.name}
            </div>
            <div class="info-item">
                <span class="info-label">Email:</span> ${data.technician.email}
            </div>
        </div>
    </div>
    ` : ''}

    <div class="section">
        <h3>Orçamentos Recebidos</h3>
        <table class="quotes-table">
            <thead>
                <tr>
                    <th>Fornecedor</th>
                    <th>CNPJ</th>
                    <th>Contato</th>
                    <th>Prazo (dias)</th>
                    <th>Valor Total</th>
                </tr>
            </thead>
            <tbody>
                ${data.quotes.map((quote: any) => `
                <tr>
                    <td>${quote.supplier.name}</td>
                    <td>${quote.supplier.cnpj}</td>
                    <td>${quote.supplier.contact}<br><small>${quote.supplier.phone}</small></td>
                    <td>${quote.deliveryTime || 'N/A'}</td>
                    <td><strong>${formatCurrency(quote.totalValue)}</strong></td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        ${data.quotes.length > 0 ? `
        <p><strong>Menor orçamento: ${formatCurrency(Math.min(...data.quotes.map((q: any) => q.totalValue)))}</strong></p>
        ` : '<p>Nenhum orçamento disponível</p>'}
    </div>

    <div class="section">
        <h3>Informações da Geração</h3>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Gerado por:</span> ${data.generatedBy}
            </div>
            <div class="info-item">
                <span class="info-label">Data/Hora:</span> ${formatDate(data.generatedAt)}
            </div>
        </div>
    </div>

    <div class="signature-area">
        <h3>Aprovação</h3>
        <p>Solicito a aprovação do orçamento acima para aquisição dos materiais necessários à execução da Ordem de Serviço.</p>
        
        <div class="signature-line">
            Assinatura do Prefeito
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
            <p>Data: ___/___/______</p>
        </div>
    </div>
</body>
</html>
  `
}

/**
 * Gera PDF do orçamento para aprovação do prefeito
 * Apenas aprovadores podem gerar PDFs
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const { user } = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se é aprovador
    if (user.role !== UserRole.APROVADOR && user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Apenas aprovadores podem gerar PDFs' },
        { status: 403 }
      )
    }

    // Buscar a OS com orçamentos
    const serviceOrder = await prisma.serviceOrder.findUnique({
      where: { id: params.id },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
            department: {
              select: {
                name: true,
                location: true
              }
            }
          }
        },
        assignedTo: {
          select: {
            name: true,
            email: true
          }
        },
        quotes: {
          include: {
            supplier: {
              select: {
                name: true,
                cnpj: true,
                email: true,
                phone: true,
                contact: true
              }
            }
          },
          orderBy: {
            totalValue: 'asc'
          }
        }
      }
    })

    if (!serviceOrder) {
      return NextResponse.json(
        { success: false, error: 'OS não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se a OS está no status correto
    if (serviceOrder.status !== 'AGUARDANDO_ORCAMENTO' && serviceOrder.status !== 'ORCAMENTOS_RECEBIDOS') {
      return NextResponse.json(
        { success: false, error: 'OS não está no status apropriado para gerar PDF' },
        { status: 400 }
      )
    }

    // Verificar se existem orçamentos
    if (serviceOrder.quotes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhum orçamento encontrado para esta OS' },
        { status: 400 }
      )
    }

    // Gerar estrutura do PDF (HTML que pode ser convertido para PDF)
    const pdfData = {
      serviceOrder: {
        id: serviceOrder.id,
        number: serviceOrder.number,
        title: serviceOrder.title,
        description: serviceOrder.description,
        materialDescription: serviceOrder.materialDescription,
        materialJustification: serviceOrder.materialJustification,
        priority: serviceOrder.priority,
        createdAt: serviceOrder.createdAt,
      },
      requester: {
        name: serviceOrder.createdBy.name,
        email: serviceOrder.createdBy.email,
        department: serviceOrder.createdBy.department?.name,
        location: serviceOrder.createdBy.department?.location,
      },
      technician: {
        name: serviceOrder.assignedTo?.name,
        email: serviceOrder.assignedTo?.email,
      },
      quotes: serviceOrder.quotes.map(quote => ({
        id: quote.id,
        supplier: {
          name: quote.supplier.name,
          cnpj: quote.supplier.cnpj,
          contact: quote.supplier.contact,
          phone: quote.supplier.phone,
          email: quote.supplier.email,
        },
        items: quote.items,
        totalValue: quote.totalValue,
        deliveryTime: quote.deliveryTime,
        validity: quote.validity,
        observations: quote.observations,
      })),
      generatedAt: new Date(),
      generatedBy: user.name,
    }

    // Gerar conteúdo HTML do PDF
    const htmlContent = generatePDFHTML(pdfData)

    // Criar diretório de uploads se não existir
    const uploadsDir = join(process.cwd(), 'uploads', 'generated-pdfs')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Diretório já existe
    }

    // Gerar nome único do arquivo
    const timestamp = Date.now()
    const fileName = `orcamento-os-${serviceOrder.number}-${timestamp}.pdf`
    const filePath = join(uploadsDir, fileName)

    // Por enquanto, salvar como HTML (em uma implementação real, seria PDF)
    // Para gerar PDF real, seria necessário usar bibliotecas como puppeteer ou jsPDF
    const htmlFileName = `orcamento-os-${serviceOrder.number}-${timestamp}.html`
    const htmlFilePath = join(uploadsDir, htmlFileName)
    await writeFile(htmlFilePath, htmlContent, 'utf8')

    // Salvar como anexo na OS
    const attachment = await prisma.attachment.create({
      data: {
        serviceOrderId: serviceOrder.id,
        filename: htmlFileName, // Usar HTML por enquanto
        originalName: `Orçamento OS ${serviceOrder.number}.html`,
        mimeType: 'text/html',
        size: Buffer.byteLength(htmlContent, 'utf8'),
        path: `uploads/generated-pdfs/${htmlFileName}`,
        type: 'DOCUMENT',
        description: 'PDF de orçamento gerado para aprovação do prefeito',
      }
    })

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        serviceOrderId: params.id,
        userId: user.id,
        action: 'PDF_GERADO',
        details: `PDF de orçamento gerado: ${htmlFileName}`,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        attachment,
        message: 'PDF gerado com sucesso e salvo como anexo.',
        fileName: htmlFileName
      }
    })

  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
