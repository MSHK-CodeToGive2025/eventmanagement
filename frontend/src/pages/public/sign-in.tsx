import type React from "react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// TODO: Uncomment when implementing remember me functionality
// import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertCircle, ExternalLink, Phone, Mail, MapPin } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function SignIn() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    // TODO: Add rememberMe: false when implementing cookie functionality
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear errors when user starts typing
    if (error) setError("")
  }

  // TODO: Implement remember me functionality with cookies
  // const handleCheckboxChange = (checked: boolean) => {
  //   setFormData((prev) => ({ ...prev, rememberMe: checked }))
  // }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.username || !formData.password) {
      setError("Please enter your credentials")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      await login({
        username: formData.username,
        password: formData.password,
      })
      navigate("/")
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Sign in</CardTitle>
            <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setShowForgotPasswordDialog(true)}
                      className="text-sm text-yellow-500 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                {/* TODO: Implement remember me functionality with cookies
                <div className="flex items-center space-x-2">
                  <Checkbox id="rememberMe" checked={formData.rememberMe} onCheckedChange={handleCheckboxChange} />
                  <Label htmlFor="rememberMe" className="text-sm">
                    Remember me
                  </Label>
                </div>
                */}

                <Button
                  type="submit"
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-black"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </div>
            </form>

          </CardContent>
          <CardFooter className="flex justify-center">
            <div className="text-sm text-center">
              Don't have an account?{" "}
              <Link to="/sign-up" className="text-yellow-500 hover:underline">
                Sign Up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPasswordDialog} onOpenChange={setShowForgotPasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Forgot Password?
            </DialogTitle>
            <DialogDescription>
              Please contact The Zubin Foundation for password assistance.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3">Contact Information</h4>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">info@zubinfoundation.org</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">+852 2540 9588 (General)</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">+852 9682 3100 (Call Mira & Counselling Helpline)</span>
                </div>
                
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div className="text-sm">
                    <div>Unit 5F, High Fashion Centre</div>
                    <div>No. 1 Kwai Hei Street, Kwai Chung</div>
                    <div>Hong Kong</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button
                onClick={() => window.open('https://www.zubinfoundation.org/contact-us/', '_blank')}
                className="bg-yellow-400 hover:bg-yellow-500 text-black"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit Contact Page
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
