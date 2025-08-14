import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import { join } from 'path'

/**
 * Download de arquivos anexos
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
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

    // Buscar o anexo
    const attachment = await prisma.attachment.findUnique({
      where: { 
        id: params.attachmentId,
        serviceOrderId: params.id
      }
    })

    if (!attachment) {
      return NextResponse.json(
        { success: false, error: 'Anexo não encontrado' },
        { status: 404 }
      )
    }

    // Construir caminho do arquivo
    const filePath = join(process.cwd(), attachment.path)

    try {
      // Ler arquivo
      const fileBuffer = await readFile(filePath)
      
      // Retornar arquivo com headers apropriados
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': attachment.mimeType,
          'Content-Disposition': `attachment; filename="${attachment.originalName}"`,
          'Content-Length': attachment.size.toString(),
        },
      })
    } catch (fileError) {
      console.error('Erro ao ler arquivo:', fileError)
      return NextResponse.json(
        { success: false, error: 'Arquivo não encontrado no sistema' },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('Erro ao fazer download:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
