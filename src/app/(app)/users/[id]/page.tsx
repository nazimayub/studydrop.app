
"use client"
import { useEffect, useState } from 'react';
import { doc, getDoc, collection, query, where, getDocs, collectionGroup, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, MessageSquare, Users, Award } from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
    firstName: string;
    lastName: string;
    email: string;
    bio: string;
    photoURL: string;
    points: number;
}

interface UserStats {
    notes: number;
    questions: number;
    answers: number;
}

interface Activity {
    id: string;
    type: 'Note' | 'Question';
    title: string;
    date: any;
    url: string;
}

export default function UserProfilePage({ params }: { params: { id: string } }) {
    const { id } = params;
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [userStats, setUserStats] = useState<UserStats>({ notes: 0, questions: 0, answers: 0 });
    const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            try {
                const userDocRef = doc(db, 'users', id);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    setUserProfile(userDocSnap.data() as UserProfile);

                    // Fetch stats
                    const notesQuery = query(collection(db, "notes"), where("authorId", "==", id), where("isPublic", "==", true));
                    const notesSnapshot = await getDocs(notesQuery);
                    
                    const questionsQuery = query(collection(db, "questions"), where("authorId", "==", id));
                    const questionsSnapshot = await getDocs(questionsQuery);
                    
                    const answersQuery = query(collectionGroup(db, 'answers'), where("authorId", "==", id));
                    const answersSnapshot = await getDocs(answersQuery);

                    setUserStats({
                        notes: notesSnapshot.size,
                        questions: questionsSnapshot.size,
                        answers: answersSnapshot.size,
                    });

                    // Fetch recent activity
                    const userNotesQuery = query(collection(db, "notes"), where("authorId", "==", id), where("isPublic", "==", true), orderBy("date", "desc"), limit(5));
                    const userQuestionsQuery = query(collection(db, "questions"), where("authorId", "==", id), orderBy("date", "desc"), limit(5));
                    
                    const userNotesSnapshot = await getDocs(userNotesQuery);
                    const userQuestionsSnapshot = await getDocs(userQuestionsQuery);

                    const userNotes = userNotesSnapshot.docs.map(d => ({...d.data(), id: d.id, type: 'Note', url: `/notes/${d.id}` } as Activity));
                    const userQuestions = userQuestionsSnapshot.docs.map(d => ({...d.data(), id: d.id, type: 'Question', url: `/forum/${d.id}` } as Activity));
                    
                    const combinedActivity = [...userNotes, ...userQuestions]
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .slice(0, 5);

                    setRecentActivity(combinedActivity);

                } else {
                    setUserProfile(null);
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchUserData();
        }
    }, [id]);

    const getFallback = () => {
        if (userProfile?.firstName && userProfile?.lastName) {
            return `${userProfile.firstName[0]}${userProfile.lastName[0]}`;
        }
        return 'U';
    }

    if (loading) {
        return <div>Loading profile...</div>;
    }

    if (!userProfile) {
        return <div>User not found.</div>;
    }

    return (
        <div className="grid gap-8">
            <Card>
                <CardHeader className="flex flex-col md:flex-row items-center gap-6">
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={userProfile.photoURL} />
                        <AvatarFallback>{getFallback()}</AvatarFallback>
                    </Avatar>
                    <div className="text-center md:text-left">
                        <CardTitle className="text-3xl font-headline">{userProfile.firstName} {userProfile.lastName}</CardTitle>
                        <CardDescription className="mt-1">{userProfile.email}</CardDescription>
                        <p className="mt-4 text-muted-foreground max-w-prose">{userProfile.bio || 'No bio provided.'}</p>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Notes Created</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{userStats.notes}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Questions Asked</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{userStats.questions}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Answers Provided</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{userStats.answers}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Points Earned</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{userProfile.points.toLocaleString()}</div>
                    </CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    {recentActivity.length > 0 ? (
                        <ul className="space-y-4">
                            {recentActivity.map(activity => (
                                <li key={activity.id} className="flex items-center justify-between">
                                    <div>
                                        <span className="font-semibold">{activity.type}: </span>
                                        <Link href={activity.url} className="text-primary hover:underline">
                                            {activity.title}
                                        </Link>
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                        {activity.date && new Date(activity.date).toLocaleDateString()}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground">No recent activity.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

    