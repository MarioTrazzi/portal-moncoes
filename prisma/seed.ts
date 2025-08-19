import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Limpar dados existentes
  await prisma.auditLog.deleteMany()
  await prisma.attachment.deleteMany()
  await prisma.quote.deleteMany()
  await prisma.purchaseOrder.deleteMany()
  await prisma.serviceOrder.deleteMany()
  await prisma.supplier.deleteMany()
  await prisma.user.deleteMany()
  await prisma.department.deleteMany()

  // Criar departamentos
  const departments = await Promise.all([
    prisma.department.create({
      data: {
        name: 'Secretaria de Tecnologia',
        description: 'Departamento responsável pela infraestrutura de TI',
        location: 'Prédio Central',
        building: 'Anexo A',
        floor: '2º Andar',
        responsible: 'João Silva',
        phone: '(11) 3333-1111',
        email: 'ti@prefeitura.gov.br'
      }
    }),
    prisma.department.create({
      data: {
        name: 'Secretaria de Educação',
        description: 'Departamento de Educação Municipal',
        location: 'Prédio da Educação',
        building: 'Bloco B',
        floor: '1º Andar',
        responsible: 'Maria Santos',
        phone: '(11) 3333-2222',
        email: 'educacao@prefeitura.gov.br'
      }
    }),
    prisma.department.create({
      data: {
        name: 'Secretaria de Saúde',
        description: 'Departamento de Saúde Municipal',
        location: 'Centro de Saúde',
        building: 'Principal',
        floor: 'Térreo',
        responsible: 'Dr. Carlos Lima',
        phone: '(11) 3333-3333',
        email: 'saude@prefeitura.gov.br'
      }
    }),
    prisma.department.create({
      data: {
        name: 'Gabinete do Prefeito',
        description: 'Gabinete executivo municipal',
        location: 'Prédio Central',
        building: 'Principal',
        floor: '3º Andar',
        responsible: 'Ana Costa',
        phone: '(11) 3333-4444',
        email: 'gabinete@prefeitura.gov.br'
      }
    })
  ])

  const [deptTI, deptEducacao, deptSaude, deptGabinete] = departments

  // Criar usuários
  const hashedPassword = await bcrypt.hash('123456', 10)

  const users = await Promise.all([
    // Funcionários
    prisma.user.create({
      data: {
        email: 'funcionario@prefeitura.gov.br',
        name: 'Pedro Funcionário',
        password: hashedPassword,
        role: 'FUNCIONARIO',
        registration: 'FUNC001',
        departmentId: deptEducacao.id,
        phone: '(11) 99999-1111',
        position: 'Assistente Administrativo',
        room: '101'
      }
    }),
    prisma.user.create({
      data: {
        email: 'maria.func@prefeitura.gov.br',
        name: 'Maria Funcionária',
        password: hashedPassword,
        role: 'FUNCIONARIO',
        registration: 'FUNC002',
        departmentId: deptSaude.id,
        phone: '(11) 99999-2222',
        position: 'Recepcionista',
        room: '201'
      }
    }),
    
    // Técnicos
    prisma.user.create({
      data: {
        email: 'tecnico@prefeitura.gov.br',
        name: 'Carlos Técnico',
        password: hashedPassword,
        role: 'TECNICO',
        registration: 'TEC001',
        departmentId: deptTI.id,
        phone: '(11) 99999-3333',
        position: 'Técnico em Informática',
        room: '301'
      }
    }),
    prisma.user.create({
      data: {
        email: 'tecnico2@prefeitura.gov.br',
        name: 'Ana Técnica',
        password: hashedPassword,
        role: 'TECNICO',
        registration: 'TEC002',
        departmentId: deptTI.id,
        phone: '(11) 99999-4444',
        position: 'Técnica em Redes',
        room: '302'
      }
    }),

    // Aprovador
    prisma.user.create({
      data: {
        email: 'aprovador@prefeitura.gov.br',
        name: 'Roberto Aprovador',
        password: hashedPassword,
        role: 'APROVADOR',
        registration: 'APR001',
        departmentId: deptTI.id,
        phone: '(11) 99999-5555',
        position: 'Coordenador de TI',
        room: '303'
      }
    }),

    // Gestor
    prisma.user.create({
      data: {
        email: 'gestor@prefeitura.gov.br',
        name: 'Sandra Gestora',
        password: hashedPassword,
        role: 'GESTOR',
        registration: 'GES001',
        departmentId: deptGabinete.id,
        phone: '(11) 99999-6666',
        position: 'Secretária Municipal',
        room: '401'
      }
    }),

    // Admin
    prisma.user.create({
      data: {
        email: 'admin@prefeitura.gov.br',
        name: 'João Admin',
        password: hashedPassword,
        role: 'ADMIN',
        registration: 'ADM001',
        departmentId: deptTI.id,
        phone: '(11) 99999-7777',
        position: 'Administrador do Sistema',
        room: '304'
      }
    })
  ])

  const [funcionario1, funcionario2, tecnico1, tecnico2, aprovador, gestor, admin] = users

  // Criar fornecedores
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: 'TechSupply Informática Ltda',
        cnpj: '12.345.678/0001-90',
        email: 'vendas@techsupply.com.br',
        phone: '(11) 4444-1111',
        address: 'Rua da Tecnologia, 123 - São Paulo/SP',
        contact: 'Fernando Sales',
        categories: JSON.stringify(['Hardware', 'Periféricos', 'Cabos'])
      }
    }),
    prisma.supplier.create({
      data: {
        name: 'InfoParts Distribuidora',
        cnpj: '98.765.432/0001-10',
        email: 'orcamento@infoparts.com.br',
        phone: '(11) 4444-2222',
        address: 'Av. das Peças, 456 - São Paulo/SP',
        contact: 'Luciana Vendas',
        categories: JSON.stringify(['Hardware', 'Redes', 'Servidores'])
      }
    }),
    prisma.supplier.create({
      data: {
        name: 'RapidFix Eletrônicos',
        cnpj: '11.222.333/0001-44',
        email: 'contato@rapidfix.com.br',
        phone: '(11) 4444-3333',
        address: 'Rua dos Reparos, 789 - São Paulo/SP',
        contact: 'Roberto Técnico',
        categories: JSON.stringify(['Reparos', 'Manutenção', 'Peças'])
      }
    })
  ])

  const [supplier1, supplier2, supplier3] = suppliers

  // Gerar números sequenciais para as OSs
  let osNumber = 1

  // Criar ordens de serviço com diferentes status para demonstrar o workflow
  const serviceOrders = await Promise.all([
    // OS 1: EM_ANALISE - Técnico pode escolher necessitar material ou executar
    prisma.serviceOrder.create({
      data: {
        number: `OS${String(osNumber++).padStart(6, '0')}`,
        title: 'Computador não liga na Secretaria de Educação',
        description: 'Computador do setor administrativo não está ligando. Usuário relatou que ontem funcionou normalmente, mas hoje pela manhã não conseguiu ligar.',
        status: 'EM_ANALISE',
        priority: 'ALTA',
        category: 'HARDWARE',
        createdById: funcionario1.id,
        assignedToId: tecnico1.id,
        diagnosis: 'Analisando possível problema na fonte de alimentação ou placa-mãe. Necessário verificar se é problema de hardware que requer substituição de peças.',
        assignedAt: new Date(),
        startedAt: new Date()
      }
    }),

    // OS 2: AGUARDANDO_MATERIAL - Técnico identificou necessidade de material
    prisma.serviceOrder.create({
      data: {
        number: `OS${String(osNumber++).padStart(6, '0')}`,
        title: 'Impressora HP LaserJet com defeito na Saúde',
        description: 'Impressora apresentando erro de papel constantemente, mesmo com bandeja vazia. Já foi tentado limpeza básica conforme manual.',
        status: 'AGUARDANDO_MATERIAL',
        priority: 'NORMAL',
        category: 'IMPRESSORA',
        createdById: funcionario2.id,
        assignedToId: tecnico2.id,
        diagnosis: 'Problema identificado no sensor de papel e rolete de alimentação. Ambas as peças precisam ser substituídas.',
        solution: 'Será necessário substituir o sensor de papel (Part# CB506-67901) e o kit de rolete de alimentação (Part# CB506-67904).',
        materialDescription: 'Sensor de papel HP LaserJet P3015 (Part# CB506-67901) - 1 unidade\nKit rolete alimentação HP LaserJet P3015 (Part# CB506-67904) - 1 unidade',
        materialJustification: 'Peças essenciais para funcionamento da impressora. Sem elas, a impressora não consegue puxar papel corretamente, impossibilitando a impressão de documentos importantes do centro de saúde.',
        requiresMaterial: true,
        assignedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 dia atrás
        startedAt: new Date(Date.now() - 20 * 60 * 60 * 1000) // 20 horas atrás
      }
    }),

    // OS 3: AGUARDANDO_ORCAMENTO - Gestor pode solicitar orçamentos
    prisma.serviceOrder.create({
      data: {
        number: `OS${String(osNumber++).padStart(6, '0')}`,
        title: 'Switch de rede queimado no Departamento de TI',
        description: 'Switch principal de 24 portas queimou durante temporal. Sem conectividade de rede em todo o departamento.',
        status: 'ORCAMENTOS_RECEBIDOS',
        priority: 'URGENTE',
        category: 'REDE',
        createdById: tecnico1.id,
        assignedToId: tecnico2.id,
        diagnosis: 'Switch HP ProCurve 2524 completamente queimado. Provável sobretensão durante temporal. Substituição necessária.',
        solution: 'Substituição completa do switch por modelo equivalente ou superior.',
        materialDescription: 'Switch gerenciável 24 portas 10/100/1000 Mbps\nModelo similar: HP ProCurve 2530-24G ou equivalente\nIncluir cabo de força e manual\nSuporte a VLAN e gerenciamento via web',
        materialJustification: 'Equipamento crítico para conectividade de rede do departamento de TI. Sem ele, não há acesso à internet nem à rede interna, prejudicando gravemente as atividades administrativas e de suporte.',
        requiresMaterial: true,
        assignedAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 dias atrás
        startedAt: new Date(Date.now() - 44 * 60 * 60 * 1000) // 44 horas atrás
      }
    }),

    // OS 4: AGUARDANDO_APROVACAO - Aprovador pode enviar para aprovação
    prisma.serviceOrder.create({
      data: {
        number: `OS${String(osNumber++).padStart(6, '0')}`,
        title: 'Servidor de backup com HD danificado',
        description: 'Servidor de backup apresentando erros de disco. Sistema de backup está comprometido.',
        status: 'AGUARDANDO_APROVACAO',
        priority: 'ALTA',
        category: 'HARDWARE',
        createdById: admin.id,
        assignedToId: tecnico1.id,
        diagnosis: 'HD de 2TB do servidor de backup apresentando bad sectors. RAID degradado.',
        solution: 'Substituição do HD defeituoso por modelo equivalente.',
        materialDescription: 'HD Enterprise 2TB SATA 7200rpm 3.5"\nModelo: Seagate Constellation ES.3 ST2000NM0033 ou equivalente\nGarantia mínima: 3 anos\nCompatível com servidor Dell PowerEdge T320',
        materialJustification: 'HD crítico para manutenção dos backups da prefeitura. Sem funcionamento adequado, há risco de perda de dados importantes em caso de falha do sistema principal.',
        requiresMaterial: true,
        assignedAt: new Date(Date.now() - 72 * 60 * 60 * 1000), // 3 dias atrás
        startedAt: new Date(Date.now() - 68 * 60 * 60 * 1000) // 68 horas atrás
      }
    }),

    // OS 5: MATERIAL_APROVADO - Técnico pode executar com material aprovado
    prisma.serviceOrder.create({
      data: {
        number: `OS${String(osNumber++).padStart(6, '0')}`,
        title: 'Monitor LCD com defeito na tela',
        description: 'Monitor de 22 polegadas com linhas verticais na tela. Problema surgiu após queda de energia.',
        status: 'MATERIAL_APROVADO',
        priority: 'NORMAL',
        category: 'HARDWARE',
        createdById: funcionario1.id,
        assignedToId: tecnico2.id,
        diagnosis: 'Panel LCD danificado. Necessária substituição completa do monitor.',
        solution: 'Substituição por monitor novo de especificação similar ou superior.',
        materialDescription: 'Monitor LCD 22" Full HD 1920x1080\nEntradas: VGA e DVI-D\nTempo de resposta: máximo 5ms\nMarca: Dell, HP ou LG',
        materialJustification: 'Monitor essencial para trabalho administrativo da secretaria. Estação sem monitor prejudica produtividade do setor.',
        requiresMaterial: true,
        assignedAt: new Date(Date.now() - 96 * 60 * 60 * 1000), // 4 dias atrás
        startedAt: new Date(Date.now() - 92 * 60 * 60 * 1000) // 92 horas atrás
      }
    }),

    // OS 6: EM_EXECUCAO - Técnico pode finalizar
    prisma.serviceOrder.create({
      data: {
        number: `OS${String(osNumber++).padStart(6, '0')}`,
        title: 'Configuração de nova impressora multifuncional',
        description: 'Instalar e configurar nova impressora multifuncional HP LaserJet MFP M428fdw no setor financeiro.',
        status: 'EM_EXECUCAO',
        priority: 'NORMAL',
        category: 'IMPRESSORA',
        createdById: funcionario2.id,
        assignedToId: tecnico1.id,
        diagnosis: 'Instalação de equipamento novo conforme solicitado.',
        solution: 'Configuração completa: instalação de drivers, configuração de rede, teste de impressão, digitalização e fax.',
        observations: 'Impressora já instalada fisicamente. Faltam apenas configurações finais de rede e teste completo das funcionalidades.',
        assignedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 horas atrás
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 horas atrás
      }
    }),

    // OS 7: FINALIZADA - Para referência
    prisma.serviceOrder.create({
      data: {
        number: `OS${String(osNumber++).padStart(6, '0')}`,
        title: 'Instalação de antivírus em computadores',
        description: 'Instalar e configurar antivírus corporativo em 5 computadores da secretaria.',
        status: 'FINALIZADA',
        priority: 'BAIXA',
        category: 'SOFTWARE',
        createdById: gestor.id,
        assignedToId: tecnico2.id,
        diagnosis: 'Instalação padrão de software de segurança.',
        solution: 'Instalação do Kaspersky Endpoint Security em todos os computadores, configuração de políticas de segurança e agendamento de atualizações automáticas.',
        observations: 'Instalação concluída com sucesso. Todos os computadores estão protegidos e atualizados.',
        assignedAt: new Date(Date.now() - 168 * 60 * 60 * 1000), // 7 dias atrás
        startedAt: new Date(Date.now() - 164 * 60 * 60 * 1000), // 164 horas atrás
        completedAt: new Date(Date.now() - 144 * 60 * 60 * 1000) // 6 dias atrás
      }
    }),

    // OS 8: ABERTA - Para demonstrar início do fluxo
    prisma.serviceOrder.create({
      data: {
        number: `OS${String(osNumber++).padStart(6, '0')}`,
        title: 'Problema de lentidão na rede Wi-Fi',
        description: 'Rede Wi-Fi da secretaria está muito lenta. Usuários relatam dificuldade para acessar sistemas e internet.',
        status: 'ABERTA',
        priority: 'NORMAL',
        category: 'REDE',
        createdById: funcionario2.id
      }
    })
  ])

  // Criar alguns orçamentos para demonstrar o processo
  const quotes = await Promise.all([
    // Orçamentos para a OS 3 (Switch de rede)
    prisma.quote.create({
      data: {
        serviceOrderId: serviceOrders[2].id, // OS 3
        supplierId: supplier1.id,
        requestedById: gestor.id,
        totalValue: 2850.00,
        deliveryTime: 5,
        validity: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 dias
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
            description: 'Manual e CD de instalação',
            quantity: 1,
            unitPrice: 0.00,
            totalPrice: 0.00
          },
          {
            description: 'Garantia estendida 3 anos',
            quantity: 1,
            unitPrice: 175.00,
            totalPrice: 175.00
          }
        ]
      }
    }),
    prisma.quote.create({
      data: {
        serviceOrderId: serviceOrders[2].id, // OS 3
        supplierId: supplier2.id,
        requestedById: gestor.id,
        totalValue: 3100.00,
        deliveryTime: 3,
        validity: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 dias
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
  ])

  // Criar logs de auditoria para demonstrar histórico
  await Promise.all([
    prisma.auditLog.create({
      data: {
        serviceOrderId: serviceOrders[1].id, // OS 2
        userId: tecnico2.id,
        action: 'STATUS_CHANGED',
        details: { from: 'EM_ANALISE', to: 'AGUARDANDO_MATERIAL', reason: 'Identificada necessidade de peças para reparo' },
        createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000)
      }
    }),
    prisma.auditLog.create({
      data: {
        serviceOrderId: serviceOrders[2].id, // OS 3
        userId: gestor.id,
        action: 'STATUS_CHANGED',
        details: { from: 'AGUARDANDO_MATERIAL', to: 'AGUARDANDO_ORCAMENTO', reason: 'Solicitação de orçamentos enviada para fornecedores' },
        createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000)
      }
    }),
    prisma.auditLog.create({
      data: {
        serviceOrderId: serviceOrders[6].id, // OS 7
        userId: tecnico2.id,
        action: 'STATUS_CHANGED',
        details: { from: 'EM_EXECUCAO', to: 'FINALIZADA', reason: 'Instalação de antivírus concluída com sucesso' },
        createdAt: new Date(Date.now() - 144 * 60 * 60 * 1000)
      }
    })
  ])

  console.log('🌱 Banco de dados populado com sucesso!')
  console.log(`📊 Criados:`)
  console.log(`   • ${departments.length} departamentos`)
  console.log(`   • ${users.length} usuários`)
  console.log(`   • ${suppliers.length} fornecedores`)
  console.log(`   • ${serviceOrders.length} ordens de serviço`)
  console.log(`   • ${quotes.length} orçamentos`)
  console.log('')
  console.log('👥 Usuários criados:')
  console.log('   • funcionario@prefeitura.gov.br (FUNCIONARIO) - senha: 123456')
  console.log('   • tecnico@prefeitura.gov.br (TECNICO) - senha: 123456')
  console.log('   • aprovador@prefeitura.gov.br (APROVADOR) - senha: 123456')
  console.log('   • gestor@prefeitura.gov.br (GESTOR) - senha: 123456')
  console.log('   • admin@prefeitura.gov.br (ADMIN) - senha: 123456')
  console.log('')
  console.log('📋 Workflow demonstrado:')
  console.log('   • OS001: EM_ANALISE - Técnico pode escolher solicitar material ou executar')
  console.log('   • OS002: AGUARDANDO_MATERIAL - Gestor pode solicitar orçamento')
  console.log('   • OS003: AGUARDANDO_ORCAMENTO - Aprovador pode enviar para aprovação')
  console.log('   • OS004: AGUARDANDO_APROVACAO - Gestor pode aprovar material')
  console.log('   • OS005: MATERIAL_APROVADO - Técnico pode executar')
  console.log('   • OS006: EM_EXECUCAO - Técnico pode finalizar')
  console.log('   • OS007: FINALIZADA - Processo completo')
  console.log('   • OS008: ABERTA - Aguardando técnico iniciar análise')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
