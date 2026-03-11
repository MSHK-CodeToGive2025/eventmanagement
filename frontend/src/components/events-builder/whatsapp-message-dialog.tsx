import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, MessageSquare, AlertTriangle, CheckCircle, Info } from "lucide-react"

interface WhatsAppMessageDialogProps {
  isOpen: boolean
  onClose: () => void
  eventTitle: string
  sessions?: Array<{ _id: string; title: string }>
  defaultContactName?: string
  defaultContactPhone?: string
  participantCount: number
  onSendMessage: (payload: {
    sessionTitle: string
    message: string
    contactName: string
    contactPhone: string
  }) => Promise<{
    message: string
    successful: number
    failed: number
    failedNumbers: string[]
  }>
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response
    if (response?.data?.message) {
      return response.data.message
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}

export default function WhatsAppMessageDialog({
  isOpen,
  onClose,
  eventTitle,
  sessions = [],
  defaultContactName = "",
  defaultContactPhone = "",
  participantCount,
  onSendMessage
}: WhatsAppMessageDialogProps) {
  const sessionOptions = useMemo(() => {
    if (sessions.length === 0) {
      return [{ value: "Main event", label: "Main event" }]
    }

    if (sessions.length === 1) {
      return [{ value: sessions[0].title, label: sessions[0].title }]
    }

    return [
      { value: "All sessions", label: "All sessions" },
      ...sessions.map((session) => ({ value: session.title, label: session.title }))
    ]
  }, [sessions])

  const [sessionTitle, setSessionTitle] = useState(sessionOptions[0]?.value || "Main event")
  const [message, setMessage] = useState("")
  const [contactName, setContactName] = useState(defaultContactName)
  const [contactPhone, setContactPhone] = useState(defaultContactPhone)
  const [isSending, setIsSending] = useState(false)
  const [result, setResult] = useState<{
    successful: number
    failed: number
    failedNumbers: string[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setSessionTitle(sessionOptions[0]?.value || "Main event")
    setContactName(defaultContactName)
    setContactPhone(defaultContactPhone)
  }, [defaultContactName, defaultContactPhone, isOpen, sessionOptions])

  const handleSend = async () => {
    if (!message.trim()) {
      setError("Please enter a message (template variable 3)")
      return
    }

    setIsSending(true)
    setError(null)
    setResult(null)

    try {
      const response = await onSendMessage({
        sessionTitle,
        message,
        contactName,
        contactPhone
      })
      setResult({
        successful: response.successful,
        failed: response.failed,
        failedNumbers: response.failedNumbers
      })
      setMessage("")
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to send WhatsApp messages"))
    } finally {
      setIsSending(false)
    }
  }

  const handleClose = () => {
    setSessionTitle(sessionOptions[0]?.value || "Main event")
    setMessage("")
    setContactName(defaultContactName)
    setContactPhone(defaultContactPhone)
    setError(null)
    setResult(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Send WhatsApp Message
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Event: {eventTitle}</h3>
            <p className="text-blue-700 text-sm">
              This update will be sent to {participantCount} registered participant{participantCount !== 1 ? 's' : ''} via the WhatsApp utility template.
            </p>
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <p className="text-sm">
                Variable 1 is the event title, variable 2 is the session, variable 3 is your update, and variables 4-5 are the contact details shown to participants.
              </p>
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="session-title">Session</Label>
              <Select value={sessionTitle} onValueChange={setSessionTitle} disabled={isSending}>
                <SelectTrigger id="session-title">
                  <SelectValue placeholder="Select a session" />
                </SelectTrigger>
                <SelectContent>
                  {sessionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-name">Contact Person</Label>
              <Input
                id="contact-name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Enter contact name"
                disabled={isSending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-phone">Contact Phone</Label>
            <Input
              id="contact-phone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="Enter contact phone"
              disabled={isSending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Update Message (template variable 3) *</Label>
            <Textarea
              id="message"
              placeholder="Enter the event update message shown to participants..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="resize-none"
              disabled={isSending}
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="space-y-2">
                  <p className="font-medium">Event update sent successfully!</p>
                  <div className="text-sm space-y-1">
                    <p>✅ Successfully sent: {result.successful}</p>
                    {result.failed > 0 && (
                      <>
                        <p>❌ Failed to send: {result.failed}</p>
                        {result.failedNumbers.length > 0 && (
                          <p className="text-red-600">
                            Failed numbers: {result.failedNumbers.join(", ")}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSending}>
            Close
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !message.trim()}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 