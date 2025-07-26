import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"

import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft } from "lucide-react"
import { formService } from "@/services/formService"
import { RegistrationForm } from "@/types/form-types"
import SimplifiedFormBuilder from "@/components/forms-builder/simplified-form-builder"

export default function FormEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [form, setForm] = useState<RegistrationForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchForm = async () => {
      if (!id) return
      
      try {
        setLoading(true)
        const formData = await formService.getForm(id)
        setForm(formData)
      } catch (err) {
        console.error("Error fetching form:", err)
        setError("Failed to load form details")
      } finally {
        setLoading(false)
      }
    }

    fetchForm()
  }, [id])

  const handleClose = () => {
    navigate("/manage/forms")
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (error || !form) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error || "Form not found"}</p>
          <Button asChild>
            <Link to="/manage/forms">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Forms
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // Transform backend format to new form builder format
  const transformToBuilderFormat = (form: RegistrationForm) => {
    const sections: any[] = []
    let sectionId = 1
    let fieldId = 1

    form.sections.forEach((section) => {
      const sectionData = {
        id: `section_${sectionId++}`,
        title: section.title,
        description: section.description,
        fields: section.fields.map((field) => ({
          id: `field_${fieldId++}`,
          type: field.type,
          label: field.label,
          placeholder: field.placeholder,
          required: field.required,
          description: field.helpText,
          options: field.options,
          sectionId: `section_${sectionId - 1}`,
        }))
      }
      sections.push(sectionData)
    })

    return sections
  }

  const defaultSections = transformToBuilderFormat(form)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="outline" asChild className="mb-4">
          <Link to="/manage/forms">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Forms
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Edit Form: {form.title}</h1>
      </div>

      <SimplifiedFormBuilder
        onClose={handleClose}
        formId={id}
        defaultValues={{
          title: form.title,
          description: form.description || "",
        }}
        defaultSections={defaultSections}
      />
    </div>
  )
} 