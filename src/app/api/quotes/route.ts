import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAuth } from "@/lib/auth"
import { QuoteStatus } from "@prisma/client"

// GET - Listar orçamentos
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await verifyAuth(request)
    if (authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    const { searchParams } = new URL(request.url)
    const serviceOrderId = searchParams.get('serviceOrderId')

    const whereClause = serviceOrderId ? { serviceOrderId } : {}

    const quotes = await prisma.quote.findMany({
      where: whereClause,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            cnpj: true,
            contact: true,
            phone: true,
            email: true
          }
        },
        serviceOrder: {
          select: {
            id: true,
            number: true,
            title: true
          }
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: quotes
    })

  } catch (error) {
    console.error("Erro ao buscar orçamentos:", error)
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// POST - Criar novo orçamento
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await verifyAuth(request)
    if (authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    const user = authResult.user
    const body = await request.json()

    const {
      serviceOrderId,
      supplierId,
      items,
      totalValue,
      deliveryTime,
      validity,
      observations
    } = body

    // Validações
    if (!serviceOrderId || !supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Dados obrigatórios não fornecidos" },
        { status: 400 }
      )
    }

    if (!totalValue || totalValue <= 0) {
      return NextResponse.json(
        { success: false, error: "Valor total deve ser maior que zero" },
        { status: 400 }
      )
    }

    // Verificar se a OS existe
    const serviceOrder = await prisma.serviceOrder.findUnique({
      where: { id: serviceOrderId }
    })

    if (!serviceOrder) {
      return NextResponse.json(
        { success: false, error: "OS não encontrada" },
        { status: 404 }
      )
    }

    // Verificar se o fornecedor existe
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId }
    })

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: "Fornecedor não encontrado" },
        { status: 404 }
      )
    }

    // Validar itens
    for (const item of items) {
      if (!item.description || !item.quantity || !item.unitPrice || item.quantity <= 0 || item.unitPrice <= 0) {
        return NextResponse.json(
          { success: false, error: "Todos os itens devem ter descrição, quantidade e preço válidos" },
          { status: 400 }
        )
      }
    }

    // Criar o orçamento
    const quote = await prisma.quote.create({
      data: {
        serviceOrderId,
        supplierId,
        requestedById: user.id,
        items: items,
        totalValue,
        deliveryTime,
        validity: validity ? new Date(validity) : null,
        observations,
        status: QuoteStatus.RECEBIDO
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            cnpj: true,
            contact: true,
            phone: true,
            email: true
          }
        },
        serviceOrder: {
          select: {
            id: true,
            number: true,
            title: true
          }
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Atualizar status da OS se necessário
    if (serviceOrder.status === 'AGUARDANDO_ORCAMENTO') {
      await prisma.serviceOrder.update({
        where: { id: serviceOrderId },
        data: { status: 'ORCAMENTOS_RECEBIDOS' }
      })
    }

    // Criar log de auditoria
    await prisma.auditLog.create({
      data: {
        serviceOrderId,
        userId: user.id,
        action: "ORCAMENTO_CADASTRADO",
        details: {
          quoteId: quote.id,
          supplier: supplier.name,
          totalValue,
          itemCount: items.length
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: quote,
      message: "Orçamento cadastrado com sucesso"
    })

  } catch (error) {
    console.error("Erro ao criar orçamento:", error)
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
