import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('=== DEBUG GENERATE PDF ===')
    console.log('ID da OS:', params.id)
    
    // Testar busca da OS completa como na API original
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
        },
        attachments: {
          select: {
            id: true,
            originalName: true,
            type: true,
            size: true
          }
        }
      }
    })
    
    console.log('OS encontrada:', serviceOrder ? 'Sim' : 'Não')
    if (serviceOrder) {
      console.log('Quotes encontrados:', serviceOrder.quotes.length)
    }
    
    return NextResponse.json({
      success: true,
      debug: {
        osId: params.id,
        found: !!serviceOrder,
        quotesCount: serviceOrder?.quotes.length || 0,
        status: serviceOrder?.status,
        message: 'Query completa funcionando'
      }
    })
    
  } catch (error) {
    console.error('Erro na API debug:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro debug',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
