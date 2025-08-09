import { 
  UserRole, 
  ServiceOrderStatus, 
  Priority, 
  ProblemCategory, 
  QuoteStatus,
  AttachmentType
} from '@prisma/client'

// Tipos para o sistema de OS
export interface ServiceOrderCreate {
  title: string
  description: string
  category: ProblemCategory
  priority: Priority
  specificLocation?: string
  attachments?: File[]
}

export interface ServiceOrderUpdate {
  title?: string
  description?: string
  category?: ProblemCategory
  priority?: Priority
  specificLocation?: string
  status?: ServiceOrderStatus
  assignedToId?: string
  diagnosis?: string
  solution?: string
  observations?: string
  requiresMaterial?: boolean
  estimatedHours?: number
  actualHours?: number
}

export interface UserCreate {
  email: string
  name: string
  password: string
  role: UserRole
  registration?: string
  departmentId: string
  phone?: string
  position?: string
  room?: string
}

export interface DepartmentCreate {
  name: string
  description?: string
  location: string
  building?: string
  floor?: string
  responsible?: string
  phone?: string
  email?: string
}

export interface SupplierCreate {
  name: string
  cnpj: string
  email: string
  phone: string
  address?: string
  contact: string
  categories: string[]
}

export interface QuoteCreate {
  serviceOrderId: string
  supplierId: string
  items: QuoteItem[]
  totalValue: number
  deliveryTime?: number
  validity?: Date
  observations?: string
}

export interface QuoteItem {
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface AttachmentCreate {
  serviceOrderId: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  path: string
  type: AttachmentType
  description?: string
}

// Tipos para formulários
export interface LoginForm {
  email: string
  password: string
}

export interface ServiceOrderForm extends ServiceOrderCreate {}

export interface UserForm extends Omit<UserCreate, 'password'> {
  password?: string
  confirmPassword?: string
}

export interface DepartmentForm extends DepartmentCreate {}

// Tipos para Status Badge
export const statusColors: Record<ServiceOrderStatus, string> = {
  ABERTA: 'default',
  EM_ANALISE: 'info',
  AGUARDANDO_DESLOCAMENTO: 'warning',
  EM_EXECUCAO: 'info',
  AGUARDANDO_MATERIAL: 'warning',
  AGUARDANDO_ORCAMENTO: 'warning',
  AGUARDANDO_APROVACAO: 'warning',
  MATERIAL_APROVADO: 'success',
  FINALIZADA: 'success',
  CANCELADA: 'destructive',
}

export const statusLabels: Record<ServiceOrderStatus, string> = {
  ABERTA: 'Aberta',
  EM_ANALISE: 'Em Análise',
  AGUARDANDO_DESLOCAMENTO: 'Aguardando Deslocamento',
  EM_EXECUCAO: 'Em Execução',
  AGUARDANDO_MATERIAL: 'Aguardando Material',
  AGUARDANDO_ORCAMENTO: 'Aguardando Orçamento',
  AGUARDANDO_APROVACAO: 'Aguardando Aprovação',
  MATERIAL_APROVADO: 'Material Aprovado',
  FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada',
}

export const priorityColors: Record<Priority, string> = {
  BAIXA: 'default',
  NORMAL: 'info',
  ALTA: 'warning',
  URGENTE: 'destructive',
}

export const priorityLabels: Record<Priority, string> = {
  BAIXA: 'Baixa',
  NORMAL: 'Normal',
  ALTA: 'Alta',
  URGENTE: 'Urgente',
}

export const categoryLabels: Record<ProblemCategory, string> = {
  HARDWARE: 'Hardware',
  SOFTWARE: 'Software',
  REDE: 'Rede',
  IMPRESSORA: 'Impressora',
  TELEFONIA: 'Telefonia',
  SISTEMA: 'Sistema',
  OUTROS: 'Outros',
}

export const roleLabels: Record<UserRole, string> = {
  FUNCIONARIO: 'Funcionário',
  TECNICO: 'Técnico',
  APROVADOR: 'Aprovador',
  GESTOR: 'Gestor',
  ADMIN: 'Administrador',
}
