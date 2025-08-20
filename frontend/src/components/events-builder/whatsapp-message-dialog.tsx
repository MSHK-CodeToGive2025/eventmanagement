import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, MessageSquare, AlertTriangle, CheckCircle, Info } from "lucide-react"
import { Switch } from "@/components/ui/switch"

interface WhatsAppMessageDialogProps {
  isOpen: boolean
  onClose: () => void
  eventTitle: string
  participantCount: number
  onSendMessage: (title: string, message: string, useTemplate: boolean) => Promise<{
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
  const [useTemplate, setUseTemplate] = useState(false)
  const [messageTitle, setMessageTitle] = useState("")
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [result, setResult] = useState<{
    successful: number
    failed: number
    failedNumbers: string[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async () => {
    if (!useTemplate && !message.trim()) {
      setError("Please enter a message when not using template")
      return
    }

    setIsSending(true)
    setError(null)
    setResult(null)

    try {
      const response = await onSendMessage(messageTitle, message, useTemplate)
      setResult({
        successful: response.successful,
        failed: response.failed,
        failedNumbers: response.failedNumbers
      })
      
      // Clear the form on success
      setMessageTitle("")
      setMessage("")
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send WhatsApp messages")
    } finally {
      setIsSending(false)
    }
  }

  const handleClose = () => {
    setMessageTitle("")
    setMessage("")
    setError(null)
    setResult(null)
    setUseTemplate(true)
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

          {/* Template Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-medium">Use WhatsApp Template</Label>
              <p className="text-sm text-gray-500">
                {useTemplate 
                  ? "Send using pre-approved template (cheaper, compliant)" 
                  : "Send custom message (more expensive, flexible)"
                }
              </p>
            </div>
            <Switch
              checked={useTemplate}
              onCheckedChange={setUseTemplate}
              disabled={isSending}
            />
          </div>

          {useTemplate ? (
            /* Template Info */
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <div className="space-y-2">
                  <p className="font-medium">Using Twilio WhatsApp Template</p>
                  <p className="text-sm">
                    Messages will be sent using a pre-approved WhatsApp template with the following variables:
                  </p>
                  <ul className="text-sm list-disc list-inside space-y-1">
                    <li><strong>Variable 1:</strong> Event date (MM/DD/YYYY format)</li>
                    <li><strong>Variable 2:</strong> Event time (HH:MM AM/PM format)</li>
                  </ul>
                  <p className="text-sm text-blue-600">
                    This approach ensures compliance with WhatsApp Business API policies and reduces messaging costs.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            /* Custom Message Inputs */
            <>
              {/* Message Title Input */}
              <div className="space-y-2">
                <Label htmlFor="messageTitle">Message Subtitle (Optional)</Label>
                <Input
                  id="messageTitle"
                  placeholder="Enter a subtitle for your message..."
                  value={messageTitle}
                  onChange={(e) => setMessageTitle(e.target.value)}
                  disabled={isSending}
                />
                <p className="text-sm text-gray-500">
                  Leave empty to send without a subtitle
                </p>
              </div>

              {/* Message Input */}
              <div className="space-y-2">
                <Label htmlFor="message">Message Content *</Label>
                <Textarea
                  id="message"
                  placeholder="Enter your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="resize-none"
                  disabled={isSending}
                  required
                />
                <p className="text-sm text-gray-500">
                  Custom messages cost more but allow full control over content.
                </p>
              </div>
            </>
          )}

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
                  <p className="font-medium">
                    {useTemplate ? "Template message sent successfully!" : "Custom message sent successfully!"}
                  </p>
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
            disabled={isSending || (!useTemplate && !message.trim())}
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
                Send {useTemplate ? "Template" : "Custom"} Message
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 