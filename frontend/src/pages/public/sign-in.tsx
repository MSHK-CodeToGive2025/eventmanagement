import type React from "react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function SignIn() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    identifier: "", // Can be username, email, or mobile
    password: "",
    rememberMe: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear errors when user starts typing
    if (error) setError("")
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, rememberMe: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.identifier || !formData.password) {
      setError("Please enter your credentials")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // In a real app, this would be an API call to authenticate the user
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock authentication logic
      if (formData.identifier === "admin" && formData.password === "abcd1234") {
        login({
          id: "1",
          username: "admin",
          name: "Admin User",
          email: "admin@example.com",
          role: "admin",
          status: "active",
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        })
        navigate("/")
      } else if (formData.identifier === "staff" && formData.password === "abcd4321") {
        login({
          id: "2",
          username: "staff",
          name: "Staff User",
          email: "staff@example.com",
          role: "staff",
          status: "active",
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        })
        navigate("/")
      } else if (formData.identifier === "nelson" && formData.password === "abcd1111") {
        login({
          id: "3",
          username: "nelson",
          name: "Nelson",
          email: "nelson@example.com",
          role: "participant",
          status: "active",
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        })
        navigate("/")
      } else if (formData.password === "password") {
        // For demo purposes, any username with password "password" is a participant
        login({
          id: "4",
          username: formData.identifier,
          name: formData.identifier,
          email: `${formData.identifier}@example.com`,
          role: "participant",
          status: "active",
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        })
        navigate("/")
      } else {
        setError("Invalid credentials. Please try again.")
      }
    } catch (err) {
      setError("Failed to sign in. Please try again.")
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
                  <Label htmlFor="identifier">Username / Email / Mobile</Label>
                  <Input
                    id="identifier"
                    name="identifier"
                    placeholder="Enter your username, email, or mobile"
                    value={formData.identifier}
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
                    <Link to="#" className="text-sm text-yellow-500 hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="rememberMe" checked={formData.rememberMe} onCheckedChange={handleCheckboxChange} />
                  <Label htmlFor="rememberMe" className="text-sm">
                    Remember me
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-black"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </div>
            </form>

            <div className="mt-4 text-center text-sm">
              <p>Demo accounts:</p>
              <p className="text-gray-500">Admin: admin / abcd1234</p>
              <p className="text-gray-500">Staff: staff / abcd4321</p>
              <p className="text-gray-500">Participant: nelson / abcd1111</p>
              <p className="text-gray-500">Generic: any username / password</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <div className="text-sm text-center">
              Don't have an account?{" "}
              <Link to="/register" className="text-yellow-500 hover:underline">
                Sign Up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
