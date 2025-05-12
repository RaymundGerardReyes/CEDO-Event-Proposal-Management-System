"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Camera, X, Mail, Lock, UserCircle } from "lucide-react"
import profileAvatar from '@/public/images/profile-avatar.png'; 

export default function ProfilePage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // Set mounted to true after component mounts to enable animations
  useEffect(() => {
    setMounted(true)
  }, [])

  // Mock user data
  const user = {
    name: "John Doe",
    email: "john.doe@example.com",
    role: "Administrator",
    avatar: "/images/profile-avatar.png",
  }

  const handleClose = () => {
    router.back()
  }

  if (!mounted) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred background overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Profile credentials modal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="z-10 w-full max-w-md mx-auto"
      >
        <Card className="border-cedo-blue/20 shadow-lg">
          <CardHeader className="relative pb-2">
            <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="text-xl text-cedo-blue">Profile Credentials</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 pt-4">
            {/* Profile Photo */}
            <div className="flex flex-col items-center justify-center space-y-3">
              <Avatar className="h-24 w-24 border-2 border-cedo-blue/20">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                <AvatarFallback className="bg-cedo-blue text-white text-xl">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>

              <Button variant="outline" size="sm" className="mt-2">
                <Camera className="mr-2 h-4 w-4" />
                Change Photo
              </Button>
            </div>

            <Separator />

            {/* Email Address */}
            <div className="space-y-2">
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-cedo-blue mr-2" />
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
              </div>
              <div className="flex space-x-2">
                <Input id="email" value={user.email} className="flex-1" readOnly />
                <Button variant="outline" size="sm">
                  Change
                </Button>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center">
                <Lock className="h-4 w-4 text-cedo-blue mr-2" />
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
              </div>
              <div className="flex space-x-2">
                <Input id="password" type="password" value="••••••••" className="flex-1" readOnly />
                <Button variant="outline" size="sm">
                  Change
                </Button>
              </div>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <div className="flex items-center">
                <UserCircle className="h-4 w-4 text-cedo-blue mr-2" />
                <Label htmlFor="role" className="text-sm font-medium">
                  Role
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-cedo-blue/10 text-cedo-blue px-3 py-2 rounded-md text-sm font-medium flex-1">
                  {user.role}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Your role determines your permissions within the system.</p>
            </div>

            <div className="flex justify-end pt-4">
              <Button className="bg-cedo-blue hover:bg-cedo-blue/90 text-white" onClick={handleClose}>
                Done
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
