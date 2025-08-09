"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { CalendarDays } from 'lucide-react'

interface ChartData {
  date: string
  created: number
  completed: number
  pending: number
}

interface PerformanceChartsProps {
  className?: string
}

export function PerformanceCharts({ className }: PerformanceChartsProps) {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchChartData()
  }, [])

  const fetchChartData = async () => {
    try {
      setIsLoading(true)
      // Simular dados para demonstração
      // Em uma implementação real, estes dados viriam de uma API
      const mockData: ChartData[] = [
        { date: '01/08', created: 5, completed: 3, pending: 2 },
        { date: '02/08', created: 8, completed: 6, pending: 4 },
        { date: '03/08', created: 3, completed: 7, pending: 1 },
        { date: '04/08', created: 6, completed: 4, pending: 3 },
        { date: '05/08', created: 9, completed: 5, pending: 6 },
        { date: '06/08', created: 4, completed: 8, pending: 2 },
        { date: '07/08', created: 7, completed: 6, pending: 3 }
      ]
      
      setChartData(mockData)
    } catch (error) {
      console.error('Erro ao buscar dados do gráfico:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className={className}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Tendência de OS</CardTitle>
              <CardDescription>Últimos 7 dias</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">
                  <CalendarDays className="h-8 w-8 mx-auto mb-2" />
                  <p>Carregando gráficos...</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comparativo Diário</CardTitle>
              <CardDescription>Criadas vs. Concluídas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">
                  <CalendarDays className="h-8 w-8 mx-auto mb-2" />
                  <p>Carregando gráficos...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de Linha - Tendência */}
        <Card>
          <CardHeader>
            <CardTitle>Tendência de OS</CardTitle>
            <CardDescription>Últimos 7 dias - Criadas vs. Concluídas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                  labelStyle={{ color: '#374151' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="created" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Criadas"
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="hsl(142, 76%, 36%)" 
                  strokeWidth={2}
                  name="Concluídas"
                  dot={{ fill: 'hsl(142, 76%, 36%)', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Barras - Comparativo */}
        <Card>
          <CardHeader>
            <CardTitle>Comparativo Diário</CardTitle>
            <CardDescription>Status das OS por dia</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                  labelStyle={{ color: '#374151' }}
                />
                <Bar 
                  dataKey="created" 
                  fill="hsl(var(--primary))" 
                  name="Criadas"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="completed" 
                  fill="hsl(142, 76%, 36%)" 
                  name="Concluídas"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="pending" 
                  fill="hsl(45, 93%, 47%)" 
                  name="Pendentes"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
