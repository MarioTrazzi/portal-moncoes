import { PrismaClient, UserRole, Priority, ProblemCategory, ServiceOrderStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Limpar dados existentes
  await prisma.auditLog.deleteMany()
  await prisma.attachment.deleteMany()
  await prisma.quote.deleteMany()
  await prisma.serviceOrder.deleteMany()
  await prisma.user.deleteMany()
  await prisma.department.deleteMany()
  await prisma.supplier.deleteMany()

  console.log('🏢 Criando departamentos...')
  
  // Criar departamentos
  const departments = await Promise.all([
    prisma.department.create({
      data: {
        name: 'Secretaria de Educação',
        description: 'Responsável pela gestão educacional do município',
        location: 'Prédio Principal',
        building: 'Bloco A',
        floor: '2º Andar',
        responsible: 'Maria Silva',
        phone: '(11) 3333-1001',
        email: 'educacao@prefeitura.gov.br'
      }
    }),
    prisma.department.create({
      data: {
        name: 'Secretaria de Saúde',
        description: 'Gestão da saúde pública municipal',
        location: 'Centro de Saúde',
        building: 'Prédio da Saúde',
        floor: '1º Andar',
        responsible: 'João Santos',
        phone: '(11) 3333-1002',
        email: 'saude@prefeitura.gov.br'
      }
    }),
    prisma.department.create({
      data: {
        name: 'Departamento de TI',
        description: 'Suporte técnico e infraestrutura de TI',
        location: 'Prédio Principal',
        building: 'Bloco B',
        floor: 'Subsolo',
        responsible: 'Carlos Tech',
        phone: '(11) 3333-1003',
        email: 'ti@prefeitura.gov.br'
      }
    }),
    prisma.department.create({
      data: {
        name: 'Recursos Humanos',
        description: 'Gestão de pessoal e recursos humanos',
        location: 'Prédio Principal',
        building: 'Bloco A',
        floor: '1º Andar',
        responsible: 'Ana Costa',
        phone: '(11) 3333-1004',
        email: 'rh@prefeitura.gov.br'
      }
    }),
    prisma.department.create({
      data: {
        name: 'Secretaria de Obras',
        description: 'Planejamento e execução de obras públicas',
        location: 'Galpão de Obras',
        building: 'Anexo',
        floor: 'Térreo',
        responsible: 'Roberto Construtor',
        phone: '(11) 3333-1005',
        email: 'obras@prefeitura.gov.br'
      }
    }),
    prisma.department.create({
      data: {
        name: 'Gabinete do Prefeito',
        description: 'Gabinete executivo municipal',
        location: 'Prédio Principal',
        building: 'Bloco A',
        floor: '3º Andar',
        responsible: 'Secretária Executiva',
        phone: '(11) 3333-1000',
        email: 'gabinete@prefeitura.gov.br'
      }
    })
  ])

  console.log('👥 Criando usuários...')
  
  // Criar usuários
  const hashedPassword = await bcrypt.hash('123456', 10)
  
  const users = await Promise.all([
    // Admin
    prisma.user.create({
      data: {
        email: 'admin@prefeitura.gov.br',
        name: 'Administrador do Sistema',
        password: hashedPassword,
        role: UserRole.ADMIN,
        registration: 'ADM001',
        position: 'Administrador de TI',
        departmentId: departments[2].id, // TI
        room: 'Sala de Servidores'
      }
    }),
    
    // Funcionários
    prisma.user.create({
      data: {
        email: 'maria.educacao@prefeitura.gov.br',
        name: 'Maria Silva',
        password: hashedPassword,
        role: UserRole.FUNCIONARIO,
        registration: 'EDU001',
        position: 'Coordenadora Pedagógica',
        departmentId: departments[0].id, // Educação
        room: 'Sala 201',
        phone: '(11) 99999-0001'
      }
    }),
    
    prisma.user.create({
      data: {
        email: 'joao.saude@prefeitura.gov.br',
        name: 'João Santos',
        password: hashedPassword,
        role: UserRole.FUNCIONARIO,
        registration: 'SAU001',
        position: 'Enfermeiro Chefe',
        departmentId: departments[1].id, // Saúde
        room: 'Sala de Enfermagem',
        phone: '(11) 99999-0002'
      }
    }),
    
    prisma.user.create({
      data: {
        email: 'ana.rh@prefeitura.gov.br',
        name: 'Ana Costa',
        password: hashedPassword,
        role: UserRole.APROVADOR,
        registration: 'RH001',
        position: 'Gerente de RH',
        departmentId: departments[3].id, // RH
        room: 'Sala 101',
        phone: '(11) 99999-0003'
      }
    }),
    
    // Técnicos
    prisma.user.create({
      data: {
        email: 'carlos.tech@prefeitura.gov.br',
        name: 'Carlos Tech',
        password: hashedPassword,
        role: UserRole.TECNICO,
        registration: 'TI001',
        position: 'Técnico de TI Sênior',
        departmentId: departments[2].id, // TI
        room: 'Lab de Manutenção',
        phone: '(11) 99999-0004'
      }
    }),
    
    prisma.user.create({
      data: {
        email: 'pedro.tech@prefeitura.gov.br',
        name: 'Pedro Suporte',
        password: hashedPassword,
        role: UserRole.TECNICO,
        registration: 'TI002',
        position: 'Técnico de TI Júnior',
        departmentId: departments[2].id, // TI
        room: 'Lab de Manutenção',
        phone: '(11) 99999-0005'
      }
    }),
    
    // Gestor
    prisma.user.create({
      data: {
        email: 'gestor@prefeitura.gov.br',
        name: 'Diretor Geral',
        password: hashedPassword,
        role: UserRole.GESTOR,
        registration: 'GAB001',
        position: 'Diretor Executivo',
        departmentId: departments[5].id, // Gabinete
        room: 'Sala da Diretoria',
        phone: '(11) 99999-0006'
      }
    })
  ])

  console.log('🏪 Criando fornecedores...')
  
  // Criar fornecedores
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: 'TechSolutions Ltda',
        cnpj: '12.345.678/0001-90',
        email: 'vendas@techsolutions.com.br',
        phone: '(11) 4000-1000',
        address: 'Rua da Tecnologia, 123 - São Paulo/SP',
        contact: 'Roberto Vendas',
        categories: JSON.stringify(['HARDWARE', 'SOFTWARE'])
      }
    }),
    
    prisma.supplier.create({
      data: {
        name: 'InfoMateriais S/A',
        cnpj: '23.456.789/0001-01',
        email: 'contato@infomateriais.com.br',
        phone: '(11) 4000-2000',
        address: 'Av. dos Computadores, 456 - São Paulo/SP',
        contact: 'Sandra Comercial',
        categories: JSON.stringify(['HARDWARE', 'REDE'])
      }
    }),
    
    prisma.supplier.create({
      data: {
        name: 'PrintMax Suprimentos',
        cnpj: '34.567.890/0001-12',
        email: 'vendas@printmax.com.br',
        phone: '(11) 4000-3000',
        address: 'Rua das Impressoras, 789 - São Paulo/SP',
        contact: 'Carlos Impressão',
        categories: JSON.stringify(['IMPRESSORA'])
      }
    })
  ])

  console.log('📋 Criando ordens de serviço de exemplo...')
  
  // Criar algumas OS de exemplo
  const serviceOrders = await Promise.all([
    prisma.serviceOrder.create({
      data: {
        number: 'OS-2025-001',
        title: 'Impressora não funciona',
        description: 'A impressora da sala 201 não está imprimindo. Aparece erro de papel atolado, mas não há papel atolado visível.',
        category: ProblemCategory.IMPRESSORA,
        priority: Priority.NORMAL,
        status: ServiceOrderStatus.ABERTA,
        createdById: users[1].id, // Maria
      }
    }),
    
    prisma.serviceOrder.create({
      data: {
        number: 'OS-2025-002',
        title: 'Computador muito lento',
        description: 'O computador da enfermagem está extremamente lento. Demora mais de 5 minutos para abrir qualquer programa.',
        category: ProblemCategory.HARDWARE,
        priority: Priority.ALTA,
        status: ServiceOrderStatus.EM_ANALISE,
        createdById: users[2].id, // João
        assignedToId: users[4].id, // Carlos Tech
        assignedAt: new Date()
      }
    }),
    
    prisma.serviceOrder.create({
      data: {
        number: 'OS-2025-003',
        title: 'Sistema de folha não acessa',
        description: 'Não conseguimos acessar o sistema de folha de pagamento. Aparece erro de conexão.',
        category: ProblemCategory.SISTEMA,
        priority: Priority.URGENTE,
        status: ServiceOrderStatus.EM_EXECUCAO,
        createdById: users[3].id, // Ana
        assignedToId: users[4].id, // Carlos Tech
        assignedAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hora atrás
        startedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrás
      }
    })
  ])

  console.log('✅ Seed concluído!')
  console.log('📊 Dados criados:')
  console.log(`   • ${departments.length} departamentos`)
  console.log(`   • ${users.length} usuários`)
  console.log(`   • ${suppliers.length} fornecedores`)
  console.log(`   • ${serviceOrders.length} ordens de serviço`)
  console.log('\n👥 Usuários de teste:')
  console.log('   • admin@prefeitura.gov.br (senha: 123456) - ADMIN')
  console.log('   • maria.educacao@prefeitura.gov.br (senha: 123456) - FUNCIONARIO')
  console.log('   • joao.saude@prefeitura.gov.br (senha: 123456) - FUNCIONARIO')
  console.log('   • ana.rh@prefeitura.gov.br (senha: 123456) - APROVADOR')
  console.log('   • carlos.tech@prefeitura.gov.br (senha: 123456) - TECNICO')
  console.log('   • pedro.tech@prefeitura.gov.br (senha: 123456) - TECNICO')
  console.log('   • gestor@prefeitura.gov.br (senha: 123456) - GESTOR')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
