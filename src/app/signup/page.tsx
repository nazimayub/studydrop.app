
"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { auth, db, googleProvider } from "@/lib/firebase/firebase"
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

export default function SignupPage() {
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const router = useRouter()
    const { toast } = useToast()

    const handleSignUp = async () => {
        if (!firstName || !lastName || !email || !password) {
            toast({
                variant: "destructive",
                title: "Missing Information",
                description: "Please fill out all fields to create an account.",
            });
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await updateProfile(user, {
                displayName: `${firstName} ${lastName}`
            });

            await setDoc(doc(db, "users", user.uid), {
                firstName,
                lastName,
                email,
                points: 0,
                bio: "",
                photoURL: ""
            });

            router.push("/dashboard");
        } catch (error: any) {
            console.error("Error signing up: ", error);
            toast({
                variant: "destructive",
                title: "Sign-up Failed",
                description: error.message || "An unexpected error occurred. Please try again.",
            });
        }
    }

    const handleGoogleSignUp = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                const nameParts = user.displayName?.split(" ") || ["", ""];
                const firstName = nameParts[0];
                const lastName = nameParts.slice(1).join(" ");

                await setDoc(userDocRef, {
                    firstName,
                    lastName,
                    email: user.email,
                    points: 0,
                    bio: "",
                    photoURL: user.photoURL || ""
                });
            }

            router.push("/dashboard");
        } catch (error: any) {
            console.error("Error with Google signup: ", error);
             if (error.code === 'auth/popup-closed-by-user') {
                 toast({
                    variant: "destructive",
                    title: "Sign-up Canceled",
                    description: "You closed the Google sign-up window before completing the process.",
                });
                return;
            }
            toast({
                variant: "destructive",
                title: "Google Sign-up Failed",
                description: "There was a problem signing up with Google. Please try again.",
            });
        }
    };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-secondary/50 p-4">
      <div className="mb-8">
        <Link href="/">
           <Logo />
        </Link>
      </div>
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Sign Up</CardTitle>
          <CardDescription>
            Enter your information to create an account
          </Description>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="first-name">First name</Label>
                <Input id="first-name" placeholder="Max" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last-name">Last name</Label>
                <Input id="last-name" placeholder="Robinson" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
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
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}/>
            </div>
            <Button onClick={handleSignUp} className="w-full">
            Create an account
            </Button>
            <Button variant="outline" className="w-full" onClick={handleGoogleSignUp}>
              Sign up with Google
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
