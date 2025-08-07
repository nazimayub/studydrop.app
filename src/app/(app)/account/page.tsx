
"use client"
import { useState, useEffect, ChangeEvent } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { auth, db, storage } from "@/lib/firebase/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";

export default function AccountPage() {
    const [user] = useAuthState(auth);
    const [userData, setUserData] = useState<any>({ name: "", email: "", bio: "", photoURL: "" });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    useEffect(() => {
        if (user) {
            const fetchUserData = async () => {
                const userDoc = doc(db, "users", user.uid);
                const userSnapshot = await getDoc(userDoc);
                if (userSnapshot.exists()) {
                    const data = userSnapshot.data();
                    setUserData({ 
                        name: `${data.firstName} ${data.lastName}`, 
                        email: data.email, 
                        bio: data.bio || "",
                        photoURL: user.photoURL || ""
                    });
                }
            };
            fetchUserData();
        }
    }, [user]);
    
    const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAvatarFile(e.target.files[0]);
            const reader = new FileReader();
            reader.onload = (event) => {
                setUserData((prev: any) => ({ ...prev, photoURL: event.target?.result as string }));
            }
            reader.readAsDataURL(e.target.files[0]);
        }
    }

    const handleSaveChanges = async () => {
        if (user) {
            let photoURL = user.photoURL;

            if (avatarFile) {
                const storageRef = ref(storage, `avatars/${user.uid}`);
                await uploadBytes(storageRef, avatarFile);
                photoURL = await getDownloadURL(storageRef);
                await updateProfile(user, { photoURL });
            }

            const userDoc = doc(db, "users", user.uid);
            const [firstName, ...lastNameParts] = userData.name.split(" ");
            const lastName = lastNameParts.join(" ");

            await setDoc(userDoc, { 
                firstName,
                lastName,
                email: userData.email,
                bio: userData.bio,
                photoURL: photoURL
            }, { merge: true });

            await updateProfile(user, {
                displayName: `${firstName} ${lastName}`,
                photoURL: photoURL
            })

            alert("Changes saved!");
        }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setUserData((prev: any) => ({ ...prev, [id]: value }));
    };

    const getFallback = () => {
        if (userData.name) {
            const parts = userData.name.split(" ");
            if (parts.length > 1) {
                return `${parts[0][0]}${parts[1][0]}`;
            }
            return userData.name.substring(0, 2);
        }
        return "SD";
    }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Account Settings</h1>
        <p className="text-muted-foreground">Manage your profile, and notification preferences.</p>
      </div>
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
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
                <Input id="email" type="email" value={userData.email} onChange={handleInputChange} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" placeholder="Tell us a little bit about yourself" value={userData.bio} onChange={handleInputChange}/>
              </div>
            </CardContent>
          </Card>
          <Button className="mt-4" onClick={handleSaveChanges}>Save Changes</Button>
        </TabsContent>
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage how you receive notifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive emails about new answers to your questions and other important updates.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Weekly Summary</Label>
                  <p className="text-sm text-muted-foreground">
                    Get a weekly email with a summary of popular notes and forum activity.
                  </p>
                </div>
                <Switch />
              </div>
               <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Reward Milestones</Label>
                  <p className="text-sm text-muted-foreground">
                    Be notified when you unlock a new badge or reach a point milestone.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
          <Button className="mt-4">Save Changes</Button>
        </TabsContent>
      </Tabs>
    </div>
  )
}
