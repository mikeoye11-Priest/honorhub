import { Routes, Route, Navigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { AppLayout } from "@/components/app-layout"
import { useAuth } from "@/lib/auth"
import Login from "@/pages/Login"
import Home from "@/pages/Home"
import Create from "@/pages/Create"
import Library from "@/pages/Library"
import Organisation from "@/pages/Organisation"
import Reports from "@/pages/Reports"
import Settings from "@/pages/Settings"

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { loading, authed } = useAuth()
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    )
  }
  if (!authed) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Home />} />
        <Route path="create" element={<Create />} />
        <Route path="library" element={<Library />} />
        <Route path="organisation" element={<Organisation />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
