import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

/**
 * Upload do documento assinado pelo prefeito
 * Apenas prefeito (admin) pode fazer upload
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Verificar se é admin (prefeito)
    if (user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Apenas o prefeito pode anexar documentos assinados' },
        { status: 403 }
      )
    }

    // Buscar a OS
    const serviceOrder = await prisma.serviceOrder.findUnique({
      where: { id: params.id }
    })

    if (!serviceOrder) {
      return NextResponse.json(
        { success: false, error: 'OS não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se a OS está no status correto
    if (serviceOrder.status !== 'AGUARDANDO_ASSINATURA') {
      return NextResponse.json(
        { success: false, error: 'OS não está aguardando assinatura' },
        { status: 400 }
      )
    }

    // Processar o arquivo
    const formData = await request.formData()
    const file = formData.get('document') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo (apenas PDF)
    if (!file.type.includes('pdf')) {
      return NextResponse.json(
        { success: false, error: 'Apenas arquivos PDF são permitidos' },
        { status: 400 }
      )
    }

    // Validar tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Arquivo muito grande. Máximo 10MB.' },
        { status: 400 }
      )
    }

    // Criar diretório de uploads se não existir
    const uploadsDir = join(process.cwd(), 'uploads', 'signed-documents')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Diretório já existe
    }

    // Gerar nome único do arquivo
    const timestamp = Date.now()
    const fileName = `os-${serviceOrder.number}-signed-${timestamp}.pdf`
    const filePath = join(uploadsDir, fileName)

    // Salvar arquivo
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Atualizar a OS com o documento anexado e mudar status
    const updatedServiceOrder = await prisma.serviceOrder.update({
      where: { id: params.id },
      data: {
        attachedDocument: fileName, // Salvar apenas o nome do arquivo
        status: 'MATERIAL_APROVADO' // Mudar para próximo status
      }
    })

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        serviceOrderId: params.id,
        userId: user.id,
        action: 'DOCUMENTO_ANEXADO',
        details: `Documento assinado anexado: ${fileName}`,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        serviceOrder: updatedServiceOrder,
        fileName,
        message: 'Documento anexado com sucesso. OS atualizada para Material Aprovado.'
      }
    })

  } catch (error) {
    console.error('Erro ao anexar documento:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
