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
import { PlusCircle, Edit, Trash2, Copy, Eye, Search, Filter, ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Mock data for forms with additional fields
const mockForms = [
  {
    id: "1",
    name: "Event Registration Form",
    description: "Standard registration form for events",
    category: "Registration",
    status: "Published",
    createdAt: "2023-05-15",
    updatedAt: "2023-06-10",
    createdBy: "John Doe",
    updatedBy: "Jane Smith",
    fields: 12,
    tags: ["Registration", "Event"],
  },
  {
    id: "2",
    name: "Feedback Survey",
    description: "Post-event feedback collection form",
    category: "Survey",
    status: "Draft",
    createdAt: "2023-04-22",
    updatedAt: "2023-06-05",
    createdBy: "Jane Smith",
    updatedBy: "Jane Smith",
    fields: 8,
    tags: ["Survey", "Feedback"],
  },
  {
    id: "3",
    name: "Speaker Application",
    description: "Form for speaker submissions",
    category: "Application",
    status: "Published",
    createdAt: "2023-03-10",
    updatedAt: "2023-05-20",
    createdBy: "Mark Johnson",
    updatedBy: "Sarah Williams",
    fields: 15,
    tags: ["Application", "Speaker"],
  },
  {
    id: "4",
    name: "Vendor Registration",
    description: "Registration form for event vendors",
    category: "Registration",
    status: "Published",
    createdAt: "2023-02-18",
    updatedAt: "2023-04-15",
    createdBy: "John Doe",
    updatedBy: "Mark Johnson",
    fields: 10,
    tags: ["Registration", "Vendor"],
  },
  {
    id: "5",
    name: "Volunteer Sign-up",
    description: "Form for volunteer registration",
    category: "Registration",
    status: "Published",
    createdAt: "2023-01-25",
    updatedAt: "2023-03-05",
    createdBy: "Sarah Williams",
    updatedBy: "John Doe",
    fields: 9,
    tags: ["Registration", "Volunteer"],
  },
  {
    id: "6",
    name: "Event Evaluation",
    description: "Form for evaluating event success",
    category: "Survey",
    status: "Draft",
    createdAt: "2023-06-01",
    updatedAt: "2023-06-02",
    createdBy: "Jane Smith",
    updatedBy: "Jane Smith",
    fields: 14,
    tags: ["Survey", "Evaluation"],
  },
  {
    id: "7",
    name: "Sponsor Application",
    description: "Form for potential sponsors",
    category: "Application",
    status: "Published",
    createdAt: "2023-04-05",
    updatedAt: "2023-05-12",
    createdBy: "Mark Johnson",
    updatedBy: "Mark Johnson",
    fields: 11,
    tags: ["Application", "Sponsor"],
  },
  {
    id: "8",
    name: "Workshop Registration",
    description: "Registration for workshop attendees",
    category: "Registration",
    status: "Published",
    createdAt: "2023-03-20",
    updatedAt: "2023-04-10",
    createdBy: "Sarah Williams",
    updatedBy: "John Doe",
    fields: 7,
    tags: ["Registration", "Workshop"],
  },
  {
    id: "9",
    name: "Satisfaction Survey",
    description: "General satisfaction survey",
    category: "Survey",
    status: "Draft",
    createdAt: "2023-05-28",
    updatedAt: "2023-06-08",
    createdBy: "Jane Smith",
    updatedBy: "Sarah Williams",
    fields: 13,
    tags: ["Survey", "Satisfaction"],
  },
  {
    id: "10",
    name: "Media Accreditation",
    description: "Form for media personnel accreditation",
    category: "Application",
    status: "Published",
    createdAt: "2023-02-10",
    updatedAt: "2023-03-15",
    createdBy: "Mark Johnson",
    updatedBy: "Jane Smith",
    fields: 16,
    tags: ["Application", "Media"],
  },
  {
    id: "11",
    name: "RSVP Form",
    description: "Simple RSVP form for events",
    category: "Registration",
    status: "Published",
    createdAt: "2023-04-15",
    updatedAt: "2023-05-10",
    createdBy: "John Doe",
    updatedBy: "John Doe",
    fields: 5,
    tags: ["Registration", "RSVP"],
  },
  {
    id: "12",
    name: "Event Feedback Advanced",
    description: "Detailed feedback collection form",
    category: "Survey",
    status: "Published",
    createdAt: "2023-03-05",
    updatedAt: "2023-04-20",
    createdBy: "Jane Smith",
    updatedBy: "Mark Johnson",
    fields: 18,
    tags: ["Survey", "Feedback", "Advanced"],
  },
]

// Define types
type Form = {
  id: string
  name: string
  description: string
  category: string
  status: string
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
  fields: number
  tags: string[]
}

type SortField = "name" | "category" | "createdAt" | "updatedAt" | "updatedBy"
type SortOrder = "asc" | "desc"

export default function EnhancedFormsList() {
  const navigate = useNavigate()
  const { toast } = useToast()

  // State for all forms and filtered forms
  const [forms, setForms] = useState<Form[]>(mockForms)
  const [loading, setLoading] = useState(false)
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

  // Get unique categories for filters
  const categories = useMemo(() => {
    return Array.from(new Set(forms.map((form) => form.category)))
  }, [forms])

  // Filter and sort forms
  const filteredForms = useMemo(() => {
    return forms
      .filter((form) => {
        // Search term filter
        const matchesSearch =
          searchTerm === "" ||
          form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          form.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          form.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          form.updatedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
          form.createdBy.toLowerCase().includes(searchTerm.toLowerCase())

        // Category filter
        const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(form.category)

        return matchesSearch && matchesCategory
      })
      .sort((a, b) => {
        if (sortField === "name") {
          return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
        } else if (sortField === "category") {
          return sortOrder === "asc" ? a.category.localeCompare(b.category) : b.category.localeCompare(a.category)
        } else if (sortField === "createdAt") {
          return sortOrder === "asc"
            ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        } else if (sortField === "updatedAt") {
          return sortOrder === "asc"
            ? new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
            : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        } else if (sortField === "updatedBy") {
          return sortOrder === "asc" ? a.updatedBy.localeCompare(b.updatedBy) : b.updatedBy.localeCompare(a.updatedBy)
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

  const confirmDelete = () => {
    if (formToDelete) {
      setForms(forms.filter((form) => form.id !== formToDelete))
      toast({
        title: "Form deleted",
        description: "The form has been deleted successfully",
      })
      setDeleteDialogOpen(false)
      setFormToDelete(null)
    }
  }

  const handleDuplicate = (id: string) => {
    const formToDuplicate = forms.find((form) => form.id === id)
    if (formToDuplicate) {
      const newForm = {
        ...formToDuplicate,
        id: Date.now().toString(),
        name: `${formToDuplicate.name} (Copy)`,
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
        createdBy: "Current User", // In a real app, this would be the current user
        updatedBy: "Current User",
      }
      setForms([...forms, newForm])
      toast({
        title: "Form duplicated",
        description: "The form has been duplicated successfully",
      })
    }
  }

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField === field) {
      return sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
    }
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Forms Management</h1>
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
              <DropdownMenuItem onClick={() => handleSort("name")}>
                Form Title {sortField === "name" && (sortOrder === "asc" ? "(A-Z)" : "(Z-A)")}
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
                <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                  <div className="flex items-center">Form Title {getSortIcon("name")}</div>
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
                <TableRow key={form.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      {form.name}
                      <span className="text-xs text-gray-500">{form.description}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{form.category}</Badge>
                  </TableCell>
                  <TableCell>{form.createdAt}</TableCell>
                  <TableCell>{form.updatedAt}</TableCell>
                  <TableCell>{form.updatedBy}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/manage/forms/${form.id}`}>
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
                              <Link to={`/manage/forms/${form.id}/edit`}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit this form</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => handleDuplicate(form.id)}>
                              <Copy className="h-4 w-4" />
                              <span className="sr-only">Duplicate</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Create a copy of this form</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDelete(form.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete this form</p>
                          </TooltipContent>
                        </Tooltip>
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
