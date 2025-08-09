"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

interface TestUserContextType {
  currentTestUser: string
  setCurrentTestUser: (user: string) => void
}

const TestUserContext = createContext<TestUserContextType | undefined>(undefined)

export function TestUserProvider({ children }: { children: ReactNode }) {
  const [currentTestUser, setCurrentTestUser] = useState<string>('funcionario')

  return (
    <TestUserContext.Provider value={{ currentTestUser, setCurrentTestUser }}>
      {children}
    </TestUserContext.Provider>
  )
}

export function useTestUser() {
  const context = useContext(TestUserContext)
  if (context === undefined) {
    throw new Error('useTestUser must be used within a TestUserProvider')
  }
  return context
}
