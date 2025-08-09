import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { TestUserProvider } from "@/contexts/test-user-context"

export default function DashboardLayoutPage({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TestUserProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </TestUserProvider>
  )
}
