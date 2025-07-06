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

  const handleSave = (data: any) => {
    // The SimplifiedFormBuilder will handle the success flow internally
    // including showing the success modal and calling onClose when done
    console.log("Form saved successfully:", data)
    
    // Don't navigate immediately - let the form builder handle the success flow
    // The form builder will show its success modal and call onClose when the user closes it
  }

  return (
    <RouteGuard requiredRoles={["admin", "staff"]}>
      <div className="container mx-auto px-4 py-8">
        <SimplifiedFormBuilder onClose={handleClose} onSave={handleSave} />
        {/* <EnhancedFormBuilder onClose={handleClose} onSave={handleSave} /> */}
      </div>
    </RouteGuard>
  )
}
