import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

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
    if (user.role !== UserRole.APROVADOR) {
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

    // Por enquanto, retornar os dados estruturados
    // Em uma implementação completa, aqui seria gerado o PDF real
    return NextResponse.json({
      success: true,
      data: {
        pdfData,
        message: 'PDF gerado com sucesso. Em uma implementação completa, retornaria o arquivo PDF.',
        downloadUrl: `/api/service-orders/${params.id}/download-pdf` // URL futura para download
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
