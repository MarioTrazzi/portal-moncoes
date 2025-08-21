import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(req: NextRequest) {
  try {
    console.log('Executando seed completo...')
    
    // Executar o seed via npx
    const { stdout, stderr } = await execAsync('npx tsx prisma/seed.ts', {
      cwd: process.cwd(),
      timeout: 60000 // 60 segundos
    })
    
    console.log('Stdout:', stdout)
    if (stderr) {
      console.log('Stderr:', stderr)
    }
    
    return NextResponse.json({ 
      message: 'Seed completo executado com sucesso!',
      output: stdout,
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
