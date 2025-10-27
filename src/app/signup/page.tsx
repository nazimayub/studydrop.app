
"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase/firebase"
import { useToast } from "@/hooks/use-toast"

import { LoadingButton } from "@/components/ui/loading-button"
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
import { Button } from "@/components/ui/button"

export default function SignupPage() {
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
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

        if (!auth || !db) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Firebase is not configured correctly.",
            });
            return;
        }

        setIsLoading(true);
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
                photoURL: "",
                createdAt: serverTimestamp(),
                notificationPreferences: {
                    commentsOnNotes: true,
                    answersOnQuestions: true,
                    repliesToComments: true,
                },
                enrolledClasses: [],
                unlockedThemes: ['default'],
                activeTheme: 'default',
            });

            router.push("/dashboard");
        } catch (error: any) {
            console.error("Error signing up: ", error);
            setIsLoading(false); // Stop loading on error
            if (error.code === 'auth/email-already-in-use') {
                toast({
                    variant: "destructive",
                    title: "Email Already Exists",
                    description: "This email address is already in use. Please login instead.",
                });
            } else if (error.code === 'auth/weak-password') {
                 toast({
                    variant: "destructive",
                    title: "Weak Password",
                    description: "Password should be at least 6 characters.",
                });
            }
             else {
                toast({
                    variant: "destructive",
                    title: "Sign-up Failed",
                    description: error.message || "An unexpected error occurred. Please check your configuration and try again.",
                });
            }
        }
    }

    const handleGoogleSignUp = async () => {
        if (!auth || !db) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Firebase is not configured correctly.",
            });
            return;
        }
        setIsGoogleLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            const result = await signInWithPopup(auth, provider);
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
                    photoURL: user.photoURL,
                    points: 0,
                    bio: "",
                    createdAt: serverTimestamp(),
                    notificationPreferences: {
                        commentsOnNotes: true,
                        answersOnQuestions: true,
                        repliesToComments: true,
                    },
                    enrolledClasses: [],
                    unlockedThemes: ['default'],
                    activeTheme: 'default',
                });
            }

            router.push("/dashboard");
        } catch (error: any) {
            console.error("Error with Google signup: ", error);
            setIsGoogleLoading(false); // Stop loading on error
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
                description: "There was a problem signing up with Google. Please check your configuration and try again.",
            });
        }
    };

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-screen p-4 animated-gradient bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500">
      <div className="mb-8">
        <Link href="/">
           <Logo className="w-48" />
        </Link>
      </div>
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Sign Up</CardTitle>
          <CardDescription>
            Enter your information to create an account
          </CardDescription>
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
            <LoadingButton onClick={handleSignUp} loading={isLoading} className="w-full">
            Create an account
            </LoadingButton>
            <LoadingButton variant="outline" className="w-full" onClick={handleGoogleSignUp} loading={isGoogleLoading}>
              Sign up with Google
            </LoadingButton>
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
