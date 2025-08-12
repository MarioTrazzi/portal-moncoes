import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'seu-jwt-secret-aqui'

export interface JWTPayload {
  userId: string
  email: string
  role: string
}

export async function verifyAuth(request: NextRequest) {
  try {
    // Pegar token do header Authorization ou do cookie
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth-token')?.value

    if (!token) {
      return { error: 'Token não fornecido', status: 401 }
    }

    // Verificar token
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload

    // Buscar usuário atual no banco
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { department: true }
    })

    if (!user || !user.active) {
      return { error: 'Usuário não encontrado ou inativo', status: 401 }
    }

    return { user, error: null }
  } catch (error) {
    return { error: 'Token inválido', status: 401 }
  }
}
