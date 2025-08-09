import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// DELETE - Remover anexo específico
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const { id: serviceOrderId, attachmentId } = await params

    // Buscar o anexo
    const attachment = await prisma.attachment.findUnique({
      where: { 
        id: attachmentId,
        serviceOrderId: serviceOrderId
      }
    })

    if (!attachment) {
      return NextResponse.json(
        { error: 'Anexo não encontrado' },
        { status: 404 }
      )
    }

    // Por enquanto, usar um usuário padrão (depois implementaremos autenticação)
    const defaultUser = await prisma.user.findUnique({
      where: { email: 'maria.educacao@prefeitura.gov.br' }
    })

    if (!defaultUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Remover arquivo físico
    const filePath = join(process.cwd(), 'uploads', 'service-orders', serviceOrderId, attachment.filename)
    if (existsSync(filePath)) {
      await unlink(filePath)
    }

    // Remover do banco de dados
    await prisma.attachment.delete({
      where: { id: attachmentId }
    })

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        serviceOrderId: serviceOrderId,
        userId: defaultUser.id,
        action: "ATTACHMENT_REMOVED",
        details: {
          fileName: attachment.originalName,
          fileType: attachment.type,
        },
      },
    })

    return NextResponse.json({
      message: 'Anexo removido com sucesso'
    })

  } catch (error) {
    console.error('Erro ao remover anexo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
