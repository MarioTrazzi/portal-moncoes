import { z } from "zod"
import { ProblemCategory, Priority } from "@prisma/client"

// Schema para criar uma nova OS
export const createServiceOrderSchema = z.object({
  title: z
    .string()
    .min(1, "Título é obrigatório")
    .min(5, "Título deve ter pelo menos 5 caracteres")
    .max(100, "Título deve ter no máximo 100 caracteres"),
  
  description: z
    .string()
    .min(1, "Descrição é obrigatória")
    .min(10, "Descrição deve ter pelo menos 10 caracteres")
    .max(1000, "Descrição deve ter no máximo 1000 caracteres"),
  
  category: z.nativeEnum(ProblemCategory, {
    message: "Categoria é obrigatória",
  }),
  
  priority: z.nativeEnum(Priority, {
    message: "Prioridade é obrigatória",
  }),
  
  // Campos opcionais para localização específica (além do setor do usuário)
  specificLocation: z
    .string()
    .max(200, "Localização específica deve ter no máximo 200 caracteres")
    .optional(),
  
  // Arrays de arquivos para upload
  images: z
    .array(z.instanceof(File))
    .max(5, "Máximo de 5 imagens")
    .optional(),
    
  documents: z
    .array(z.instanceof(File))
    .max(3, "Máximo de 3 documentos")
    .optional(),
})

export type CreateServiceOrderForm = z.infer<typeof createServiceOrderSchema>

// Schema para login
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email é obrigatório")
    .email("Email inválido"),
  
  password: z
    .string()
    .min(1, "Senha é obrigatória")
    .min(6, "Senha deve ter pelo menos 6 caracteres"),
})

export type LoginForm = z.infer<typeof loginSchema>

// Schema para criar usuário
export const createUserSchema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório")
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  
  email: z
    .string()
    .min(1, "Email é obrigatório")
    .email("Email inválido"),
  
  password: z
    .string()
    .min(1, "Senha é obrigatória")
    .min(6, "Senha deve ter pelo menos 6 caracteres"),
  
  confirmPassword: z
    .string()
    .min(1, "Confirmação de senha é obrigatória"),
  
  registration: z
    .string()
    .max(20, "Matrícula deve ter no máximo 20 caracteres")
    .optional(),
  
  departmentId: z
    .string()
    .min(1, "Departamento é obrigatório"),
  
  phone: z
    .string()
    .max(20, "Telefone deve ter no máximo 20 caracteres")
    .optional(),
  
  position: z
    .string()
    .max(100, "Cargo deve ter no máximo 100 caracteres")
    .optional(),
  
  room: z
    .string()
    .max(50, "Sala deve ter no máximo 50 caracteres")
    .optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
})

export type CreateUserForm = z.infer<typeof createUserSchema>

// Schema para criar departamento
export const createDepartmentSchema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório")
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  
  description: z
    .string()
    .max(200, "Descrição deve ter no máximo 200 caracteres")
    .optional(),
  
  location: z
    .string()
    .min(1, "Localização é obrigatória")
    .max(100, "Localização deve ter no máximo 100 caracteres"),
  
  building: z
    .string()
    .max(50, "Prédio deve ter no máximo 50 caracteres")
    .optional(),
  
  floor: z
    .string()
    .max(20, "Andar deve ter no máximo 20 caracteres")
    .optional(),
  
  responsible: z
    .string()
    .max(100, "Responsável deve ter no máximo 100 caracteres")
    .optional(),
  
  phone: z
    .string()
    .max(20, "Telefone deve ter no máximo 20 caracteres")
    .optional(),
  
  email: z
    .string()
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
})

export type CreateDepartmentForm = z.infer<typeof createDepartmentSchema>
