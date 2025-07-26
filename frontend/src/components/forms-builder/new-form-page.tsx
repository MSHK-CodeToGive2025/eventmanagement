import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import RouteGuard from "@/components/route-guard"
import SimplifiedFormBuilder from "@/components/forms-builder/simplified-form-builder"
//import EnhancedFormBuilder from "@/components/forms-builder/enhanced-form-builder"

export default function NewFormPage() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleClose = () => {
    navigate("/manage/forms")
  }

  return (
    <RouteGuard requiredRoles={["admin", "staff"]}>
      <div className="container mx-auto px-4 py-8">
        <SimplifiedFormBuilder onClose={handleClose} />
        {/* <EnhancedFormBuilder onClose={handleClose} onSave={handleSave} /> */}
      </div>
    </RouteGuard>
  )
}
