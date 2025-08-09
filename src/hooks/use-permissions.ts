import { UserRole } from "@prisma/client"

export interface UserPermissions {
  canViewAllOrders: boolean
  canCreateOrders: boolean
  canEditOrders: boolean
  canDeleteOrders: boolean
  canManageUsers: boolean
  canManageDepartments: boolean
  canApproveQuotes: boolean
  canViewReports: boolean
  canManageSuppliers: boolean
}

export function getUserPermissions(role: UserRole): UserPermissions {
  switch (role) {
    case UserRole.ADMIN:
      return {
        canViewAllOrders: true,
        canCreateOrders: true,
        canEditOrders: true,
        canDeleteOrders: true,
        canManageUsers: true,
        canManageDepartments: true,
        canApproveQuotes: true,
        canViewReports: true,
        canManageSuppliers: true,
      }

    case UserRole.GESTOR:
      return {
        canViewAllOrders: true,
        canCreateOrders: true,
        canEditOrders: true,
        canDeleteOrders: false,
        canManageUsers: false,
        canManageDepartments: false,
        canApproveQuotes: true,
        canViewReports: true,
        canManageSuppliers: false,
      }

    case UserRole.TECNICO:
      return {
        canViewAllOrders: true,
        canCreateOrders: true,
        canEditOrders: true,
        canDeleteOrders: false,
        canManageUsers: false,
        canManageDepartments: false,
        canApproveQuotes: false,
        canViewReports: false,
        canManageSuppliers: false,
      }

    case UserRole.APROVADOR:
      return {
        canViewAllOrders: true,
        canCreateOrders: false,
        canEditOrders: false,
        canDeleteOrders: false,
        canManageUsers: false,
        canManageDepartments: false,
        canApproveQuotes: true,
        canViewReports: true,
        canManageSuppliers: false,
      }

    case UserRole.FUNCIONARIO:
      return {
        canViewAllOrders: false, // Apenas suas próprias OS
        canCreateOrders: true,
        canEditOrders: false,
        canDeleteOrders: false,
        canManageUsers: false,
        canManageDepartments: false,
        canApproveQuotes: false,
        canViewReports: false,
        canManageSuppliers: false,
      }

    default:
      return {
        canViewAllOrders: false,
        canCreateOrders: false,
        canEditOrders: false,
        canDeleteOrders: false,
        canManageUsers: false,
        canManageDepartments: false,
        canApproveQuotes: false,
        canViewReports: false,
        canManageSuppliers: false,
      }
  }
}

export function usePermissions(role: UserRole) {
  return getUserPermissions(role)
}
