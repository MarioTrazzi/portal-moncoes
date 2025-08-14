import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { AttachmentType, UserRole } from "@prisma/client"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { randomUUID } from "crypto"
import { getUserPermissions } from "@/hooks/use-permissions"
import { NotificationService } from "@/lib/notification-service"
import { verifyAuth } from "@/lib/auth"

// GET - Listar OS (filtradas por permissão do usuário)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Verificar autenticação
    const authResult = await verifyAuth(request)
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }
    
    const currentUser = authResult.user!

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
      serviceOrders,
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
    console.log('=== INÍCIO POST SERVICE ORDER ===')
    
    // Log inicial para debug
    console.log('Headers:', Object.fromEntries(request.headers.entries()))

    const formData = await request.formData()
    console.log('FormData recebido, processando...')

    // Extrair dados do formulário
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const category = formData.get("category") as string
    const priority = formData.get("priority") as string

    console.log('Dados extraídos:', { title, description, category, priority })

    // Validação básica
    if (!title || !description || !category || !priority) {
      console.log('Erro de validação - campos obrigatórios')
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      )
    }

    // Validar enums
    const validCategories = ['HARDWARE', 'SOFTWARE', 'REDE', 'IMPRESSORA', 'TELEFONIA', 'SISTEMA', 'OUTROS']
    const validPriorities = ['BAIXA', 'NORMAL', 'ALTA', 'URGENTE']
    
    if (!validCategories.includes(category)) {
      console.log('Categoria inválida:', category)
      return NextResponse.json(
        { error: `Categoria inválida: ${category}. Válidas: ${validCategories.join(', ')}` },
        { status: 400 }
      )
    }
    
    if (!validPriorities.includes(priority)) {
      console.log('Prioridade inválida:', priority)
      return NextResponse.json(
        { error: `Prioridade inválida: ${priority}. Válidas: ${validPriorities.join(', ')}` },
        { status: 400 }
      )
    }

    console.log('Validação passou')

    // Verificar autenticação
    console.log('Verificando autenticação...')
    const authResult = await verifyAuth(request)
    if (authResult.error) {
      console.log('Erro de autenticação:', authResult.error)
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }
    
    const currentUser = authResult.user!
    console.log('Usuário autenticado:', currentUser.id)

    // Gerar número sequencial da OS
    console.log('Gerando número da OS...')
    
    let orderNumber
    try {
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

      orderNumber = `OS-${currentYear}-${nextNumber.toString().padStart(3, "0")}`
      console.log('Número da OS gerado:', orderNumber)
    } catch (numberError) {
      console.error('Erro ao gerar número da OS:', numberError)
      return NextResponse.json(
        { error: "Erro ao gerar número da OS" },
        { status: 500 }
      )
    }

    // Criar a OS
    console.log('Criando OS no banco...')
    let serviceOrder
    try {
      serviceOrder = await prisma.serviceOrder.create({
        data: {
          title,
          description,
          category: category as any,
          priority: priority as any,
          number: orderNumber,
          createdById: currentUser.id,
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
    console.log('OS criada com sucesso:', serviceOrder.id)
    } catch (createError) {
      console.error('Erro ao criar OS:', createError)
      return NextResponse.json(
        { error: "Erro ao criar OS" },
        { status: 500 }
      )
    }

    // Processar arquivos se existirem
    console.log('Processando arquivos...')
    const uploadedFiles: any[] = []
    
    try {
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
      console.log(`Processados ${uploadedFiles.length} arquivos`)
    } catch (fileError) {
      console.error('Erro ao processar arquivos:', fileError)
      // Continuar mesmo se houver erro com arquivos
    }

    // Log de auditoria
    console.log('Criando log de auditoria...')
    try {
      await prisma.auditLog.create({
        data: {
          serviceOrderId: serviceOrder.id,
          userId: currentUser.id,
          action: "OS_CREATED",
          details: {
            orderNumber: serviceOrder.number,
            title: serviceOrder.title,
            attachmentsCount: uploadedFiles.length,
          },
        },
      })
      console.log('Log de auditoria criado')
    } catch (auditError) {
      console.error('Erro ao criar log de auditoria:', auditError)
      // Continuar mesmo se houver erro com auditoria
    }

    // Criar notificações para técnicos sobre nova OS
    try {
      // Temporariamente desabilitado para debug
      // const notificationCount = await NotificationService.notifyNewServiceOrder(serviceOrder.id)
      // console.log(`Criadas ${notificationCount} notificações para técnicos`)
      console.log('Notificações desabilitadas temporariamente')
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
