import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = join(process.cwd(), 'uploads', ...params.path)
    
    // Verificar se o arquivo existe
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Arquivo não encontrado' },
        { status: 404 }
      )
    }
    
    // Ler o arquivo
    const fileBuffer = await readFile(filePath)
    
    // Determinar o tipo de conteúdo baseado na extensão
    const extension = filePath.split('.').pop()?.toLowerCase()
    const contentType = getContentType(extension || '')
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (error) {
    console.error('Erro ao servir arquivo:', error)
    return NextResponse.json(
      { error: 'Erro ao acessar arquivo' },
      { status: 500 }
    )
  }
}

function getContentType(extension: string): string {
  const types: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'txt': 'text/plain',
  }
  
  return types[extension] || 'application/octet-stream'
}
