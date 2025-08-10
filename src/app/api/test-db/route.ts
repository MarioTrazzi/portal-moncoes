import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Teste de conectividade básica
    await prisma.$executeRaw`SELECT 1 as test`
    
    // Tentar listar algumas tabelas
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `
    
    return NextResponse.json({
      status: 'connected',
      message: 'Conexão com banco estabelecida',
      tables: tables,
      env: {
        hasDbUrl: !!process.env.DATABASE_URL,
        dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + '...'
      }
    })

  } catch (error) {
    console.error('Erro de conexão:', error)
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Erro de conexão com banco', 
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        env: {
          hasDbUrl: !!process.env.DATABASE_URL,
          dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + '...'
        }
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
