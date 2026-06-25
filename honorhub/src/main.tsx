import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import "./index.css"
import App from "./App.tsx"
import { HonorProvider } from "@/lib/store"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { applyTheme } from "@/lib/theme"

applyTheme()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <HonorProvider>
        <TooltipProvider delayDuration={300}>
          <App />
          <Toaster richColors position="top-center" />
        </TooltipProvider>
      </HonorProvider>
    </BrowserRouter>
  </StrictMode>,
)
