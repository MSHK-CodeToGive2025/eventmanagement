import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Edit } from "lucide-react"
import { formService } from "@/services/formService"
import { RegistrationForm } from "@/types/form-types"

export default function FormDetailPage() {
  const { id } = useParams<{ id: string }>()
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="outline" asChild className="mb-4">
          <Link to="/manage/forms">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Forms
          </Link>
        </Button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{form.title}</h1>
            {form.description && (
              <p className="text-gray-600 mt-2">{form.description}</p>
            )}
          </div>
          <Button asChild>
            <Link to={`/manage/forms/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Form
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Form Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">
                  <Badge variant={form.isActive ? "default" : "secondary"}>
                    {form.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Category</label>
                <p className="mt-1">{form.category || "Uncategorized"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="mt-1">{new Date(form.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="mt-1">{new Date(form.updatedAt || form.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Form Sections ({form.sections?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {form.sections && form.sections.length > 0 ? (
              <div className="space-y-4">
                {form.sections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">{section.title}</h3>
                    {section.description && (
                      <p className="text-sm text-gray-600 mb-3">{section.description}</p>
                    )}
                    {section.fields && section.fields.length > 0 ? (
                      <div className="space-y-2">
                        {section.fields.map((field, fieldIndex) => (
                          <div key={fieldIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <span className="font-medium">{field.label}</span>
                              <span className="text-sm text-gray-500 ml-2">({field.type})</span>
                              {field.required && (
                                <Badge variant="outline" className="ml-2 text-xs">Required</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No fields in this section</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No sections defined for this form</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 