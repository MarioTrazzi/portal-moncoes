import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { AttachmentType, UserRole } from "@prisma/client"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { randomUUID } from "crypto"
import { getUserPermissions } from "@/hooks/use-permissions"
import { NotificationService } from "@/lib/notification-service"

// GET - Listar OS (filtradas por permissão do usuário)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // TODO: Pegar o usuário autenticado do token/session
    // Por enquanto, vamos usar um usuário de teste baseado no query param
    const testUser = searchParams.get('testUser') || 'funcionario'
    
    const testUserMapping = {
      funcionario: 'maria.educacao@prefeitura.gov.br',  // FUNCIONARIO
      tecnico: 'carlos.tech@prefeitura.gov.br',         // TECNICO  
      admin: 'admin@prefeitura.gov.br',                 // ADMIN
      gestor: 'gestor@prefeitura.gov.br',              // GESTOR
      aprovador: 'ana.rh@prefeitura.gov.br'            // APROVADOR
    }
    
    const userEmail = testUserMapping[testUser as keyof typeof testUserMapping] || testUserMapping.funcionario
    
    const currentUser = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { department: true }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 401 }
      )
    }

    const permissions = getUserPermissions(currentUser.role)
    
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const category = searchParams.get("category")

    const skip = (page - 1) * limit

    // Construir filtros baseados em permissões
    const where: any = {}
    
    // Se o usuário não pode ver todas as OS, filtrar apenas as suas
    if (!permissions.canViewAllOrders) {
      where.createdById = currentUser.id
    }
    
    if (status) {
      // Suporte para múltiplos status separados por vírgula
      const statusList = status.split(',').map(s => s.trim())
      if (statusList.length > 1) {
        where.status = { in: statusList }
      } else {
        where.status = status
      }
    }
    
    if (priority) {
      // Suporte para múltiplas prioridades separadas por vírgula
      const priorityList = priority.split(',').map(p => p.trim())
      if (priorityList.length > 1) {
        where.priority = { in: priorityList }
      } else {
        where.priority = priority
      }
    }
    
    if (category) where.category = category

    const [serviceOrders, total] = await Promise.all([
      prisma.serviceOrder.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              department: {
                select: {
                  name: true,
                  location: true,
                  building: true,
                }
              }
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          attachments: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.serviceOrder.count({ where }),
    ])

    return NextResponse.json({
      data: serviceOrders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Erro ao buscar OS:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// POST - Criar nova OS
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Extrair campos básicos
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const priority = formData.get('priority') as string
    const specificLocation = formData.get('specificLocation') as string | null

    // Validar campos obrigatórios
    if (!title || !description || !category || !priority) {
      return NextResponse.json(
        { error: "Campos obrigatórios não preenchidos" },
        { status: 400 }
      )
    }

    // Por enquanto, usar um usuário padrão (depois implementaremos autenticação)
    const defaultUser = await prisma.user.findUnique({
      where: { email: 'maria.educacao@prefeitura.gov.br' },
      include: { department: true }
    })

    if (!defaultUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Gerar número sequencial da OS
    const currentYear = new Date().getFullYear()
    const lastOrder = await prisma.serviceOrder.findFirst({
      where: {
        number: {
          startsWith: `OS-${currentYear}-`,
        },
      },
      orderBy: {
        number: "desc",
      },
    })

    let nextNumber = 1
    if (lastOrder) {
      const lastNumber = parseInt(lastOrder.number.split("-")[2])
      nextNumber = lastNumber + 1
    }

    const orderNumber = `OS-${currentYear}-${nextNumber.toString().padStart(3, "0")}`

    // Criar a OS
    const serviceOrder = await prisma.serviceOrder.create({
      data: {
        title,
        description,
        category: category as any,
        priority: priority as any,
        number: orderNumber,
        createdById: defaultUser.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            department: {
              select: {
                name: true,
                location: true,
                building: true,
              }
            }
          },
        },
      },
    })

    // Processar arquivos se existirem
    const uploadedFiles: any[] = []
    
    // Criar diretório de uploads se não existir
    const uploadsDir = join(process.cwd(), 'uploads', 'service-orders', serviceOrder.id)
    await mkdir(uploadsDir, { recursive: true })

    // Processar imagens
    const images = formData.getAll('images') as File[]
    for (const file of images) {
      if (file.size > 0) {
        const fileName = `${randomUUID()}-${file.name}`
        const filePath = join(uploadsDir, fileName)
        
        const bytes = await file.arrayBuffer()
        await writeFile(filePath, Buffer.from(bytes))
        
        const attachment = await prisma.attachment.create({
          data: {
            serviceOrderId: serviceOrder.id,
            filename: fileName,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            path: `/uploads/service-orders/${serviceOrder.id}/${fileName}`,
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
        const fileName = `${randomUUID()}-${file.name}`
        const filePath = join(uploadsDir, fileName)
        
        const bytes = await file.arrayBuffer()
        await writeFile(filePath, Buffer.from(bytes))
        
        const attachment = await prisma.attachment.create({
          data: {
            serviceOrderId: serviceOrder.id,
            filename: fileName,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            path: `/uploads/service-orders/${serviceOrder.id}/${fileName}`,
            type: AttachmentType.DOCUMENT,
          }
        })
        
        uploadedFiles.push(attachment)
      }
    }

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        serviceOrderId: serviceOrder.id,
        userId: defaultUser.id,
        action: "OS_CREATED",
        details: {
          orderNumber: serviceOrder.number,
          title: serviceOrder.title,
          attachmentsCount: uploadedFiles.length,
        },
      },
    })

    // Criar notificações para técnicos sobre nova OS
    try {
      const notificationCount = await NotificationService.notifyNewServiceOrder(serviceOrder.id)
      console.log(`Criadas ${notificationCount} notificações para técnicos`)
    } catch (error) {
      console.error('Erro ao criar notificações:', error)
      // Não falhar a criação da OS por causa das notificações
    }

    // Retornar OS com anexos
    const serviceOrderWithAttachments = {
      ...serviceOrder,
      attachments: uploadedFiles
    }

    return NextResponse.json(serviceOrderWithAttachments, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar OS:", error)

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
