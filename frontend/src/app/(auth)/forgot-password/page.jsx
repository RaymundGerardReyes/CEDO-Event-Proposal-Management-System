"use client"

import { LogoSimple } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Form, FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [email, setEmail] = useState("")

  // Form submission handler
  async function onSubmit(e) {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setIsSubmitted(true)

      toast({
        title: "Reset link sent",
        description: "Check your email for a link to reset your password.",
      })
    } catch (error) {
      console.error("Password reset error:", error)

      toast({
        title: "Something went wrong",
        description: "There was a problem sending the reset link. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md p-4">
      <div className="mb-8 text-center">
        <LogoSimple />
        <h1 className="mt-4 text-2xl font-bold text-cedo-blue">Reset your password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email address and we'll send you a link to reset your password
        </p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          {!isSubmitted ? (
            <Form onSubmit={onSubmit}>
              <div className="space-y-4">
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="your.email@example.com"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>

                <Button type="submit" className="w-full bg-cedo-blue hover:bg-cedo-blue/90" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send reset link"}
                </Button>
              </div>
            </Form>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <div className="mb-4 rounded-full bg-green-100 p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium">Check your email</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                We've sent a password reset link to your email address.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setIsSubmitted(false)
                  setEmail("")
                }}
              >
                Send another link
              </Button>
            </div>
          )}

          <div className="mt-6 text-center text-sm">
            <Link href="/sign-in" className="inline-flex items-center text-cedo-blue font-medium hover:underline">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
