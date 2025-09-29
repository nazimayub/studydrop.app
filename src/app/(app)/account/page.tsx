
"use client"
import { useState, useEffect, ChangeEvent } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { auth, db, storage } from "@/lib/firebase/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

interface NotificationPreferences {
    commentsOnNotes: boolean;
    answersOnQuestions: boolean;
    repliesToComments: boolean;
}

interface UserData {
    name: string;
    email: string;
    bio: string;
    photoURL: string;
    notificationPreferences: NotificationPreferences;
}

export default function AccountPage() {
    const [user] = useAuthState(auth);
    const [userData, setUserData] = useState<UserData>({ 
        name: "", 
        email: "", 
        bio: "", 
        photoURL: "",
        notificationPreferences: {
            commentsOnNotes: true,
            answersOnQuestions: true,
            repliesToComments: true,
        }
    });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (user) {
            const fetchUserData = async () => {
                const userDoc = doc(db, "users", user.uid);
                const userSnapshot = await getDoc(userDoc);
                if (userSnapshot.exists()) {
                    const data = userSnapshot.data();
                    setUserData({ 
                        name: user.displayName || `${data.firstName} ${data.lastName}`, 
                        email: user.email || data.email, 
                        bio: data.bio || "",
                        photoURL: user.photoURL || data.photoURL || "",
                        notificationPreferences: data.notificationPreferences || {
                            commentsOnNotes: true,
                            answersOnQuestions: true,
                            repliesToComments: true,
                        }
                    });
                }
            };
            fetchUserData();
        }
    }, [user]);
    
    const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onload = (event) => {
                setUserData((prev) => ({ ...prev, photoURL: event.target?.result as string }));
            }
            reader.readAsDataURL(file);
        }
    }

    const handleSaveChanges = async () => {
        if (!user) return;
        
        try {
            let photoURL = userData.photoURL;

            if (avatarFile) {
                const storageRef = ref(storage, `avatars/${user.uid}`);
                await uploadBytes(storageRef, avatarFile);
                photoURL = await getDownloadURL(storageRef);
            }
            
            if(auth.currentUser) {
              await updateProfile(auth.currentUser, {
                  displayName: userData.name,
                  photoURL: photoURL
              });
            }

            const userDoc = doc(db, "users", user.uid);
            const [firstName, ...lastNameParts] = userData.name.split(" ");
            const lastName = lastNameParts.join(" ");

            await setDoc(userDoc, { 
                firstName,
                lastName,
                email: userData.email,
                bio: userData.bio,
                photoURL: photoURL,
                notificationPreferences: userData.notificationPreferences,
            }, { merge: true });

            toast({
                title: "Success!",
                description: "Your profile has been updated.",
            });
        } catch (error) {
            console.error("Error saving changes: ", error);
             toast({
                variant: "destructive",
                title: "Uh oh!",
                description: "There was a problem saving your changes.",
            });
        }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setUserData((prev) => ({ ...prev, [id]: value }));
    };

    const handleNotificationChange = (id: keyof NotificationPreferences) => {
        const newPrefs = {
            ...userData.notificationPreferences,
            [id]: !userData.notificationPreferences[id],
        };
        setUserData(prev => ({...prev, notificationPreferences: newPrefs }));
    };

    const getFallback = () => {
        if (userData.name) {
            const parts = userData.name.split(" ");
            if (parts.length > 1 && parts[0] && parts[1]) {
                return `${parts[0][0]}${parts[1][0]}`;
            }
            return userData.name.substring(0, 2);
        }
        return "OD";
    }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Account Settings</h1>
        <p className="text-muted-foreground">Manage your profile and notification settings.</p>
      </div>
       <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>This is how others will see you on the site.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={userData.photoURL} />
                    <AvatarFallback>{getFallback()}</AvatarFallback>
                </Avatar>
                 <Input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                <Button variant="outline" onClick={() => document.getElementById('avatar-upload')?.click()}>Change Avatar</Button>
            </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={userData.name} onChange={handleInputChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={userData.email} onChange={handleInputChange} disabled/>
          </div>
           <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" placeholder="Tell us a little bit about yourself" value={userData.bio} onChange={handleInputChange}/>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>Manage how you receive notifications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                    <Label htmlFor="commentsOnNotes">Comments on my notes</Label>
                    <p className="text-sm text-muted-foreground">Notify me when someone comments on a note I created.</p>
                </div>
                <Switch id="commentsOnNotes" checked={userData.notificationPreferences.commentsOnNotes} onCheckedChange={() => handleNotificationChange('commentsOnNotes')} />
            </div>
             <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                    <Label htmlFor="answersOnQuestions">Answers on my questions</Label>
                    <p className="text-sm text-muted-foreground">Notify me when someone posts an answer to a question I asked.</p>
                </div>
                <Switch id="answersOnQuestions" checked={userData.notificationPreferences.answersOnQuestions} onCheckedChange={() => handleNotificationChange('answersOnQuestions')} />
            </div>
             <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                    <Label htmlFor="repliesToComments">Replies to my comments</Label>
                    <p className="text-sm text-muted-foreground">Notify me when someone replies to a comment or answer I posted.</p>
                </div>
                <Switch id="repliesToComments" checked={userData.notificationPreferences.repliesToComments} onCheckedChange={() => handleNotificationChange('repliesToComments')} />
            </div>
        </CardContent>
      </Card>
      <Button className="mt-4" onClick={handleSaveChanges}>Save Changes</Button>
    </div>
  )
}
