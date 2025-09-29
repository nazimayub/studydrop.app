
"use client"
import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { collection, onSnapshot, query, where, doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { db, auth, messaging } from "@/lib/firebase/firebase";
import { getToken } from "firebase/messaging";
import { useAuthState } from "react-firebase-hooks/auth";
import Link from "next/link";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useToast } from "@/hooks/use-toast";


export function NotificationBell() {
    const [user] = useAuthState(auth);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (user) {
            const notificationsRef = collection(db, "users", user.uid, "notifications");
            const q = query(notificationsRef, where("isRead", "==", false));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                setUnreadCount(snapshot.size);
                setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });

            return () => unsubscribe();
        }
    }, [user]);
    
    useEffect(() => {
        const requestPermission = async () => {
            if (!messaging || !user) return;
            
            try {
                const permission = await Notification.requestPermission();
                if (permission === "granted") {
                    const currentToken = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
                    if (currentToken) {
                        const userDocRef = doc(db, "users", user.uid);
                        await setDoc(userDocRef, { fcmToken: currentToken }, { merge: true });
                    } else {
                        console.log('No registration token available. Request permission to generate one.');
                    }
                }
            } catch (error) {
                console.error("An error occurred while retrieving token. ", error);
            }
        };

        requestPermission();
    }, [user, toast]);

    const handleBellClick = async () => {
        if (!user) return;

        if (isPopoverOpen && notifications.length > 0) {
             const notificationsRef = collection(db, "users", user.uid, "notifications");
             notifications.forEach(async (notification) => {
                if (!notification.isRead) {
                    const notificationDoc = doc(notificationsRef, notification.id);
                    await updateDoc(notificationDoc, { isRead: true });
                }
             });
        }
        setIsPopoverOpen(!isPopoverOpen);
    };

    return (
         <Popover onOpenChange={handleBellClick}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Notifications</h4>
                        <p className="text-sm text-muted-foreground">
                           You have {unreadCount} unread messages.
                        </p>
                    </div>
                     <div className="grid gap-2">
                        {notifications.map((notification) => (
                           <Link key={notification.id} href={notification.link} className="block">
                             <div  className="flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">{notification.message}</p>
                                    <p className="text-sm text-muted-foreground">{new Date(notification.date?.seconds * 1000).toLocaleString()}</p>
                                </div>
                            </div>
                           </Link>
                        ))}
                         {notifications.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center">No new notifications.</p>
                         )}
                    </div>
                    <Link href="/notifications" className="text-center">
                        <Button variant="link">View all notifications</Button>
                    </Link>
                </div>
            </PopoverContent>
        </Popover>
    );
}

