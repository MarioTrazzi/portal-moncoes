import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AttachmentType } from '@prisma/client'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

// POST - Adicionar anexos a uma OS
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: serviceOrderId } = await params
    const formData = await request.formData()

    // Verificar se a OS existe
    const serviceOrder = await prisma.serviceOrder.findUnique({
      where: { id: serviceOrderId }
    })

    if (!serviceOrder) {
      return NextResponse.json(
        { error: 'OS não encontrada' },
        { status: 404 }
      )
    }

    // Por enquanto, usar um usuário padrão (depois implementaremos autenticação)
    const defaultUser = await prisma.user.findUnique({
      where: { email: 'funcionario@prefeitura.gov.br' }
    })

    if (!defaultUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    const uploadedFiles: any[] = []
    
    // Criar diretório de uploads se não existir
    const uploadsDir = join(process.cwd(), 'uploads', 'service-orders', serviceOrderId)
    await mkdir(uploadsDir, { recursive: true })

    // Processar imagens
    const images = formData.getAll('images') as File[]
    for (const file of images) {
      if (file.size > 0) {
        // Validar tamanho (10MB)
        if (file.size > 10 * 1024 * 1024) {
          return NextResponse.json(
            { error: `Arquivo ${file.name} é muito grande. Máximo 10MB.` },
            { status: 400 }
          )
        }

        const fileName = `${randomUUID()}-${file.name}`
        const filePath = join(uploadsDir, fileName)
        
        const bytes = await file.arrayBuffer()
        await writeFile(filePath, Buffer.from(bytes))
        
        const attachment = await prisma.attachment.create({
          data: {
            serviceOrderId: serviceOrderId,
            filename: fileName,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            path: `/uploads/service-orders/${serviceOrderId}/${fileName}`,
            type: AttachmentType.IMAGE,
          }
        })
        
        uploadedFiles.push(attachment)
      }
    }

    // Processar documentos
    const documents = formData.getAll('documents') as File[]
    for (const file of documents) {
      if (file.size > 0) {
        // Validar tamanho (10MB)
        if (file.size > 10 * 1024 * 1024) {
          return NextResponse.json(
            { error: `Arquivo ${file.name} é muito grande. Máximo 10MB.` },
            { status: 400 }
          )
        }

        const fileName = `${randomUUID()}-${file.name}`
        const filePath = join(uploadsDir, fileName)
        
        const bytes = await file.arrayBuffer()
        await writeFile(filePath, Buffer.from(bytes))
        
        const attachment = await prisma.attachment.create({
          data: {
            serviceOrderId: serviceOrderId,
            filename: fileName,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            path: `/uploads/service-orders/${serviceOrderId}/${fileName}`,
            type: AttachmentType.DOCUMENT,
          }
        })
        
        uploadedFiles.push(attachment)
      }
    }

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        serviceOrderId: serviceOrderId,
        userId: defaultUser.id,
        action: "ATTACHMENTS_ADDED",
        details: {
          attachmentsCount: uploadedFiles.length,
          fileNames: uploadedFiles.map(f => f.originalName),
        },
      },
    })

    return NextResponse.json({
      message: `${uploadedFiles.length} arquivo(s) enviado(s) com sucesso`,
      attachments: uploadedFiles
    })

  } catch (error) {
    console.error('Erro ao fazer upload de anexos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
