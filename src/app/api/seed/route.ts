import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    // Verificar se já existem usuários
    const existingUsers = await prisma.user.count()
    if (existingUsers > 0) {
      return NextResponse.json({ 
        message: 'Banco já possui dados, seed não executado',
        usersCount: existingUsers 
      })
    }

    // Criar departamento padrão
    const department = await prisma.department.create({
      data: {
        name: 'Secretaria de Tecnologia',
        description: 'Departamento de TI da Prefeitura',
        location: 'Prédio Principal - 2º Andar',
        building: 'Prefeitura',
        floor: '2º',
        responsible: 'João Silva',
        phone: '(11) 1234-5678',
        email: 'ti@prefeitura.gov.br'
      }
    })

    // Criar usuários padrão
    const users = await Promise.all([
      // Admin
      prisma.user.create({
        data: {
          email: 'admin@prefeitura.gov.br',
          name: 'Administrador do Sistema',
          password: await bcrypt.hash('admin123', 10),
          role: 'ADMIN',
          registration: 'ADM001',
          position: 'Administrador de Sistemas',
          departmentId: department.id,
          room: 'Sala 201'
        }
      }),
      // Gestor
      prisma.user.create({
        data: {
          email: 'gestor@prefeitura.gov.br',
          name: 'Maria Santos',
          password: await bcrypt.hash('gestor123', 10),
          role: 'GESTOR',
          registration: 'GES001',
          position: 'Gerente de TI',
          departmentId: department.id,
          room: 'Sala 202'
        }
      }),
      // Técnico
      prisma.user.create({
        data: {
          email: 'tecnico@prefeitura.gov.br',
          name: 'Carlos Oliveira',
          password: await bcrypt.hash('tecnico123', 10),
          role: 'TECNICO',
          registration: 'TEC001',
          position: 'Técnico em Informática',
          departmentId: department.id,
          room: 'Sala 203'
        }
      }),
      // Funcionário
      prisma.user.create({
        data: {
          email: 'funcionario@prefeitura.gov.br',
          name: 'Ana Costa',
          password: await bcrypt.hash('funcionario123', 10),
          role: 'FUNCIONARIO',
          registration: 'FUN001',
          position: 'Assistente Administrativo',
          departmentId: department.id,
          room: 'Sala 101'
        }
      })
    ])

    // Criar algumas OS de exemplo
    const serviceOrders = await Promise.all([
      prisma.serviceOrder.create({
        data: {
          number: 'OS-001',
          title: 'Computador não liga',
          description: 'O computador da sala 105 não está ligando. Já tentei apertar o botão várias vezes.',
          category: 'HARDWARE',
          priority: 'ALTA',
          status: 'ABERTA',
          createdById: users[3].id, // Funcionário
          requiresMaterial: false
        }
      }),
      prisma.serviceOrder.create({
        data: {
          number: 'OS-002',
          title: 'Internet lenta',
          description: 'A internet está muito lenta no departamento de recursos humanos.',
          category: 'REDE',
          priority: 'NORMAL',
          status: 'EM_ANALISE',
          createdById: users[3].id, // Funcionário
          assignedToId: users[2].id, // Técnico
          assignedAt: new Date(),
          requiresMaterial: false
        }
      })
    ])

    return NextResponse.json({
      message: 'Seed executado com sucesso!',
      data: {
        department: department.name,
        users: users.map(u => ({ name: u.name, role: u.role, email: u.email })),
        serviceOrders: serviceOrders.map(os => ({ number: os.number, title: os.title }))
      }
    })

  } catch (error) {
    console.error('Erro no seed:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao executar seed', 
        details: error instanceof Error ? error.message : 'Erro desconhecido' 
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
