import { NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const notificationId = id
    
    // Em um sistema real, aqui você excluiria do banco de dados
    console.log(`Excluindo notificação ${notificationId}`)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir notificação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
