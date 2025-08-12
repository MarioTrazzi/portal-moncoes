import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ServiceOrderStatus } from "@prisma/client"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    const { 
      diagnosis, 
      solution, 
      observations, 
      requiresMaterial, 
      materialDescription, 
      materialJustification,
      status,
      estimatedHours 
    } = body

    // Buscar a OS atual
    const currentOrder = await prisma.serviceOrder.findUnique({
      where: { id },
      include: { createdBy: true, assignedTo: true }
    })

    if (!currentOrder) {
      return NextResponse.json(
        { error: "OS não encontrada" },
        { status: 404 }
      )
    }

    // Atualizar a OS
    const updatedOrder = await prisma.serviceOrder.update({
      where: { id },
      data: {
        diagnosis,
        solution,
        observations,
        requiresMaterial,
        materialDescription,
        materialJustification,
        status,
        estimatedHours,
        ...(status === ServiceOrderStatus.SOLICITAR_ORCAMENTO && { startedAt: new Date() })
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
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        quotes: {
          include: {
            supplier: true
          }
        }
      },
    })

    // Log de auditoria
    await prisma.auditLog.create({
      data: {
        serviceOrderId: id,
        userId: currentOrder.assignedToId!, // Assumindo que é o técnico fazendo a atualização
        action: requiresMaterial ? "MATERIAL_REQUESTED" : "OS_UPDATED",
        details: {
          diagnosis,
          solution,
          observations,
          requiresMaterial,
          materialDescription,
          materialJustification,
          newStatus: status,
          estimatedHours
        },
      },
    })

    // Se materiais foram solicitados, criar notificações para gestores
    if (requiresMaterial && status === ServiceOrderStatus.SOLICITAR_ORCAMENTO) {
      // Buscar gestores e aprovadores
      const gestores = await prisma.user.findMany({
        where: {
          role: { in: ["GESTOR", "APROVADOR"] },
          active: true
        }
      })

      // Criar notificações
      for (const gestor of gestores) {
        await prisma.notification.create({
          data: {
            type: "MATERIAL_NEEDED",
            title: "Material Solicitado",
            message: `OS ${currentOrder.number} - ${currentOrder.title}: Técnico solicitou materiais`,
            userId: gestor.id,
            serviceOrderId: id,
            actionUrl: `/dashboard/service-orders/${id}`,
            actionText: "Ver OS",
          },
        })
      }
    }

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error("Erro ao atualizar OS:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
