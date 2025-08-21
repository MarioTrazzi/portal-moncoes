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
    const { status, assignedToId, diagnosis, solution, observations, estimatedHours, actualHours, materialDescription, materialJustification } = body

    // Verificar autenticação com JWT
    const authResult = await verifyAuth(request)
    if (authResult.error || !authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Usuário não autenticado" },
        { status: authResult.status || 401 }
      )
    }

    const currentUser = authResult.user

    // Verificar se a OS existe
    const existingOS = await prisma.serviceOrder.findUnique({
      where: { id },
      include: {
        createdBy: true
      }
    })

    if (!existingOS) {
      return NextResponse.json(
        { success: false, error: "OS não encontrada" },
        { status: 404 }
      )
    }

    // Verificar permissões baseadas nas regras de negócio e workflow
    const isTechnician = currentUser.role === 'TECNICO'
    const isCreator = currentUser.id === existingOS.createdById
    const isApprover = currentUser.role === 'APROVADOR'
    const isManager = currentUser.role === 'GESTOR'
    const isAdmin = currentUser.role === 'ADMIN'

    // Permissão geral para editar campos não-críticos (observações, etc)
    const canEditGeneral = isTechnician || isCreator || isApprover || isManager || isAdmin

    // Permissões para alteração de status
    let canChangeStatus = false
    
    if (status !== undefined) {
      // Verificar se o usuário pode fazer esta transição de status específica
      switch (existingOS.status) {
        case 'ABERTA':
          canChangeStatus = isTechnician && status === 'EM_ANALISE'
          break
        case 'EM_ANALISE':
          canChangeStatus = isTechnician && (status === 'AGUARDANDO_MATERIAL' || status === 'EM_EXECUCAO')
          break
        case 'AGUARDANDO_MATERIAL':
          canChangeStatus = (isManager || isAdmin) && status === 'AGUARDANDO_ORCAMENTO'
          break
        case 'AGUARDANDO_ORCAMENTO':
          canChangeStatus = (isApprover || isAdmin) && status === 'AGUARDANDO_ASSINATURA'
          break
        case 'ORCAMENTOS_RECEBIDOS':
          canChangeStatus = (isManager || isApprover || isAdmin) && status === 'AGUARDANDO_ASSINATURA'
          break
        case 'AGUARDANDO_ASSINATURA':
          canChangeStatus = isAdmin && status === 'MATERIAL_APROVADO'
          break
        case 'AGUARDANDO_APROVACAO':
          canChangeStatus = (isManager || isAdmin) && status === 'MATERIAL_APROVADO'
          break
        case 'MATERIAL_APROVADO':
          canChangeStatus = isTechnician && status === 'AGUARDANDO_DESLOCAMENTO'
          break
        case 'AGUARDANDO_DESLOCAMENTO':
          canChangeStatus = isTechnician && status === 'EM_EXECUCAO'
          break
        case 'EM_EXECUCAO':
          canChangeStatus = isTechnician && status === 'FINALIZADA'
          break
        default:
          canChangeStatus = false
      }

      if (!canChangeStatus) {
        return NextResponse.json(
          { success: false, error: "Você não tem permissão para fazer esta alteração de status" },
          { status: 403 }
        )
      }
    }

    // Verificar se pode editar campos técnicos (somente se os campos realmente estão sendo enviados)
    if ((diagnosis !== undefined && diagnosis !== null && diagnosis.trim() !== '') && !isTechnician) {
      return NextResponse.json(
        { success: false, error: "Apenas técnicos podem adicionar diagnóstico" },
        { status: 403 }
      )
    }

    if ((solution !== undefined && solution !== null && solution.trim() !== '') && !isTechnician) {
      return NextResponse.json(
        { success: false, error: "Apenas técnicos podem adicionar solução" },
        { status: 403 }
      )
    }

    // Observações podem ser editadas por todos os perfis autorizados
    if ((observations !== undefined && observations !== null && observations.trim() !== '') && !canEditGeneral) {
      return NextResponse.json(
        { success: false, error: "Você não tem permissão para editar observações desta OS" },
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
    if (materialDescription !== undefined) updateData.materialDescription = materialDescription
    if (materialJustification !== undefined) updateData.materialJustification = materialJustification
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
