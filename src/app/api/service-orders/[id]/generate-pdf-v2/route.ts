import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('=== NOVA API GENERATE PDF ===')
    
    // Obter dados do request
    const body = await req.json().catch(() => ({}))
    const { selectedQuoteId } = body
    console.log('Orçamento selecionado:', selectedQuoteId)

    // Verificar autenticação
    const authResult = await verifyAuth(req)
    if (authResult.error || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const user = authResult.user
    console.log('Usuário autenticado:', user.email, user.role)

    // Verificar permissões
    if (user.role !== UserRole.GESTOR && user.role !== UserRole.APROVADOR && user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Apenas gestores e aprovadores podem gerar PDFs' },
        { status: 403 }
      )
    }

    // Buscar OS
    console.log('Buscando OS...')
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
        }
      }
    })

    if (!serviceOrder) {
      return NextResponse.json(
        { success: false, error: 'OS não encontrada' },
        { status: 404 }
      )
    }

    console.log('OS encontrada:', serviceOrder.number)
    console.log('Total de orçamentos:', serviceOrder.quotes.length)

    // Filtrar orçamento se especificado
    const filteredQuotes = selectedQuoteId 
      ? serviceOrder.quotes.filter(q => q.id === selectedQuoteId)
      : serviceOrder.quotes

    console.log('Orçamentos filtrados:', filteredQuotes.length)

    // Por agora, retornar sucesso sem gerar PDF real
    return NextResponse.json({
      success: true,
      data: {
        osId: params.id,
        osNumber: serviceOrder.number,
        quotesCount: filteredQuotes.length,
        selectedQuote: selectedQuoteId,
        user: user.email,
        message: 'Dados coletados com sucesso - PDF seria gerado aqui'
      }
    })

  } catch (error) {
    console.error('Erro na nova API:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
