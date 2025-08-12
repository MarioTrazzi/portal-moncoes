import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        contact: true,
        email: true,
        phone: true,
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

    return NextResponse.json(suppliersWithCategories)
  } catch (error) {
    console.error("Erro ao buscar fornecedores:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
