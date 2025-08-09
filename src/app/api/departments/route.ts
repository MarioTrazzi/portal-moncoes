import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createDepartmentSchema } from '@/lib/validations'

// GET - Listar departamentos
export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ data: departments })
  } catch (error) {
    console.error('Erro ao buscar departamentos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar departamento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar dados
    const validatedData = createDepartmentSchema.parse(body)

    // Verificar se já existe um departamento com o mesmo nome
    const existingDepartment = await prisma.department.findUnique({
      where: { name: validatedData.name }
    })

    if (existingDepartment) {
      return NextResponse.json(
        { error: 'Já existe um departamento com este nome' },
        { status: 400 }
      )
    }

    // Criar o departamento
    const department = await prisma.department.create({
      data: validatedData,
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    })

    return NextResponse.json(department, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar departamento:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
