import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ServiceOrderStatus } from "@prisma/client"
import { sendEmail } from "@/lib/email-service"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    const { 
      selectedSuppliers, // Array de IDs dos fornecedores
      materialDescription,
      items // Array de itens: [{ description, quantity, estimatedPrice }]
    } = body

    // Buscar a OS
    const serviceOrder = await prisma.serviceOrder.findUnique({
      where: { id },
      include: { 
        createdBy: true, 
        assignedTo: true,
        quotes: true
      }
    })

    if (!serviceOrder) {
      return NextResponse.json(
        { error: "OS não encontrada" },
        { status: 404 }
      )
    }

    // Verificar se já existem orçamentos para esta OS
    if (serviceOrder.quotes.length > 0) {
      return NextResponse.json(
        { error: "Orçamentos já foram solicitados para esta OS" },
        { status: 400 }
      )
    }

    // Buscar dados dos fornecedores
    const suppliers = await prisma.supplier.findMany({
      where: {
        id: { in: selectedSuppliers },
        active: true
      }
    })

    if (suppliers.length < 2) {
      return NextResponse.json(
        { error: "É necessário selecionar pelo menos 2 fornecedores" },
        { status: 400 }
      )
    }

    // Criar orçamentos para cada fornecedor
    const quotes = []
    for (const supplier of suppliers) {
      const quote = await prisma.quote.create({
        data: {
          serviceOrderId: id,
          supplierId: supplier.id,
          requestedById: serviceOrder.assignedToId!, // Técnico que solicitou
          items: items,
          totalValue: 0, // Será preenchido pelo fornecedor
          status: "SOLICITADO",
          validity: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        },
        include: {
          supplier: true,
          serviceOrder: true
        }
      })

      quotes.push(quote)

      // Enviar email para o fornecedor
      try {
        await sendQuoteRequestEmail(quote, materialDescription)
      } catch (emailError) {
        console.error(`Erro ao enviar email para ${supplier.email}:`, emailError)
        // Continuar mesmo se o email falhar
      }
    }

    // Atualizar status da OS
    await prisma.serviceOrder.update({
      where: { id },
      data: {
        status: ServiceOrderStatus.AGUARDANDO_ORCAMENTO
      }
    })

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        serviceOrderId: id,
        userId: serviceOrder.assignedToId!,
        action: "QUOTES_REQUESTED",
        details: {
          suppliersCount: suppliers.length,
          suppliers: suppliers.map(s => ({ id: s.id, name: s.name })),
          items: items
        },
      },
    })

    // Criar notificações para gestores
    const gestores = await prisma.user.findMany({
      where: {
        role: { in: ["GESTOR", "APROVADOR"] },
        active: true
      }
    })

    for (const gestor of gestores) {
      await prisma.notification.create({
        data: {
          type: "QUOTES_REQUESTED",
          title: "Orçamentos Solicitados",
          message: `OS ${serviceOrder.number}: Orçamentos solicitados a ${suppliers.length} fornecedores`,
          userId: gestor.id,
          serviceOrderId: id,
          actionUrl: `/dashboard/service-orders/${id}`,
          actionText: "Acompanhar OS",
        },
      })
    }

    return NextResponse.json({ 
      success: true, 
      quotes: quotes.length,
      message: `Orçamentos solicitados a ${suppliers.length} fornecedores`
    })
  } catch (error) {
    console.error("Erro ao solicitar orçamentos:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// Função para enviar email de solicitação de orçamento
async function sendQuoteRequestEmail(quote: any, materialDescription: string) {
  const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Solicitação de Orçamento - Prefeitura</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background-color: #2c5530; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .item { background-color: #f9f9f9; padding: 10px; margin: 10px 0; border-left: 4px solid #2c5530; }
    .footer { background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; }
    .button { 
      display: inline-block; 
      background-color: #2c5530; 
      color: white; 
      padding: 12px 24px; 
      text-decoration: none; 
      border-radius: 4px; 
      margin: 20px 0; 
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Solicitação de Orçamento</h1>
    <p>Prefeitura Municipal</p>
  </div>
  
  <div class="content">
    <h2>Prezado(a) ${quote.supplier.contact},</h2>
    
    <p>A Prefeitura Municipal solicita orçamento para os seguintes itens:</p>
    
    <h3>Ordem de Serviço: ${quote.serviceOrder.number}</h3>
    <p><strong>Título:</strong> ${quote.serviceOrder.title}</p>
    <p><strong>Descrição:</strong> ${materialDescription}</p>
    
    <h3>Itens Solicitados:</h3>
    ${quote.items.map((item: any, index: number) => `
      <div class="item">
        <strong>Item ${index + 1}:</strong> ${item.description}<br>
        <strong>Quantidade:</strong> ${item.quantity}
      </div>
    `).join('')}
    
    <p><strong>Prazo para resposta:</strong> 7 dias corridos</p>
    
    <p>Para enviar seu orçamento, responda este email ou entre em contato:</p>
    <ul>
      <li>Email: compras@prefeitura.gov.br</li>
      <li>Telefone: (67) 3123-4567</li>
    </ul>
    
    <p>Favor informar:</p>
    <ul>
      <li>Valor unitário e total de cada item</li>
      <li>Prazo de entrega</li>
      <li>Condições de pagamento</li>
      <li>Validade da proposta</li>
    </ul>
  </div>
  
  <div class="footer">
    <p>Prefeitura Municipal - Sistema de Gestão de OS</p>
    <p>Este é um email automático, não responda diretamente.</p>
  </div>
</body>
</html>
  `

  await sendEmail({
    to: quote.supplier.email,
    subject: `Solicitação de Orçamento - OS ${quote.serviceOrder.number}`,
    html: emailContent
  })
}
