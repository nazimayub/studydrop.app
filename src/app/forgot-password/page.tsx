
"use client"
import Link from "next/link"
import { useState } from "react"
import { sendPasswordResetEmail } from "firebase/auth"
import { auth } from "@/lib/firebase/firebase"
import { useToast } from "@/hooks/use-toast"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/logo"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [isSent, setIsSent] = useState(false)
    const { toast } = useToast();


    const handleResetPassword = async () => {
        if (!auth) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Firebase not configured.",
            });
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            setIsSent(true)
             toast({
                title: "Password Reset Email Sent",
                description: "Check your inbox for a link to reset your password.",
            });
        } catch (error) {
            console.error("Error sending password reset email: ", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to send password reset email. Please check the email address.",
            });
        }
    }

  return (
    <div className="flex w-full flex-col items-center justify-center min-h-screen bg-secondary/50 p-4">
      <div className="mb-8">
        <Link href="/">
           <Logo className="w-48" />
        </Link>
      </div>
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Forgot Password</CardTitle>
          <CardDescription>
            {isSent 
                ? "An email has been sent with instructions."
                : "Enter your email to receive a password reset link."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
            {isSent ? (
                 <div className="text-center">
                    <p className="mb-4">If you don&apos;t see the email, please check your spam folder.</p>
                    <Link href="/login">
                        <Button variant="outline">Back to Login</Button>
                    </Link>
                 </div>
            ) : (
                <div className="grid gap-4">
                    <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    </div>
                    <Button onClick={handleResetPassword} className="w-full">
                        Send Reset Link
                    </Button>
                     <div className="mt-4 text-center text-sm">
                        Remember your password?{" "}
                        <Link href="/login" className="underline">
                        Login
                        </Link>
                    </div>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  )
}
