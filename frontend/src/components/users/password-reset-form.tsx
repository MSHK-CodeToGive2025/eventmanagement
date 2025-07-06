import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2, Copy, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PasswordResetFormProps {
  userId: string
  username: string
  onReset: (userId: string) => Promise<{ success: boolean; tempPassword?: string; user?: any }>
  isLoading: boolean
  hideTitle?: boolean
}

export function PasswordResetForm({ userId, username, onReset, isLoading, hideTitle = false }: PasswordResetFormProps) {
  const [tempPassword, setTempPassword] = useState("")
  const [userInfo, setUserInfo] = useState<any>(null)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const handleReset = async () => {
    setError("")
    setTempPassword("")
    setUserInfo(null)

    try {
      const result = await onReset(userId)
      if (result.success && result.tempPassword) {
        setTempPassword(result.tempPassword)
        setUserInfo(result.user)
        toast({
          title: "Password Reset Successful",
          description: "A temporary password has been generated. Please communicate this to the user securely.",
        })
      }
    } catch (err: any) {
      setError(err.message || "Failed to reset password")
      toast({
        title: "Error",
        description: err.message || "Failed to reset password",
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword)
      toast({
        title: "Copied!",
        description: "Temporary password copied to clipboard",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const formContent = (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-4">
          This will generate a temporary password for <strong>{username}</strong>. 
          The user will need to change their password on next login.
        </p>
        
        <Button 
          onClick={handleReset} 
          disabled={isLoading}
          className="bg-orange-500 hover:bg-orange-600"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Resetting...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Password
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {tempPassword && userInfo && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-start">
            <CheckCircle2 className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-green-800 mb-2">Password Reset Successful</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-green-700 mb-1">User Information:</p>
                  <p className="text-sm text-green-600">
                    <strong>Name:</strong> {userInfo.firstName} {userInfo.lastName}
                  </p>
                  <p className="text-sm text-green-600">
                    <strong>Username:</strong> {userInfo.username}
                  </p>
                  {userInfo.mobile && (
                    <p className="text-sm text-green-600">
                      <strong>Mobile:</strong> {userInfo.mobile}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-green-700 mb-1">Temporary Password:</p>
                  <div className="flex items-center space-x-2">
                    <code className="bg-white px-3 py-2 rounded border text-sm font-mono text-green-800">
                      {tempPassword}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      className="text-green-600 border-green-300 hover:bg-green-50"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> Please communicate this temporary password to the user securely 
                    (e.g., via WhatsApp, phone call, or in person). The user should change their password 
                    immediately after logging in.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  if (hideTitle) {
    return formContent
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>Generate a temporary password for {username}</CardDescription>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  )
} 