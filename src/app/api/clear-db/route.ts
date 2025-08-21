import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    console.log('Limpando banco de dados...')
    
    // Limpar todos os dados em ordem correta (respeitando relacionamentos)
    await prisma.auditLog.deleteMany()
    await prisma.attachment.deleteMany()
    await prisma.quote.deleteMany()
    await prisma.purchaseOrder.deleteMany()
    await prisma.serviceOrder.deleteMany()
    await prisma.supplier.deleteMany()
    await prisma.user.deleteMany()
    await prisma.department.deleteMany()
    
    console.log('Banco limpo com sucesso!')
    
    return NextResponse.json({ 
      message: 'Banco de dados limpo com sucesso!',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Erro ao limpar banco:', error)
    return NextResponse.json({ 
      error: 'Erro ao limpar banco de dados',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
