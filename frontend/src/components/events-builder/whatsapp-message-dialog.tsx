import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, MessageSquare, AlertTriangle, CheckCircle, Info } from "lucide-react"

interface WhatsAppMessageDialogProps {
  isOpen: boolean
  onClose: () => void
  eventTitle: string
  eventSessionDefault: string
  contactNameDefault: string
  contactPhoneDefault: string
  participantCount: number
  onSendMessage: (payload: {
    session: string
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

export default function WhatsAppMessageDialog({
  isOpen,
  onClose,
  eventTitle,
  eventSessionDefault,
  contactNameDefault,
  contactPhoneDefault,
  participantCount,
  onSendMessage
}: WhatsAppMessageDialogProps) {
  const [session, setSession] = useState(eventSessionDefault)
  const [message, setMessage] = useState("")
  const [contactName, setContactName] = useState(contactNameDefault)
  const [contactPhone, setContactPhone] = useState(contactPhoneDefault)
  const [isSending, setIsSending] = useState(false)
  const [result, setResult] = useState<{
    successful: number
    failed: number
    failedNumbers: string[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setSession(eventSessionDefault)
      setContactName(contactNameDefault)
      setContactPhone(contactPhoneDefault)
    }
  }, [isOpen, eventSessionDefault, contactNameDefault, contactPhoneDefault])

  const handleSend = async () => {
    if (!session.trim()) {
      setError("Please enter a session (template variable 2)")
      return
    }
    if (!message.trim()) {
      setError("Please enter a message (template variable 3)")
      return
    }
    if (!contactName.trim()) {
      setError("Please enter a contact name (template variable 4)")
      return
    }
    if (!contactPhone.trim()) {
      setError("Please enter a contact phone (template variable 5)")
      return
    }

    setIsSending(true)
    setError(null)
    setResult(null)

    try {
      const response = await onSendMessage({
        session: session.trim(),
        message: message.trim(),
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim()
      })
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
    setSession(eventSessionDefault)
    setMessage("")
    setContactName(contactNameDefault)
    setContactPhone(contactPhoneDefault)
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
              This message will be sent to {participantCount} registered participant{participantCount !== 1 ? 's' : ''} via the WhatsApp utility template.
            </p>
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <p className="text-sm">
                Variable mapping: <strong>1</strong> event title (automatic), <strong>2</strong> session, <strong>3</strong> message body, <strong>4</strong> contact name, <strong>5</strong> contact phone.
              </p>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="session">Session (template variable 2) *</Label>
            <Textarea
              id="session"
              placeholder="Enter session name..."
              value={session}
              onChange={(e) => setSession(e.target.value)}
              rows={2}
              className="resize-none"
              disabled={isSending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (template variable 3) *</Label>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Contact (template variable 4) *</Label>
              <Textarea
                id="contact-name"
                placeholder="Enter contact name..."
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                rows={2}
                className="resize-none"
                disabled={isSending}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Phone (template variable 5) *</Label>
              <Textarea
                id="contact-phone"
                placeholder="Enter contact phone..."
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                rows={2}
                className="resize-none"
                disabled={isSending}
                required
              />
            </div>
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
                  <p className="font-medium">Template message sent successfully!</p>
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
            disabled={isSending || !session.trim() || !message.trim() || !contactName.trim() || !contactPhone.trim()}
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