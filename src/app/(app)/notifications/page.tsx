
"use client"
import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Notification {
    id: string;
    message: string;
    link: string;
    isRead: boolean;
    date: any;
}

export default function NotificationsPage() {
    const [user] = useAuthState(auth);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        if (user) {
            const notificationsRef = collection(db, "users", user.uid, "notifications");
            const q = query(notificationsRef, orderBy("date", "desc"));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const notificationsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
                setNotifications(notificationsList);
            });
            return () => unsubscribe();
        }
    }, [user]);

    const markAllAsRead = async () => {
        if (user) {
            const unreadNotifications = notifications.filter(n => !n.isRead);
            const notificationsRef = collection(db, "users", user.uid, "notifications");
            unreadNotifications.forEach(async (notification) => {
                const notificationDoc = doc(notificationsRef, notification.id);
                await updateDoc(notificationDoc, { isRead: true });
            });
        }
    };


    return (
        <div className="grid gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Notifications</h1>
                    <p className="text-muted-foreground">Here are your latest updates.</p>
                </div>
                <Button onClick={markAllAsRead}>Mark all as read</Button>
            </div>
            <Card>
                <CardContent className="p-0">
                    {notifications.length > 0 ? (
                        notifications.map(notification => (
                             <Link key={notification.id} href={notification.link} className="block">
                                <div className={`p-4 border-b ${!notification.isRead ? 'bg-secondary' : ''} hover:bg-accent hover:text-accent-foreground`}>
                                    <p className="font-medium">{notification.message}</p>
                                    <p className="text-sm text-muted-foreground">{new Date(notification.date?.seconds * 1000).toLocaleString()}</p>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="p-6 text-center text-muted-foreground">
                            You have no notifications.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

