import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, MessageSquare, AlertTriangle, CheckCircle } from "lucide-react"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

interface WhatsAppMessageDialogProps {
  isOpen: boolean
  onClose: () => void
  eventTitle: string
  participantCount: number
  onSendMessage: (message: string) => Promise<{
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
  onSendMessage
}: WhatsAppMessageDialogProps) {
  const [message, setMessage] = useState("")
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
      const response = await onSendMessage(message)
      setResult({
        successful: response.successful,
        failed: response.failed,
        failedNumbers: response.failedNumbers
      })
      
      // Clear the form on success
      setMessage("")
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send WhatsApp messages")
    } finally {
      setIsSending(false)
    }
  }

  const handleClose = () => {
    setMessage("")
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
          {/* Event Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Event: {eventTitle}</h3>
            <p className="text-blue-700 text-sm">
              This message will be sent to {participantCount} registered participant{participantCount !== 1 ? 's' : ''}.
            </p>
          </div>

          {/* Message Input */}
          <div className="space-y-2">
            <Label htmlFor="message">Message Content</Label>
            <RichTextEditor
              value={message}
              onChange={setMessage}
              placeholder="Enter your message here..."
              minHeight="200px"
            />
            <p className="text-sm text-gray-500">
              The message will be prefixed with "Event Notification: [Event Title]"
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Result */}
          {result && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="space-y-2">
                  <p className="font-medium">Message sent successfully!</p>
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
            Cancel
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