import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '@pages/LoginPage'
import { AdminLoginPage } from '@pages/AdminLoginPage'
import { DashboardPage } from '@pages/DashboardPage'
import { PickingPage } from '@pages/PickingPage'
import { PackingPage } from '@pages/PackingPage'
import { ShippingPage } from '@pages/ShippingPage'
import { AdminPanel } from '@pages/AdminPanel'
import { useAuth, useNetworkStatus, useAutoSync } from '@hooks/index'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppLayout() {
  useNetworkStatus()
  useAutoSync()

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin-login" element={<AdminLoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/picking"
        element={
          <ProtectedRoute>
            <PickingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/packing"
        element={
          <ProtectedRoute>
            <PackingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shipping"
        element={
          <ProtectedRoute>
            <ShippingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPanel />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}
