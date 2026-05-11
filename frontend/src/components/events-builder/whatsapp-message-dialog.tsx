import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, MessageSquare, AlertTriangle, CheckCircle, Info } from "lucide-react"

interface WhatsAppMessageDialogProps {
  isOpen: boolean
  onClose: () => void
  eventTitle: string
  participantCount: number
  sessions?: Array<{ _id: string; title: string }>
  staffContact?: { name?: string; phone?: string }
  onSendMessage: (message: string, session?: string) => Promise<{
    message: string
    successful: number
    failed: number
    failedNumbers: string[]
  }>
}

export default function WhatsAppMessageDialog({
  isOpen,
  onClose,
  eventTitle,
  participantCount,
  sessions,
  staffContact,
  onSendMessage
}: WhatsAppMessageDialogProps) {
  const [message, setMessage] = useState("")
  const [selectedSession, setSelectedSession] = useState<string>("")
  const [isSending, setIsSending] = useState(false)
  const [result, setResult] = useState<{
    successful: number
    failed: number
    failedNumbers: string[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async () => {
    if (!message.trim()) {
      setError("Please enter a message")
      return
    }

    setIsSending(true)
    setError(null)
    setResult(null)

    try {
      const response = await onSendMessage(message, selectedSession || undefined)
      setResult({
        successful: response.successful,
        failed: response.failed,
        failedNumbers: response.failedNumbers
      })
      setMessage("")
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send WhatsApp messages")
    } finally {
      setIsSending(false)
    }
  }

  const handleClose = () => {
    setMessage("")
    setSelectedSession("")
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
            Send WhatsApp Event Update
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Event: {eventTitle}</h3>
            <p className="text-blue-700 text-sm">
              This event update will be sent to {participantCount} registered participant{participantCount !== 1 ? 's' : ''} via WhatsApp.
            </p>
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <p className="text-sm">
                Template: <strong>Event</strong> (auto-filled), <strong>Session</strong> (select below), <strong>Message</strong> (enter below), <strong>Contact</strong> &amp; <strong>Phone</strong> (from event settings). A standard closing line about not replying and contacting the number above is added automatically to every send.
              </p>
            </AlertDescription>
          </Alert>

          {sessions && sessions.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="session">Session (optional)</Label>
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger>
                  <SelectValue placeholder="All sessions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">All sessions</SelectItem>
                  {sessions.map(s => (
                    <SelectItem key={s._id} value={s.title}>{s.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              placeholder="Enter your event update message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="resize-none"
              disabled={isSending}
              required
            />
          </div>

          {staffContact && (staffContact.name || staffContact.phone) && (
            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
              <p className="font-medium text-gray-700 mb-1">Contact info (auto-filled from event settings):</p>
              {staffContact.name && <p>👤 Contact: {staffContact.name}</p>}
              {staffContact.phone && <p>📞 Phone: {staffContact.phone}</p>}
            </div>
          )}

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
                Send Update
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 