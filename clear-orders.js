const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function clearOrders() {
  try {
    console.log('🧹 Limpando ordens de serviço...')
    
    // Limpar em ordem devido às dependências
    await prisma.auditLog.deleteMany({
      where: {
        serviceOrderId: { not: null }
      }
    })
    console.log('✅ Logs de auditoria removidos')
    
    await prisma.attachment.deleteMany()
    console.log('✅ Anexos removidos')
    
    await prisma.quote.deleteMany()
    console.log('✅ Orçamentos removidos')
    
    await prisma.purchaseOrder.deleteMany()
    console.log('✅ Ordens de compra removidas')
    
    await prisma.serviceOrder.deleteMany()
    console.log('✅ Ordens de serviço removidas')
    
    console.log('🎉 Limpeza concluída! Usuários e departamentos mantidos.')
    console.log('Agora você pode testar a criação de OS do zero.')
    
  } catch (error) {
    console.error('❌ Erro ao limpar:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearOrders()
