
"use client"
import { useState, useEffect, ChangeEvent } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { auth, db, storage } from "@/lib/firebase/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { courses } from "@/lib/courses";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";


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
    enrolledClasses: string[];
}

export default function AccountPage() {
    const [user] = auth ? useAuthState(auth) : [null];
    const [userData, setUserData] = useState<UserData>({ 
        name: "", 
        email: "", 
        bio: "", 
        photoURL: "",
        notificationPreferences: {
            commentsOnNotes: true,
            answersOnQuestions: true,
            repliesToComments: true,
        },
        enrolledClasses: [],
    });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const { toast } = useToast();
    const [open, setOpen] = useState(false)

    useEffect(() => {
        if (user && db) {
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
                        },
                        enrolledClasses: data.enrolledClasses || [],
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
        if (!user || !db || !storage || !auth) return;
        
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
                enrolledClasses: userData.enrolledClasses,
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
        if (!userData.name) {
            return "OD";
        }
        const parts = userData.name.split(" ").filter(Boolean);
        if (parts.length > 1) {
            return `${parts[0][0]}${parts[parts.length-1][0]}`;
        }
        if (parts.length === 1 && parts[0].length > 1) {
            return parts[0].substring(0, 2);
        }
        return "OD";
    }
    
    const handleClassToggle = (courseName: string) => {
        setUserData(prev => {
            const currentlyEnrolled = prev.enrolledClasses.includes(courseName);
            if (currentlyEnrolled) {
                return {...prev, enrolledClasses: prev.enrolledClasses.filter(c => c !== courseName)};
            } else {
                return {...prev, enrolledClasses: [...prev.enrolledClasses, courseName]};
            }
        });
    };

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Account Settings</h1>
        <p className="text-muted-foreground">Manage your profile, classes, and notification settings.</p>
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
                    <AvatarFallback key={userData.name}>{getFallback()}</AvatarFallback>
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
            <Textarea id="bio" placeholder="Tell us a little bit about yourself" value={userData.bio} onChange={handleInputChange} />
          </div>
        </CardContent>
      </Card>
        <Card>
            <CardHeader>
                <CardTitle>My Classes</CardTitle>
                <CardDescription>Select the classes you are enrolled in to filter your 'Catch Up Feed' on the dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                        >
                        {userData.enrolledClasses.length > 0 ? `${userData.enrolledClasses.length} class(es) selected` : "Select classes..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                            <CommandInput placeholder="Search classes..." />
                            <CommandList>
                                <CommandEmpty>No classes found.</CommandEmpty>
                                <CommandGroup>
                                    {courses.map((course) => (
                                    <CommandItem
                                        key={course.name}
                                        value={course.name}
                                        onSelect={(currentValue) => {
                                           handleClassToggle(course.name)
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                userData.enrolledClasses.includes(course.name) ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {course.name}
                                    </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                <div className="flex flex-wrap gap-2">
                    {userData.enrolledClasses.map(courseName => (
                        <Badge key={courseName} variant="secondary">
                            {courseName}
                             <button className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2" onClick={() => handleClassToggle(courseName)}>
                                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </button>
                        </Badge>
                    ))}
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
