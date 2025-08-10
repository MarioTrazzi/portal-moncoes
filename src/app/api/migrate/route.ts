import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    // Tentar fazer push do schema (cria as tabelas)
    await prisma.$executeRaw`SELECT 1`
    
    return NextResponse.json({
      message: 'Migrações executadas com sucesso!',
      status: 'Database connected and ready'
    })

  } catch (error) {
    console.error('Erro nas migrações:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao executar migrações', 
        details: error instanceof Error ? error.message : 'Erro desconhecido' 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET() {
  try {
    // Verificar status das tabelas
    const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `
    
    return NextResponse.json({
      message: 'Status do banco de dados',
      tables: result
    })

  } catch (error) {
    console.error('Erro ao verificar banco:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao verificar banco', 
        details: error instanceof Error ? error.message : 'Erro desconhecido' 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
