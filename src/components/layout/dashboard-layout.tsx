"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { NotificationSystem } from "@/components/notifications/notification-system"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTestUser } from "@/contexts/test-user-context"
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  LogOut,
  Bell,
  Search,
  Plus
} from "lucide-react"

interface SidebarProps {
  className?: string
}

const navigationItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Ordens de Serviço",
    href: "/dashboard/service-orders",
    icon: FileText,
  },
  {
    title: "Usuários",
    href: "/dashboard/users",
    icon: Users,
    adminOnly: true,
  },
  {
    title: "Fornecedores",
    href: "/dashboard/suppliers",
    icon: Users,
    adminOnly: true,
  },
  {
    title: "Configurações",
    href: "/dashboard/settings",
    icon: Settings,
    adminOnly: true,
  },
]

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn("pb-12 w-64", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Portal Monções
          </h2>
          <div className="space-y-1">
            <Button variant="secondary" className="w-full justify-start" asChild>
              <Link href="/dashboard/service-orders/create">
                <Plus className="mr-2 h-4 w-4" />
                Nova OS
              </Link>
            </Button>
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Menu
          </h2>
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  const { currentTestUser, setCurrentTestUser } = useTestUser()
  
  return (
    <div className={cn("border-b", className)}>
      <div className="flex h-16 items-center px-4">
        {/* Seletor de usuário de teste */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Usuário:</span>
          <select 
            value={currentTestUser} 
            onChange={(e) => setCurrentTestUser(e.target.value)}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="funcionario">Funcionário</option>
            <option value="tecnico">Técnico</option>
            <option value="admin">Admin</option>
            <option value="gestor">Gestor</option>
            <option value="aprovador">Aprovador</option>
          </select>
        </div>
        
        <div className="ml-auto flex items-center space-x-4">
          <Button variant="ghost" size="icon">
            <Search className="h-4 w-4" />
          </Button>
          <NotificationSystem testUser={currentTestUser} />
          <ThemeToggle />
          <Button variant="ghost" size="icon">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="grid lg:grid-cols-5">
      <Sidebar className="hidden lg:block" />
      <div className="col-span-3 lg:col-span-4">
        <Header />
        <div className="h-full px-4 py-6 lg:px-8">
          {children}
        </div>
      </div>
    </div>
  )
}
