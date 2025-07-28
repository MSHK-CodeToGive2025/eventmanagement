import type React from "react"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Info } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { validatePhoneNumberForForm, formatPhoneNumberForDisplay } from "@/lib/phone-utils"
import { PhoneInput } from "@/components/ui/phone-input"

export default function SignUp() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear errors when user starts typing
    if (error) setError("")
  }

  const validateForm = () => {
    if (!formData.username) {
      setError("Username is required")
      return false
    }

    if (!formData.firstName) {
      setError("First name is required")
      return false
    }

    if (!formData.lastName) {
      setError("Last name is required")
      return false
    }

    if (!formData.mobile) {
      setError("Mobile phone is required for WhatsApp reminders")
      return false
    }

    // Validate phone number format
    const phoneValidation = validatePhoneNumberForForm(formData.mobile)
    if (!phoneValidation.isValid) {
      setError(phoneValidation.error || "Please enter a valid phone number")
      return false
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters")
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return false
    }

    // Email validation (optional but validate if provided)
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Please enter a valid email address")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setError("")

    try {
      // Format phone number for Twilio compliance
      const phoneValidation = validatePhoneNumberForForm(formData.mobile)
      if (!phoneValidation.isValid) {
        setError(phoneValidation.error || "Please enter a valid phone number")
        return
      }

      await register({
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email || undefined,
        mobile: formData.mobile,
        password: formData.password,
      })

      setSuccess("Account created successfully! Redirecting to home page...")

      // Redirect after a short delay
      setTimeout(() => {
        navigate("/")
      }, 2000)
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
            <CardDescription className="text-center">Enter your details below to create your account</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-600 p-3 rounded-md mb-4 flex items-start">
                <CheckCircle2 className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <div className="mb-4 text-sm flex items-center">
              <span className="text-red-500 mr-1">*</span>
              <span className="text-gray-600">Indicates required fields</span>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="flex items-center">
                    Username <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    placeholder="johndoe"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="border-gray-300 focus:border-yellow-500 focus:ring focus:ring-yellow-200"
                  />
                  <p className="text-xs text-gray-500">Required for account creation</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="flex items-center">
                      First Name <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="border-gray-300 focus:border-yellow-500 focus:ring focus:ring-yellow-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="flex items-center">
                      Last Name <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="border-gray-300 focus:border-yellow-500 focus:ring focus:ring-yellow-200"
                    />
                  </div>
                </div>

                <PhoneInput
                  id="mobile"
                  name="mobile"
                  label="Mobile Number"
                  value={formData.mobile}
                  onChange={(value) => setFormData(prev => ({ ...prev, mobile: value }))}
                  required
                  placeholder="+852 1234 5678"
                />

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center">
                    Email <span className="text-gray-400 text-xs ml-1">(optional)</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="border-gray-300 focus:border-yellow-500 focus:ring focus:ring-yellow-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center">
                    Password <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="border-gray-300 focus:border-yellow-500 focus:ring focus:ring-yellow-200"
                  />
                  <p className="text-xs text-gray-500">Must be at least 8 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center">
                    Confirm Password <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="border-gray-300 focus:border-yellow-500 focus:ring focus:ring-yellow-200"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-black"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Sign Up"}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-gray-500">
              By creating an account, you agree to our{" "}
              <Link to="#" className="text-yellow-500 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="#" className="text-yellow-500 hover:underline">
                Privacy Policy
              </Link>
            </div>
            <div className="text-sm text-center">
              Already have an account?{" "}
              <Link to="/sign-in" className="text-yellow-500 hover:underline">
                Sign In
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
