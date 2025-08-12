import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ServiceOrderStatus } from "@prisma/client"
import { sendEmail } from "@/lib/email-service"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; quoteId: string } }
) {
  try {
    const { id: serviceOrderId, quoteId } = params
    const body = await request.json()
    const { action, observations, rejectionReason } = body

    // Buscar o orçamento
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        supplier: true,
        serviceOrder: {
          include: {
            createdBy: true,
            assignedTo: true
          }
        }
      }
    })

    if (!quote) {
      return NextResponse.json(
        { error: "Orçamento não encontrado" },
        { status: 404 }
      )
    }

    if (action === 'approve') {
      // Aprovar orçamento
      const updatedQuote = await prisma.quote.update({
        where: { id: quoteId },
        data: {
          status: "APROVADO",
          approvedAt: new Date(),
          observations: observations
        }
      })

      // Rejeitar outros orçamentos da mesma OS
      await prisma.quote.updateMany({
        where: {
          serviceOrderId: serviceOrderId,
          id: { not: quoteId },
          status: { in: ["RECEBIDO", "EM_ANALISE"] }
        },
        data: {
          status: "REJEITADO",
          rejectedAt: new Date(),
          rejectionReason: "Outro orçamento foi aprovado"
        }
      })

      // Criar pedido de compra
      const purchaseOrderNumber = await generatePurchaseOrderNumber()
      
      const purchaseOrder = await prisma.purchaseOrder.create({
        data: {
          number: purchaseOrderNumber,
          serviceOrderId: serviceOrderId,
          quoteId: quoteId,
          totalValue: quote.totalValue,
          items: quote.items as any,
          deliveryAddress: "Prefeitura Municipal - Almoxarifado Central", // Padrão
          observations: observations,
          status: "PENDENTE"
        }
      })

      // Atualizar status da OS
      await prisma.serviceOrder.update({
        where: { id: serviceOrderId },
        data: {
          status: ServiceOrderStatus.AGUARDANDO_ASSINATURA
        }
      })

      // Log de auditoria
      await prisma.auditLog.create({
        data: {
          serviceOrderId: serviceOrderId,
          userId: "current-user-id", // TODO: Pegar do contexto de autenticação
          action: "PURCHASE_APPROVED",
          details: {
            quoteId: quoteId,
            supplier: quote.supplier.name,
            totalValue: quote.totalValue,
            purchaseOrderNumber: purchaseOrderNumber,
            observations
          }
        }
      })

      // Notificar prefeito (ADMIN) para assinatura
      const prefeitos = await prisma.user.findMany({
        where: {
          role: "ADMIN",
          active: true
        }
      })

      for (const prefeito of prefeitos) {
        await prisma.notification.create({
          data: {
            type: "AWAITING_SIGNATURE",
            title: "Pedido de Compra Aguardando Assinatura",
            message: `Pedido ${purchaseOrderNumber} - OS ${quote.serviceOrder.number} - Valor: R$ ${quote.totalValue.toFixed(2)}`,
            userId: prefeito.id,
            serviceOrderId: serviceOrderId,
            actionUrl: `/dashboard/purchase-orders/${purchaseOrder.id}`,
            actionText: "Assinar Pedido"
          }
        })
      }

      // Enviar email para o fornecedor aprovado
      try {
        await sendApprovalEmail(quote, purchaseOrderNumber)
      } catch (emailError) {
        console.error("Erro ao enviar email de aprovação:", emailError)
      }

      return NextResponse.json({ 
        success: true, 
        purchaseOrder: purchaseOrderNumber,
        message: "Orçamento aprovado com sucesso!" 
      })

    } else if (action === 'reject') {
      // Rejeitar orçamento
      await prisma.quote.update({
        where: { id: quoteId },
        data: {
          status: "REJEITADO",
          rejectedAt: new Date(),
          rejectionReason: rejectionReason
        }
      })

      // Log de auditoria
      await prisma.auditLog.create({
        data: {
          serviceOrderId: serviceOrderId,
          userId: "current-user-id", // TODO: Pegar do contexto de autenticação
          action: "QUOTE_REJECTED",
          details: {
            quoteId: quoteId,
            supplier: quote.supplier.name,
            rejectionReason
          }
        }
      })

      // Verificar se ainda há orçamentos pendentes
      const pendingQuotes = await prisma.quote.count({
        where: {
          serviceOrderId: serviceOrderId,
          status: { in: ["RECEBIDO", "EM_ANALISE"] }
        }
      })

      // Se não há mais orçamentos pendentes, solicitar novos orçamentos
      if (pendingQuotes === 0) {
        await prisma.serviceOrder.update({
          where: { id: serviceOrderId },
          data: {
            status: ServiceOrderStatus.SOLICITAR_ORCAMENTO
          }
        })
      }

      return NextResponse.json({ 
        success: true,
        message: "Orçamento rejeitado com sucesso!" 
      })
    }

    return NextResponse.json(
      { error: "Ação inválida" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Erro ao processar orçamento:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// Gerar número sequencial do pedido de compra
async function generatePurchaseOrderNumber(): Promise<string> {
  const currentYear = new Date().getFullYear()
  const lastOrder = await prisma.purchaseOrder.findFirst({
    where: {
      number: {
        startsWith: `PC-${currentYear}-`
      }
    },
    orderBy: {
      number: "desc"
    }
  })

  let nextNumber = 1
  if (lastOrder) {
    const lastNumber = parseInt(lastOrder.number.split("-")[2])
    nextNumber = lastNumber + 1
  }

  return `PC-${currentYear}-${nextNumber.toString().padStart(3, "0")}`
}

// Enviar email de aprovação ao fornecedor
async function sendApprovalEmail(quote: any, purchaseOrderNumber: string) {
  const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Orçamento Aprovado - Prefeitura</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background-color: #2c5530; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .approval { background-color: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0; }
    .footer { background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Orçamento Aprovado!</h1>
    <p>Prefeitura Municipal</p>
  </div>
  
  <div class="content">
    <h2>Prezado(a) ${quote.supplier.contact},</h2>
    
    <div class="approval">
      <h3>🎉 Seu orçamento foi aprovado!</h3>
      <p><strong>Pedido de Compra:</strong> ${purchaseOrderNumber}</p>
      <p><strong>OS:</strong> ${quote.serviceOrder.number}</p>
      <p><strong>Valor Total:</strong> R$ ${quote.totalValue.toFixed(2)}</p>
    </div>
    
    <h3>Próximos Passos:</h3>
    <ol>
      <li>Aguarde o envio oficial do pedido de compra</li>
      <li>O pedido será assinado pelo prefeito</li>
      <li>Após assinatura, você receberá o pedido oficial</li>
      <li>Proceda com a entrega conforme combinado</li>
    </ol>
    
    <p>Em caso de dúvidas, entre em contato conosco:</p>
    <ul>
      <li>Email: compras@prefeitura.gov.br</li>
      <li>Telefone: (67) 3123-4567</li>
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
    subject: `Orçamento Aprovado - Pedido ${purchaseOrderNumber}`,
    html: emailContent
  })
}
