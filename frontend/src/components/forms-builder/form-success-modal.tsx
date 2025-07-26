import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, X } from "lucide-react"
import { RegistrationForm } from "@/types/form-types"

interface FormSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  form: RegistrationForm | null
  isUpdate?: boolean
}

export function FormSuccessModal({ isOpen, onClose, form, isUpdate = false }: FormSuccessModalProps) {
  if (!form) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            {isUpdate ? "Form Updated Successfully!" : "Form Created Successfully!"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Form Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{form.title}</h3>
              {form.description && (
                <p className="text-gray-600 mt-1">{form.description}</p>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Status: <Badge variant={form.isActive ? "default" : "secondary"}>
                {form.isActive ? "Active" : "Inactive"}
              </Badge></span>
              <span>Created: {new Date(form.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Sections and Fields */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Form Structure</h4>
            
            {form.sections && form.sections.length > 0 ? (
              <div className="space-y-3">
                {form.sections.map((section, sectionIndex) => (
                  <div key={section._id || sectionIndex} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-900">
                        Section {sectionIndex + 1}: {section.title}
                      </h5>
                      <Badge variant="outline">{section.fields?.length || 0} fields</Badge>
                    </div>
                    
                    {section.description && (
                      <p className="text-sm text-gray-600 mb-3">{section.description}</p>
                    )}

                    {section.fields && section.fields.length > 0 && (
                      <div className="space-y-2">
                        {section.fields.map((field, fieldIndex) => (
                          <div key={field._id || fieldIndex} className="flex items-center justify-between bg-white p-2 rounded border">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{field.label}</span>
                              <Badge variant="secondary" className="text-xs">
                                {field.type}
                              </Badge>
                              {field.required && (
                                <Badge variant="destructive" className="text-xs">
                                  Required
                                </Badge>
                              )}
                            </div>
                            {field.placeholder && (
                              <span className="text-xs text-gray-500">
                                "{field.placeholder}"
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <X className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No sections defined</p>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Total Sections:</span>
                <span className="ml-2 font-medium">{form.sections?.length || 0}</span>
              </div>
              <div>
                <span className="text-blue-700">Total Fields:</span>
                <span className="ml-2 font-medium">
                  {form.sections?.reduce((total, section) => total + (section.fields?.length || 0), 0) || 0}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Required Fields:</span>
                <span className="ml-2 font-medium">
                  {form.sections?.reduce((total, section) => 
                    total + (section.fields?.filter(field => field.required).length || 0), 0) || 0}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Form Status:</span>
                <span className="ml-2 font-medium">{form.isActive ? "Active" : "Inactive"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose} className="px-6">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 