// Serviço de email para envio de notificações
// Em produção, integrar com serviços como SendGrid, AWS SES, etc.

interface EmailOptions {
  to: string
  subject: string
  html: string
  cc?: string[]
  bcc?: string[]
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Por enquanto, apenas log do email (em produção, usar serviço real)
    console.log('📧 Email enviado:', {
      to: options.to,
      subject: options.subject,
      timestamp: new Date().toISOString()
    })

    // Simular envio bem-sucedido
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return true
  } catch (error) {
    console.error('Erro ao enviar email:', error)
    return false
  }
}

// Função para validar email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Templates de email pré-definidos
export const emailTemplates = {
  newServiceOrder: (orderNumber: string, title: string) => `
    <h2>Nova Ordem de Serviço</h2>
    <p>Foi criada uma nova OS: <strong>${orderNumber}</strong></p>
    <p>Título: ${title}</p>
  `,
  
  materialApproved: (orderNumber: string, totalValue: number) => `
    <h2>Material Aprovado</h2>
    <p>Material da OS <strong>${orderNumber}</strong> foi aprovado</p>
    <p>Valor: R$ ${totalValue.toFixed(2)}</p>
  `,
  
  quoteReceived: (orderNumber: string, supplierName: string) => `
    <h2>Orçamento Recebido</h2>
    <p>Orçamento recebido de <strong>${supplierName}</strong></p>
    <p>Para a OS: <strong>${orderNumber}</strong></p>
  `
}
