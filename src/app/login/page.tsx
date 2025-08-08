
"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth"
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

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const router = useRouter()
    const { toast } = useToast()

    const handleLogin = async () => {
        if (!email || !password) {
            toast({
                variant: "destructive",
                title: "Login Failed",
                description: "Please enter both email and password.",
            });
            return;
        }
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/dashboard");
        } catch (error: any) {
            console.error("Error logging in: ", error);
            toast({
                variant: "destructive",
                title: "Login Failed",
                description: "Please check your credentials and try again.",
            });
        }
    }

    const handleGoogleLogin = async () => {
        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            await signInWithPopup(auth, provider);
            router.push("/dashboard");
        } catch (error: any) {
            console.error("Error with Google login: ", error);
            if (error.code === 'auth/popup-closed-by-user') {
                 toast({
                    variant: "destructive",
                    title: "Login Canceled",
                    description: "You closed the Google login window before completing the process.",
                });
                return;
            }
            toast({
                variant: "destructive",
                title: "Google Login Failed",
                description: "There was a problem logging in with Google. Please try again.",
            });
        }
    }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-secondary/50 p-4">
      <div className="mb-8">
        <Link href="/">
           <Logo />
        </Link>
      </div>
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
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
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="ml-auto inline-block text-sm underline"
                >
                  Forgot your password?
                </Link>
              </div>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button onClick={handleLogin} className="w-full">
            Login
            </Button>
            <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
              Login with Google
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
