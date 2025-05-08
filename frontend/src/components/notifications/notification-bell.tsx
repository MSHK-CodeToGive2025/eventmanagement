import { Bell } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export function NotificationBell() {

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[70vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">Notifications</h3>
          
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
                Mark all as read
              </Button>
              <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
                Clear all
              </Button>
            </div>
          
        </div>

      </DropdownMenuContent>
    </DropdownMenu>
  )
}
