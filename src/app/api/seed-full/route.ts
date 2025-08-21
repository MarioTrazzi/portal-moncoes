import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    console.log('Executando seed completo...')
    
    // Importar e executar a função main do seed
    const seedModule = await import('../../../../prisma/seed')
    await seedModule.default()
    
    return NextResponse.json({ 
      message: 'Seed completo executado com sucesso!',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Erro ao executar seed:', error)
    return NextResponse.json({ 
      error: 'Erro ao executar seed completo',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
