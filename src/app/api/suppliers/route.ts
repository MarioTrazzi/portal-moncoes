import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await verifyAuth(request)
    if (authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      )
    }

    const suppliers = await prisma.supplier.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        cnpj: true,
        contact: true,
        email: true,
        phone: true,
        address: true,
        categories: true,
      },
      orderBy: { name: 'asc' }
    })

    // Parse das categorias JSON
    const suppliersWithCategories = suppliers.map(supplier => ({
      ...supplier,
      categories: typeof supplier.categories === 'string' 
        ? JSON.parse(supplier.categories) 
        : supplier.categories
    }))

    return NextResponse.json({
      success: true,
      data: suppliersWithCategories
    })
  } catch (error) {
    console.error("Erro ao buscar fornecedores:", error)
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
