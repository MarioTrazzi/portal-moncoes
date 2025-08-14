import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { NotificationService } from "@/lib/notification-service"
import { verifyAuth } from "@/lib/auth"

// GET - Buscar OS por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação
    const authResult = await verifyAuth(request)
    if (authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }
    
    const { id } = await params
    const serviceOrder = await prisma.serviceOrder.findUnique({
      where: {
        id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            position: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        quotes: {
          include: {
            supplier: true,
          },
        },
        attachments: true,
        auditLogs: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    })

    if (!serviceOrder) {
      return NextResponse.json(
        { success: false, error: "OS não encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: serviceOrder
    })
  } catch (error) {
    console.error("Erro ao buscar OS:", error)
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// PUT - Atualizar OS
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, assignedToId, diagnosis, solution, observations, estimatedHours, actualHours } = body

    // Obter usuário atual baseado no testUser (simulação de autenticação)
    const url = new URL(request.url)
    const testUser = url.searchParams.get('testUser')
    
    const testUserMapping = {
      funcionario: 'funcionario@prefeitura.gov.br',  // FUNCIONARIO
      tecnico: 'tecnico@prefeitura.gov.br',         // TECNICO  
      admin: 'admin@prefeitura.gov.br',                 // ADMIN
      gestor: 'gestor@prefeitura.gov.br',              // GESTOR
      aprovador: 'admin@prefeitura.gov.br'            // APROVADOR
    }
    
    const userEmail = testUserMapping[testUser as keyof typeof testUserMapping] || testUserMapping.funcionario
    
    const currentUser = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 401 }
      )
    }

    // Verificar se a OS existe
    const existingOS = await prisma.serviceOrder.findUnique({
      where: { id },
      include: {
        createdBy: true
      }
    })

    if (!existingOS) {
      return NextResponse.json(
        { error: "OS não encontrada" },
        { status: 404 }
      )
    }

    // Verificar permissões baseadas nas regras de negócio
    const isTechnician = currentUser.role === 'TECNICO'
    const isCreator = currentUser.id === existingOS.createdById
    const canEdit = isTechnician || (isCreator && existingOS.status === 'ABERTA')

    // Verificar se pode editar campos específicos
    if (status !== undefined && !canEdit) {
      return NextResponse.json(
        { error: "Você não tem permissão para alterar o status desta OS" },
        { status: 403 }
      )
    }

    if ((diagnosis !== undefined || solution !== undefined) && !isTechnician) {
      return NextResponse.json(
        { error: "Apenas técnicos podem adicionar diagnóstico ou solução" },
        { status: 403 }
      )
    }

    if (observations !== undefined && !canEdit) {
      return NextResponse.json(
        { error: "Você não tem permissão para editar observações desta OS" },
        { status: 403 }
      )
    }

    // Preparar dados para atualização
    const updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId
    if (diagnosis !== undefined) updateData.diagnosis = diagnosis
    if (solution !== undefined) updateData.solution = solution
    if (observations !== undefined) updateData.observations = observations
    if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours
    if (actualHours !== undefined) updateData.actualHours = actualHours

    // Atualizar datas baseadas no status
    if (status) {
      if (status === 'EM_EXECUCAO' && !existingOS.startedAt) {
        updateData.startedAt = new Date()
      }
      if (status === 'FINALIZADA' && !existingOS.completedAt) {
        updateData.completedAt = new Date()
      }
    }

    // Atualizar assignedAt se atribuindo a alguém
    if (assignedToId && !existingOS.assignedToId) {
      updateData.assignedAt = new Date()
    }

    const serviceOrder = await prisma.serviceOrder.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        serviceOrderId: serviceOrder.id,
        userId: currentUser.id, // Usar o ID do usuário atual
        action: "OS_UPDATED",
        details: {
          changes: updateData,
          orderNumber: serviceOrder.number,
        },
      },
    })

    // Criar notificações para as atualizações
    try {
      // Determinar o tipo de atualização
      let updateType: 'status' | 'assignment' | 'completion' = 'status'
      if (updateData.assignedToId && !existingOS.assignedToId) {
        updateType = 'assignment'
      } else if (updateData.status === 'FINALIZADA') {
        updateType = 'completion'
      }

      await NotificationService.notifyServiceOrderUpdate(
        serviceOrder.id, 
        updateType, 
        existingOS.createdById // Usar o ID do criador da OS
      )
    } catch (error) {
      console.error("Erro ao criar notificações:", error)
      // Não falhar a atualização por causa das notificações
    }

    return NextResponse.json(serviceOrder)
  } catch (error) {
    console.error("Erro ao atualizar OS:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
