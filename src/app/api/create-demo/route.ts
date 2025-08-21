import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    console.log('Criando OS de demonstração com orçamentos...')
    
    // Criar fornecedores
    const supplier1 = await prisma.supplier.create({
      data: {
        name: 'TechSup Equipamentos',
        cnpj: '12.345.678/0001-90',
        email: 'contato@techsup.com.br',
        phone: '(11) 3333-1111',
        address: 'Rua da Tecnologia, 123',
        contact: 'João Silva',
        categories: JSON.stringify(['HARDWARE', 'REDE'])
      }
    })

    const supplier2 = await prisma.supplier.create({
      data: {
        name: 'InfoMax Sistemas',
        cnpj: '98.765.432/0001-10',
        email: 'vendas@infomax.com.br',
        phone: '(11) 4444-2222',
        address: 'Av. Digital, 456',
        contact: 'Maria Souza',
        categories: JSON.stringify(['HARDWARE', 'REDE'])
      }
    })

    // Buscar a OS criada
    const serviceOrder = await prisma.serviceOrder.findFirst({
      where: {
        title: 'Switch de rede queimado - TI'
      }
    })

    if (!serviceOrder) {
      return NextResponse.json({ error: 'OS não encontrada' }, { status: 404 })
    }

    // Buscar um gestor para ser o requestedBy
    const gestor = await prisma.user.findFirst({
      where: { role: 'GESTOR' }
    })

    if (!gestor) {
      return NextResponse.json({ error: 'Gestor não encontrado' }, { status: 404 })
    }

    // Atualizar OS
    await prisma.serviceOrder.update({
      where: { id: serviceOrder.id },
      data: {
        status: 'ORCAMENTOS_RECEBIDOS',
        diagnosis: 'Switch HP ProCurve 2524 completamente queimado. Provável sobretensão durante temporal.',
        solution: 'Substituição completa do switch por modelo equivalente ou superior.',
        requiresMaterial: true,
        materialDescription: 'Switch gerenciável 24 portas 10/100/1000 Mbps - Modelo similar: HP ProCurve 2530-24G ou equivalente',
        materialJustification: 'Equipamento crítico para conectividade de rede do departamento de TI. Sem ele, não há acesso à internet nem à rede interna.'
      }
    })

    // Criar orçamentos
    const quote1 = await prisma.quote.create({
      data: {
        serviceOrderId: serviceOrder.id,
        supplierId: supplier1.id,
        requestedById: gestor.id,
        totalValue: 2850.00,
        deliveryTime: 5,
        validity: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        observations: 'Produto em estoque. Entrega em até 5 dias úteis.',
        status: 'RECEBIDO',
        items: [
          {
            description: 'Switch HP ProCurve 2530-24G 24 portas Gigabit',
            quantity: 1,
            unitPrice: 2650.00,
            totalPrice: 2650.00
          },
          {
            description: 'Cabo de força padrão brasileiro',
            quantity: 1,
            unitPrice: 25.00,
            totalPrice: 25.00
          },
          {
            description: 'Garantia estendida 3 anos',
            quantity: 1,
            unitPrice: 175.00,
            totalPrice: 175.00
          }
        ]
      }
    })

    const quote2 = await prisma.quote.create({
      data: {
        serviceOrderId: serviceOrder.id,
        supplierId: supplier2.id,
        requestedById: gestor.id,
        totalValue: 3100.00,
        deliveryTime: 3,
        validity: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        observations: 'Produto premium com garantia estendida incluída.',
        status: 'RECEBIDO',
        items: [
          {
            description: 'Switch D-Link DGS-1024D 24 portas Gigabit',
            quantity: 1,
            unitPrice: 2900.00,
            totalPrice: 2900.00
          },
          {
            description: 'Cabo de força',
            quantity: 1,
            unitPrice: 30.00,
            totalPrice: 30.00
          },
          {
            description: 'Suporte técnico 1 ano',
            quantity: 1,
            unitPrice: 170.00,
            totalPrice: 170.00
          }
        ]
      }
    })

    return NextResponse.json({ 
      message: 'OS de demonstração criada com sucesso!',
      data: {
        serviceOrder: {
          id: serviceOrder.id,
          number: serviceOrder.number,
          title: serviceOrder.title,
          status: 'ORCAMENTOS_RECEBIDOS'
        },
        suppliers: [supplier1.name, supplier2.name],
        quotes: [
          { supplier: supplier1.name, value: 2850.00 },
          { supplier: supplier2.name, value: 3100.00 }
        ]
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Erro ao criar demo:', error)
    return NextResponse.json({ 
      error: 'Erro ao criar demonstração',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
