import { PrismaClient, UserRole, ServiceOrderStatus, Priority, ProblemCategory, QuoteStatus, PurchaseOrderStatus, AttachmentType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // 1. Limpar banco existente
  console.log('🧹 Limpando dados existentes...')
  await prisma.auditLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.attachment.deleteMany()
  await prisma.quote.deleteMany()
  await prisma.purchaseOrder.deleteMany()
  await prisma.serviceOrder.deleteMany()
  await prisma.user.deleteMany()
  await prisma.supplier.deleteMany()
  await prisma.department.deleteMany()

  // 2. Criar departamentos
  console.log('🏢 Criando departamentos...')
  const departments = await Promise.all([
    prisma.department.create({
      data: {
        name: 'Tecnologia da Informação',
        location: 'Prédio Administrativo, 2º andar',
        building: 'Edifício Central',
        floor: '2º andar',
        responsible: 'João Carlos Silva'
      }
    }),
    prisma.department.create({
      data: {
        name: 'Recursos Humanos',
        location: 'Prédio Administrativo, 1º andar',
        building: 'Edifício Central', 
        floor: '1º andar',
        responsible: 'Maria Santos Oliveira'
      }
    }),
    prisma.department.create({
      data: {
        name: 'Finanças',
        location: 'Prédio Administrativo, 3º andar',
        building: 'Edifício Central',
        floor: '3º andar', 
        responsible: 'Carlos Eduardo Lima'
      }
    }),
    prisma.department.create({
      data: {
        name: 'Saúde',
        location: 'Posto de Saúde Central',
        building: 'Unidade de Saúde',
        floor: 'Térreo',
        responsible: 'Dra. Ana Paula Costa'
      }
    }),
    prisma.department.create({
      data: {
        name: 'Educação',
        location: 'Secretaria de Educação',
        building: 'Prédio da Educação',
        floor: '1º andar',
        responsible: 'Prof. Roberto Mendes'
      }
    })
  ])

  // 3. Criar fornecedores
  console.log('🏪 Criando fornecedores...')
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: 'TecnoInfo Soluções',
        cnpj: '12.345.678/0001-90',
        email: 'vendas@tecnoinfo.com.br',
        phone: '(11) 98765-4321',
        address: 'Rua da Tecnologia, 123, São Paulo - SP',
        contact: 'Ricardo Pereira',
        categories: JSON.stringify(['HARDWARE', 'SOFTWARE', 'REDE'])
      }
    }),
    prisma.supplier.create({
      data: {
        name: 'ElétricaMax Ltda',
        cnpj: '98.765.432/0001-12',
        email: 'orcamentos@eletricamax.com.br',
        phone: '(11) 87654-3210',
        address: 'Av. das Instalações, 456, São Paulo - SP',
        contact: 'Paulo Santos',
        categories: JSON.stringify(['HARDWARE', 'OUTROS'])
      }
    }),
    prisma.supplier.create({
      data: {
        name: 'Office Premium',
        cnpj: '11.222.333/0001-44',
        email: 'comercial@officepremium.com.br',
        phone: '(11) 76543-2109',
        address: 'Rua dos Escritórios, 789, São Paulo - SP',
        contact: 'Fernanda Costa',
        categories: JSON.stringify(['IMPRESSORA', 'HARDWARE', 'OUTROS'])
      }
    })
  ])

  // 4. Criar usuários com senhas hasheadas
  console.log('👥 Criando usuários...')
  const users = await Promise.all([
    // Admin
    prisma.user.create({
      data: {
        email: 'admin@prefeitura.gov.br',
        name: 'Administrador do Sistema',
        password: await bcrypt.hash('admin123', 10),
        role: UserRole.ADMIN,
        registration: 'ADM001',
        phone: '(11) 99999-0001',
        position: 'Administrador de TI',
        departmentId: departments[0].id,
        room: 'Sala 201'
      }
    }),
    // Gestor
    prisma.user.create({
      data: {
        email: 'gestor@prefeitura.gov.br',
        name: 'Carlos Eduardo Lima',
        password: await bcrypt.hash('gestor123', 10),
        role: UserRole.GESTOR,
        registration: 'GES001',
        phone: '(11) 99999-0002',
        position: 'Diretor de Finanças',
        departmentId: departments[2].id,
        room: 'Sala 301'
      }
    }),
    // Técnico
    prisma.user.create({
      data: {
        email: 'tecnico@prefeitura.gov.br',
        name: 'Ricardo Silva Santos',
        password: await bcrypt.hash('tecnico123', 10),
        role: UserRole.TECNICO,
        registration: 'TEC001',
        phone: '(11) 99999-0003',
        position: 'Técnico em Informática',
        departmentId: departments[0].id,
        room: 'Sala 202'
      }
    }),
    // Funcionário
    prisma.user.create({
      data: {
        email: 'funcionario@prefeitura.gov.br',
        name: 'Maria Santos Oliveira',
        password: await bcrypt.hash('funcionario123', 10),
        role: UserRole.FUNCIONARIO,
        registration: 'FUN001',
        phone: '(11) 99999-0004',
        position: 'Auxiliar Administrativo',
        departmentId: departments[1].id,
        room: 'Sala 101'
      }
    }),
    // Aprovador
    prisma.user.create({
      data: {
        email: 'aprovador@prefeitura.gov.br',
        name: 'João Carlos Silva',
        password: await bcrypt.hash('aprovador123', 10),
        role: UserRole.APROVADOR,
        registration: 'APR001',
        phone: '(11) 99999-0005',
        position: 'Coordenador de TI',
        departmentId: departments[0].id,
        room: 'Sala 203'
      }
    }),
    // Funcionários adicionais
    prisma.user.create({
      data: {
        email: 'ana.costa@prefeitura.gov.br',
        name: 'Ana Paula Costa',
        password: await bcrypt.hash('ana123', 10),
        role: UserRole.FUNCIONARIO,
        registration: 'FUN002',
        phone: '(11) 99999-0006',
        position: 'Enfermeira',
        departmentId: departments[3].id,
        room: 'Consultório 1'
      }
    }),
    prisma.user.create({
      data: {
        email: 'roberto.mendes@prefeitura.gov.br',
        name: 'Roberto Mendes',
        password: await bcrypt.hash('roberto123', 10),
        role: UserRole.FUNCIONARIO,
        registration: 'FUN003',
        phone: '(11) 99999-0007',
        position: 'Coordenador Pedagógico',
        departmentId: departments[4].id,
        room: 'Sala 101'
      }
    })
  ])

  const [admin, gestor, tecnico, funcionario, aprovador, ana, roberto] = users

  // 5. Criar Ordens de Serviço com fluxo completo
  console.log('📋 Criando ordens de serviço...')

  // OS 1: Finalizada com compra de material
  const os1 = await prisma.serviceOrder.create({
    data: {
      number: 'OS-2025-001',
      title: 'Computador não liga no RH',
      description: 'O computador da recepção do RH não está ligando. Quando pressionamos o botão power, não há qualquer resposta. O equipamento é utilizado para atendimento ao público.',
      status: ServiceOrderStatus.FINALIZADA,
      priority: Priority.ALTA,
      category: ProblemCategory.HARDWARE,
      createdById: funcionario.id,
      assignedToId: tecnico.id,
      diagnosis: 'Fonte de alimentação queimada',
      solution: 'Fonte queimada substituída. Computador funcionando normalmente.',
      requiresMaterial: true,
      materialDescription: 'Fonte de alimentação ATX 500W 80+ Bronze',
      createdAt: new Date('2025-08-10'),
      updatedAt: new Date('2025-08-15'),
      completedAt: new Date('2025-08-15')
    }
  })

  // Orçamentos para OS1
  const quote1_1 = await prisma.quote.create({
    data: {
      serviceOrderId: os1.id,
      supplierId: suppliers[0].id,
      requestedById: tecnico.id,
      items: [
        {
          description: 'Fonte ATX 500W 80+ Bronze Corsair',
          quantity: 1,
          unitPrice: 180.00,
          totalPrice: 180.00
        }
      ],
      totalValue: 180.00,
      status: QuoteStatus.REJEITADO,
      validity: new Date('2025-08-20'),
      observations: 'Marca premium, garantia de 3 anos',
      createdAt: new Date('2025-08-12'),
      updatedAt: new Date('2025-08-13'),
      rejectedAt: new Date('2025-08-13'),
      rejectionReason: 'Preço muito alto comparado com outras opções'
    }
  })

  const quote1_2 = await prisma.quote.create({
    data: {
      serviceOrderId: os1.id,
      supplierId: suppliers[1].id,
      requestedById: tecnico.id,
      items: [
        {
          description: 'Fonte ATX 500W 80+ Bronze Genérica',
          quantity: 1,
          unitPrice: 120.00,
          totalPrice: 120.00
        }
      ],
      totalValue: 120.00,
      status: QuoteStatus.APROVADO,
      validity: new Date('2025-08-20'),
      observations: 'Melhor custo-benefício',
      createdAt: new Date('2025-08-12'),
      updatedAt: new Date('2025-08-14'),
      approvedAt: new Date('2025-08-14')
    }
  })

  // Ordem de compra para OS1
  const po1 = await prisma.purchaseOrder.create({
    data: {
      number: 'OC-2025-001',
      serviceOrderId: os1.id,
      quoteId: quote1_2.id,
      items: [
        {
          description: 'Fonte ATX 500W 80+ Bronze Genérica',
          quantity: 1,
          unitPrice: 120.00,
          totalPrice: 120.00
        }
      ],
      totalValue: 120.00,
      deliveryAddress: 'Prefeitura Municipal - Recepção do RH, Sala 101',
      status: PurchaseOrderStatus.ENTREGUE,
      approvedById: aprovador.id,
      signedById: gestor.id,
      receivedById: tecnico.id,
      createdAt: new Date('2025-08-14'),
      updatedAt: new Date('2025-08-15'),
      approvedAt: new Date('2025-08-14'),
      signedAt: new Date('2025-08-14'),
      deliveredAt: new Date('2025-08-15'),
      observations: 'Material entregue conforme solicitado'
    }
  })

  // OS 2: Em execução aguardando material
  const os2 = await prisma.serviceOrder.create({
    data: {
      number: 'OS-2025-002',
      title: 'Impressora laser com defeito na Educação',
      description: 'A impressora laser HP LaserJet do setor pedagógico está apresentando problema na impressão. As páginas saem com manchas pretas e a qualidade está ruim.',
      status: ServiceOrderStatus.AGUARDANDO_APROVACAO,
      priority: Priority.NORMAL,
      category: ProblemCategory.IMPRESSORA,
      createdById: roberto.id,
      assignedToId: tecnico.id,
      diagnosis: 'Toner vazio e cilindro com desgaste. Necessário substituir ambos para resolver o problema.',
      requiresMaterial: true,
      materialDescription: 'Toner HP 85A original e cilindro compatível',
      createdAt: new Date('2025-08-12'),
      updatedAt: new Date('2025-08-13')
    }
  })

  // Orçamentos para OS2 (aguardando aprovação)
  await Promise.all([
    prisma.quote.create({
      data: {
        serviceOrderId: os2.id,
        supplierId: suppliers[2].id,
        requestedById: tecnico.id,
        items: [
          {
            description: 'Toner HP 85A Original',
            quantity: 1,
            unitPrice: 180.00,
            totalPrice: 180.00
          },
          {
            description: 'Cilindro HP Compatível',
            quantity: 1,
            unitPrice: 120.00,
            totalPrice: 120.00
          }
        ],
        totalValue: 300.00,
        status: QuoteStatus.EM_ANALISE,
        validity: new Date('2025-08-25'),
        observations: 'Produtos originais com garantia',
        createdAt: new Date('2025-08-13'),
        updatedAt: new Date('2025-08-13')
      }
    }),
    prisma.quote.create({
      data: {
        serviceOrderId: os2.id,
        supplierId: suppliers[0].id,
        requestedById: tecnico.id,
        items: [
          {
            description: 'Toner HP 85A Compatível',
            quantity: 1,
            unitPrice: 120.00,
            totalPrice: 120.00
          },
          {
            description: 'Cilindro HP Compatível',
            quantity: 1,
            unitPrice: 100.00,
            totalPrice: 100.00
          }
        ],
        totalValue: 220.00,
        status: QuoteStatus.EM_ANALISE,
        validity: new Date('2025-08-25'),
        observations: 'Produtos compatíveis com boa qualidade',
        createdAt: new Date('2025-08-13'),
        updatedAt: new Date('2025-08-13')
      }
    })
  ])

  // OS 3: Recém criada
  const os3 = await prisma.serviceOrder.create({
    data: {
      number: 'OS-2025-003',
      title: 'Internet lenta no Posto de Saúde',
      description: 'A conexão de internet no posto de saúde está muito lenta, dificultando o acesso aos sistemas de prontuário eletrônico e consulta de exames.',
      status: ServiceOrderStatus.EM_ANALISE,
      priority: Priority.ALTA,
      category: ProblemCategory.REDE,
      createdById: ana.id,
      assignedToId: tecnico.id,
      createdAt: new Date('2025-08-13'),
      updatedAt: new Date('2025-08-13')
    }
  })

  // OS 4: Problema de software
  const os4 = await prisma.serviceOrder.create({
    data: {
      number: 'OS-2025-004',
      title: 'Sistema financeiro com erro',
      description: 'O sistema de gestão financeira está apresentando erro ao gerar relatórios mensais. A mensagem de erro indica problema na base de dados.',
      status: ServiceOrderStatus.ABERTA,
      priority: Priority.URGENTE,
      category: ProblemCategory.SOFTWARE,
      createdById: funcionario.id,
      createdAt: new Date('2025-08-13'),
      updatedAt: new Date('2025-08-13')
    }
  })

  // OS 5: Problema telefônico
  const os5 = await prisma.serviceOrder.create({
    data: {
      number: 'OS-2025-005',
      title: 'Telefone sem linha no RH',
      description: 'O telefone da sala 105 do RH não está funcionando. Não há sinal de linha e não conseguimos fazer ou receber chamadas.',
      status: ServiceOrderStatus.AGUARDANDO_DESLOCAMENTO,
      priority: Priority.NORMAL,
      category: ProblemCategory.TELEFONIA,
      createdById: funcionario.id,
      assignedToId: tecnico.id,
      createdAt: new Date('2025-08-13'),
      updatedAt: new Date('2025-08-13')
    }
  })

  console.log('✅ Seed concluído com sucesso!')
  console.log(`📊 Dados criados:`)
  console.log(`   - ${departments.length} departamentos`)
  console.log(`   - ${suppliers.length} fornecedores`)
  console.log(`   - ${users.length} usuários`)
  console.log(`   - 5 ordens de serviço (com diferentes status)`)
  console.log(`   - 4 orçamentos`)
  console.log(`   - 1 ordem de compra`)
  
  console.log('\n🔐 Credenciais de acesso:')
  console.log('Admin: admin@prefeitura.gov.br / admin123')
  console.log('Gestor: gestor@prefeitura.gov.br / gestor123')
  console.log('Técnico: tecnico@prefeitura.gov.br / tecnico123')
  console.log('Funcionário: funcionario@prefeitura.gov.br / funcionario123')
  console.log('Aprovador: aprovador@prefeitura.gov.br / aprovador123')
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
