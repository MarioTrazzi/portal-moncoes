import { redirect } from "next/navigation"

export default function Home() {
  // Por enquanto, redireciona direto para o dashboard
  // Depois implementaremos a autenticação aqui
  redirect("/dashboard")
}
