import { Routes, Route } from "react-router-dom"
import { AppLayout } from "@/components/app-layout"
import Home from "@/pages/Home"
import Create from "@/pages/Create"
import Library from "@/pages/Library"
import Organisation from "@/pages/Organisation"
import Reports from "@/pages/Reports"
import Settings from "@/pages/Settings"

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
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
