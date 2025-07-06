import { useState, useEffect, useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { PlusCircle, Edit, Trash2, Eye, Search, Filter, ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formService } from "@/services/formService"
import { RegistrationForm } from "@/types/form-types"
import { useAuth } from "@/contexts/auth-context"

// Define types
type Form = {
  _id: string
  title: string
  description?: string
  category?: string
  isActive: boolean
  createdAt: Date
  updatedAt?: Date
  createdBy: {
    firstName: string
    lastName: string
  }
  updatedBy?: {
    firstName: string
    lastName: string
  }
  sections?: any[]
}

type SortField = "title" | "category" | "createdAt" | "updatedAt" | "updatedBy"
type SortOrder = "asc" | "desc"

export default function EnhancedFormsList() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()

  // State for all forms and filtered forms
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [formToDelete, setFormToDelete] = useState<string | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  // Sorting state
  const [sortField, setSortField] = useState<SortField>("updatedAt")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

  // Fetch forms from backend
  const fetchForms = async () => {
    try {
      setLoading(true)
      const formsData = await formService.getAllForms()
      setForms(formsData as unknown as Form[])
    } catch (error) {
      console.error("Error fetching forms:", error)
      toast({
        title: "Error",
        description: "Failed to load forms",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Load forms on component mount
  useEffect(() => {
    fetchForms()
  }, [])

  // Get unique categories for filters
  const categories = useMemo(() => {
    return Array.from(new Set(forms.map((form) => form.category || "Uncategorized")))
  }, [forms])

  // Filter and sort forms
  const filteredForms = useMemo(() => {
    return forms
      .filter((form) => {
        // Search term filter
        const matchesSearch =
          searchTerm === "" ||
          form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (form.description && form.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (form.category && form.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (form.updatedBy && `${form.updatedBy.firstName} ${form.updatedBy.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (form.createdBy && `${form.createdBy.firstName} ${form.createdBy.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()))

        // Category filter
        const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(form.category || "Uncategorized")

        return matchesSearch && matchesCategory
      })
      .sort((a, b) => {
        if (sortField === "title") {
          return sortOrder === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
        } else if (sortField === "category") {
          const categoryA = a.category || "Uncategorized"
          const categoryB = b.category || "Uncategorized"
          return sortOrder === "asc" ? categoryA.localeCompare(categoryB) : categoryB.localeCompare(categoryA)
        } else if (sortField === "createdAt") {
          return sortOrder === "asc"
            ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        } else if (sortField === "updatedAt") {
          const updatedAtA = a.updatedAt || a.createdAt
          const updatedAtB = b.updatedAt || b.createdAt
          return sortOrder === "asc"
            ? new Date(updatedAtA).getTime() - new Date(updatedAtB).getTime()
            : new Date(updatedAtB).getTime() - new Date(updatedAtA).getTime()
        } else if (sortField === "updatedBy") {
          const updatedByA = a.updatedBy ? `${a.updatedBy.firstName} ${a.updatedBy.lastName}` : "Unknown"
          const updatedByB = b.updatedBy ? `${b.updatedBy.firstName} ${b.updatedBy.lastName}` : "Unknown"
          return sortOrder === "asc" ? updatedByA.localeCompare(updatedByB) : updatedByB.localeCompare(updatedByA)
        }
        return 0
      })
  }, [forms, searchTerm, selectedCategories, sortField, sortOrder])

  // Pagination calculations
  const totalItems = filteredForms.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filteredForms.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedCategories, itemsPerPage])

  // Function to toggle category selection
  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("")
    setSelectedCategories([])
  }

  // Handle sort changes
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  // Form actions
  const handleDelete = (id: string) => {
    setFormToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (formToDelete) {
      try {
        await formService.deleteForm(formToDelete)
        setForms(forms.filter((form) => form._id !== formToDelete))
        toast({
          title: "Form deleted",
          description: "The form has been deleted successfully",
        })
      } catch (error: any) {
        console.error("Error deleting form:", error)
        let errorMessage = "Failed to delete form"
        
        // Provide more specific error messages
        if (error.message?.includes("403")) {
          errorMessage = "Access denied. Only administrators can delete forms. Please log in as an admin user."
        } else if (error.message?.includes("401")) {
          errorMessage = "Authentication required. Please log in again."
        } else if (error.message) {
          errorMessage = error.message
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setDeleteDialogOpen(false)
        setFormToDelete(null)
      }
    }
  }



  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField === field) {
      return sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
    }
    return null
  }

  // Helper function to get user display name
  const getUserDisplayName = (user?: { firstName: string; lastName: string }) => {
    if (!user) return "Unknown"
    return `${user.firstName} ${user.lastName}`
  }

  // Helper function to get field count
  const getFieldCount = (sections?: any[]) => {
    if (!sections) return 0
    return sections.reduce((total, section) => total + (section.fields?.length || 0), 0)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Forms Management</h1>
          {user && (
            <p className="text-sm text-gray-600 mt-1">
              Logged in as: {user.firstName} {user.lastName} ({user.role})
            </p>
          )}
        </div>
        <Button asChild className="whitespace-nowrap">
          <Link to="/manage/forms/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Form
          </Link>
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search forms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Button variant="outline" className="gap-2" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {selectedCategories.length > 0 && (
              <Badge variant="secondary" className="ml-1 rounded-full px-1 py-0">
                {selectedCategories.length}
              </Badge>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <ArrowUpDown className="h-4 w-4" />
                <span className="hidden sm:inline">Sort</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleSort("title")}>
                Form Title {sortField === "title" && (sortOrder === "asc" ? "(A-Z)" : "(Z-A)")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("category")}>
                Category {sortField === "category" && (sortOrder === "asc" ? "(A-Z)" : "(Z-A)")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("createdAt")}>
                Created Date {sortField === "createdAt" && (sortOrder === "asc" ? "(Oldest)" : "(Newest)")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("updatedAt")}>
                Last Modified Date {sortField === "updatedAt" && (sortOrder === "asc" ? "(Oldest)" : "(Newest)")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("updatedBy")}>
                Last Modified By {sortField === "updatedBy" && (sortOrder === "asc" ? "(A-Z)" : "(Z-A)")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Filter Section - Toggleable */}
        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-md border">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Filter Forms</h3>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Category</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {categories.map((category) => (
                  <div key={category} className="flex items-center">
                    <Checkbox
                      id={`category-${category}`}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={() => toggleCategory(category)}
                    />
                    <Label htmlFor={`category-${category}`} className="ml-2 cursor-pointer">
                      {category}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active Filters - Always visible when filters are active */}
        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500">Active filters:</span>
            {selectedCategories.map((category) => (
              <Badge key={`cat-${category}`} variant="secondary">
                {category}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Table View */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: itemsPerPage }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : currentItems.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => handleSort("title")}>
                  <div className="flex items-center">Form Title {getSortIcon("title")}</div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("category")}>
                  <div className="flex items-center">Category {getSortIcon("category")}</div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("createdAt")}>
                  <div className="flex items-center">Created Date {getSortIcon("createdAt")}</div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("updatedAt")}>
                  <div className="flex items-center">Last Modified Date {getSortIcon("updatedAt")}</div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("updatedBy")}>
                  <div className="flex items-center">Last Modified By {getSortIcon("updatedBy")}</div>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((form) => (
                <TableRow key={form._id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        {form.title}
                        <Badge variant={form.isActive ? "default" : "secondary"}>
                          {form.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {form.description && (
                        <span className="text-xs text-gray-500">{form.description}</span>
                      )}
                      <span className="text-xs text-gray-400">
                        {getFieldCount(form.sections)} fields
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{form.category || "Uncategorized"}</Badge>
                  </TableCell>
                  <TableCell>{new Date(form.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {form.updatedAt 
                      ? new Date(form.updatedAt).toLocaleDateString()
                      : new Date(form.createdAt).toLocaleDateString()
                    }
                  </TableCell>
                  <TableCell>
                    {getUserDisplayName(form.updatedBy || form.createdBy)}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/manage/forms/${form._id}`}>
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View</span>
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View form details</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/manage/forms/${form._id}/edit`}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit this form</p>
                          </TooltipContent>
                        </Tooltip>



                        {user?.role === 'admin' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => handleDelete(form._id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete this form (Admin only)</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No forms found matching your criteria</p>
          <Button variant="link" onClick={clearFilters}>
            Clear all filters
          </Button>
        </div>
      )}

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="mt-6">
          <PaginationControls
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this form? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
