import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, Plus, X, AlertTriangle } from "lucide-react"

interface ReminderTimeConfigProps {
  value: number[]
  onChange: (value: number[]) => void
  disabled?: boolean
}

export default function ReminderTimeConfig({ value, onChange, disabled = false }: ReminderTimeConfigProps) {
  const [newTime, setNewTime] = useState("")
  const [error, setError] = useState("")

  const addReminderTime = () => {
    const time = parseInt(newTime)
    
    if (!newTime || isNaN(time) || time <= 0) {
      setError("Please enter a valid positive number")
      return
    }

    if (value.includes(time)) {
      setError("This reminder time already exists")
      return
    }

    if (time > 168) { // 7 days
      setError("Reminder time cannot be more than 7 days (168 hours)")
      return
    }

    const newValue = [...value, time].sort((a, b) => b - a) // Sort descending
    onChange(newValue)
    setNewTime("")
    setError("")
  }

  const removeReminderTime = (timeToRemove: number) => {
    onChange(value.filter(time => time !== timeToRemove))
  }

  const formatTime = (hours: number): string => {
    if (hours >= 24) {
      const days = Math.floor(hours / 24)
      const remainingHours = hours % 24
      if (remainingHours === 0) {
        return `${days} day${days > 1 ? 's' : ''}`
      } else {
        return `${days} day${days > 1 ? 's' : ''} ${remainingHours} hour${remainingHours > 1 ? 's' : ''}`
      }
    } else {
      return `${hours} hour${hours > 1 ? 's' : ''}`
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addReminderTime()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          WhatsApp Reminder Times
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reminder-time">Add Reminder Time</Label>
          <div className="flex gap-2">
            <Input
              id="reminder-time"
              type="number"
              placeholder="e.g., 24 (hours before event)"
              value={newTime}
              onChange={(e) => {
                setNewTime(e.target.value)
                setError("")
              }}
              onKeyPress={handleKeyPress}
              disabled={disabled}
              min="1"
              max="168"
              className="flex-1"
            />
            <Button
              type="button"
              onClick={addReminderTime}
              disabled={disabled || !newTime}
              size="sm"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-2">
          <Label>Configured Reminder Times</Label>
          {value.length === 0 ? (
            <p className="text-sm text-gray-500">No reminder times configured. Participants will not receive automatic reminders.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {value.map((time) => (
                <Badge
                  key={time}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {formatTime(time)} before event
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeReminderTime(time)}
                    disabled={disabled}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="text-sm text-gray-600">
          <p>• Reminder times are in hours before the event starts</p>
          <p>• Maximum reminder time is 7 days (168 hours)</p>
          <p>• Reminders will be sent automatically to all registered participants</p>
        </div>
      </CardContent>
    </Card>
  )
} 