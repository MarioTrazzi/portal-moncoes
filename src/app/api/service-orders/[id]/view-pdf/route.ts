import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

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
        .selected-quote { background-color: #e8f5e8; border: 2px solid #28a745; }
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
        </div>
    </div>

    ${data.quotes.length > 0 ? `
    <div class="section">
        <h3>${data.quotes.length === 1 ? 'Orçamento Selecionado' : 'Orçamentos Recebidos'}</h3>
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
                <tr class="${data.quotes.length === 1 ? 'selected-quote' : ''}">
                    <td>${quote.supplier.name}</td>
                    <td>${quote.supplier.cnpj}</td>
                    <td>${quote.supplier.contact}<br><small>${quote.supplier.phone}</small></td>
                    <td>${quote.deliveryTime || 'N/A'}</td>
                    <td><strong>${formatCurrency(quote.totalValue)}</strong></td>
                </tr>
                ${quote.items && quote.items.length > 0 ? `
                <tr>
                    <td colspan="5">
                        <strong>Itens:</strong><br>
                        ${quote.items.map((item: any) => 
                          `${item.description} - Qtd: ${item.quantity} - ${formatCurrency(item.totalPrice)}`
                        ).join('<br>')}
                        ${quote.observations ? `<br><br><strong>Observações:</strong> ${quote.observations}` : ''}
                    </td>
                </tr>
                ` : ''}
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Obter parâmetros da query
    const url = new URL(req.url)
    const selectedQuoteId = url.searchParams.get('quoteId')
    const attachmentId = url.searchParams.get('attachmentId')

    // Verificar autenticação
    const authResult = await verifyAuth(req)
    if (authResult.error || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const user = authResult.user

    // Buscar OS
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
        quotes: {
          include: {
            supplier: {
              select: {
                name: true,
                cnpj: true,
                contact: true,
                phone: true,
                email: true
              }
            }
          }
        },
        attachments: true
      }
    })

    if (!serviceOrder) {
      return NextResponse.json(
        { success: false, error: 'OS não encontrada' },
        { status: 404 }
      )
    }

    // Se um attachment ID foi fornecido, buscar as configurações específicas
    let filteredQuotes = serviceOrder.quotes
    let generatedBy = user.name
    let generatedAt = new Date()

    if (attachmentId) {
      const attachment = serviceOrder.attachments.find(a => a.id === attachmentId)
      if (attachment) {
        // Tentar extrair o quote ID da descrição
        const quoteIdMatch = attachment.description?.match(/Quote ID: ([\w-]+)/)
        if (quoteIdMatch) {
          const extractedQuoteId = quoteIdMatch[1]
          filteredQuotes = serviceOrder.quotes.filter(q => q.id === extractedQuoteId)
        }
        generatedAt = attachment.uploadedAt
        // Tentar determinar quem gerou (simplificado)
        generatedBy = 'Sistema'
      }
    } else if (selectedQuoteId) {
      // Filtrar orçamento se especificado
      filteredQuotes = serviceOrder.quotes.filter(q => q.id === selectedQuoteId)
    }

    // Preparar dados para o PDF
    const pdfData = {
      serviceOrder: {
        id: serviceOrder.id,
        number: serviceOrder.number,
        title: serviceOrder.title,
        description: serviceOrder.description,
        materialDescription: serviceOrder.materialDescription,
        priority: serviceOrder.priority,
        createdAt: serviceOrder.createdAt,
      },
      requester: {
        name: serviceOrder.createdBy.name,
        email: serviceOrder.createdBy.email,
        department: serviceOrder.createdBy.department?.name,
      },
      quotes: filteredQuotes.map(quote => ({
        id: quote.id,
        supplier: {
          name: quote.supplier.name,
          cnpj: quote.supplier.cnpj,
          contact: quote.supplier.contact,
          phone: quote.supplier.phone,
          email: quote.supplier.email,
        },
        items: quote.items || [],
        totalValue: quote.totalValue,
        deliveryTime: quote.deliveryTime,
        validity: quote.validity,
        observations: quote.observations,
      })),
      generatedAt: generatedAt,
      generatedBy: generatedBy,
    }

    // Gerar conteúdo HTML
    const htmlContent = generatePDFHTML(pdfData)

    // Retornar como HTML
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    console.error('Erro ao visualizar PDF:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
