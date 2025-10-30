
"use client"

import { useEffect, useState } from "react";
import Link from "next/link"
import {
  Activity,
  ArrowUpRight,
  Award,
  BookOpen,
  MessageSquare,
  Users,
  Database,
} from "lucide-react"
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  orderBy,
  doc,
  getDoc,
  collectionGroup,
  onSnapshot
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge";
import { UserNav } from "@/components/app/user-nav";
import { seedDatabase } from "@/lib/seed";
import { useToast } from "@/hooks/use-toast";
import { LoadingButton } from "@/components/ui/loading-button";


interface NoteTag {
  class: string;
  topic: string;
}

interface RecentActivity {
    id: string;
    type: 'Note' | 'Question';
    title: string;
    author: string;
    authorId?: string;
    date: Date;
    tags?: NoteTag[];
}

export default function Dashboard() {
  const [user] = auth ? useAuthState(auth) : [null];
  const [stats, setStats] = useState({ notes: 0, questions: 0, answers: 0, points: 0 });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [enrolledClasses, setEnrolledClasses] = useState<string[]>([]);
  const [userName, setUserName] = useState('');
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    if (!user || !db) return;
    
    const userDocRef = doc(db, "users", user.uid);

    const unsubscribes: (() => void)[] = [];

    // Real-time listener for user data (points, classes, name)
    const userUnsub = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const userData = docSnap.data();
            setStats(prev => ({ ...prev, points: userData.points || 0 }));
            const userEnrolledClasses = userData.enrolledClasses || [];
            setEnrolledClasses(userEnrolledClasses);
            setUserName(userData.firstName || user.displayName?.split(' ')[0] || 'User');
            fetchFilteredActivity(userEnrolledClasses);
        }
    });
    unsubscribes.push(userUnsub);

    const toDate = (firebaseDate: any): Date => {
        if (!firebaseDate) return new Date();
        if (firebaseDate.toDate) return firebaseDate.toDate();
        if (typeof firebaseDate === 'string') return new Date(firebaseDate);
        if (firebaseDate.seconds) return new Date(firebaseDate.seconds * 1000);
        return new Date();
    };

    const fetchFilteredActivity = async (userEnrolledClasses: string[]) => {
        const notesCollection = collection(db, "notes");
        const notesSnapshot = await getDocs(query(notesCollection, where("isPublic", "==", true), orderBy("date", "desc"), limit(10)));
        const recentNotes = notesSnapshot.docs
            .map(doc => ({
                id: doc.id,
                type: 'Note' as const,
                title: doc.data().title,
                author: doc.data().authorName,
                authorId: doc.data().authorId,
                date: toDate(doc.data().date),
                tags: doc.data().tags || [],
            }))
            .filter(note => {
                if (userEnrolledClasses.length === 0) return true;
                return note.tags?.some(tag => userEnrolledClasses.includes(tag.class));
            });

        const questionsCollection = collection(db, "questions");
        const questionsSnapshot = await getDocs(query(questionsCollection, orderBy("date", "desc"), limit(10)));
        const recentQuestions = questionsSnapshot.docs
            .map(doc => ({
                id: doc.id,
                type: 'Question' as const,
                title: doc.data().title,
                author: doc.data().author,
                authorId: doc.data().authorId,
                date: toDate(doc.data().date),
                tags: doc.data().tags || [],
            }))
            .filter(question => {
                if (userEnrolledClasses.length === 0) return true;
                return question.tags?.some(tag => userEnrolledClasses.includes(tag.class));
            });

        const combinedActivity = [...recentNotes, ...recentQuestions]
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, 10);
        
        setRecentActivity(combinedActivity);
    };

    // Real-time listeners for stats
    const notesQuery = query(collection(db, "notes"), where("authorId", "==", user.uid));
    unsubscribes.push(onSnapshot(notesQuery, (snapshot) => {
        setStats(prev => ({ ...prev, notes: snapshot.size }));
    }));

    const questionsQuery = query(collection(db, "questions"), where("authorId", "==", user.uid));
    unsubscribes.push(onSnapshot(questionsQuery, (snapshot) => {
        setStats(prev => ({ ...prev, questions: snapshot.size }));
    }));
    
    const answersQuery = query(collectionGroup(db, 'answers'), where("authorId", "==", user.uid));
    unsubscribes.push(onSnapshot(answersQuery, (snapshot) => {
        setStats(prev => ({ ...prev, answers: snapshot.size }));
    }));

    return () => unsubscribes.forEach(unsub => unsub());
    
  }, [user]);

  const handleSeedDatabase = async () => {
    if (!db) return;
    setIsSeeding(true);
    try {
        await seedDatabase(db);
        toast({
            title: "Database Seeded!",
            description: "20 new notes and 20 new questions have been created."
        })
    } catch(error) {
        console.error("Error seeding database: ", error);
        toast({
            variant: "destructive",
            title: "Seeding Failed",
            description: "Could not seed the database. Check console for errors."
        })
    } finally {
        setIsSeeding(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">Welcome back, {userName}!</h1>
            <div className="ml-auto flex items-center gap-2">
                <Link href="/notes/new">
                  <Button size="sm" className="h-8 gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      Add Note
                      </span>
                  </Button>
                </Link>
                <Link href="/forum/new">
                   <Button size="sm" variant="outline" className="h-8 gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      Ask Question
                      </span>
                  </Button>
                </Link>
            </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                Your Notes
                </CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.notes}</div>
                <p className="text-xs text-muted-foreground">
                Total notes you've created
                </p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                Your Questions
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.questions}</div>
                <p className="text-xs text-muted-foreground">
                Total questions you've asked
                </p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Your Answers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.answers}</div>
                <p className="text-xs text-muted-foreground">
                Total answers you've provided
                </p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Points Earned</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.points.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                Keep contributing to earn more!
                </p>
            </CardContent>
            </Card>
        </div>
        <Card>
        <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
            <CardTitle>Catch Up Feed</CardTitle>
            <CardDescription>
                {enrolledClasses.length > 0
                ? "Recent notes and questions from your classes."
                : "Recent notes and questions from all classes. Add classes in your account to filter this feed."
                }
            </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
            <Link href="/activity">
                View All
                <ArrowUpRight className="h-4 w-4" />
            </Link>
            </Button>
        </CardHeader>
        <CardContent>
            <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead className="hidden sm:table-cell">Tags</TableHead>
                    <TableHead className="hidden sm:table-cell">Type</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {recentActivity.map(activity => (
                    <TableRow key={activity.id}>
                        <TableCell>
                            {activity.authorId ? (
                                <Link href={`/users/${activity.authorId}`} className="font-medium hover:underline">{activity.author}</Link>
                            ) : (
                                <div className="font-medium">{activity.author}</div>
                            )}
                        </TableCell>
                        <TableCell>
                            <Link href={activity.type === 'Note' ? `/notes/${activity.id}` : `/forum/${activity.id}`} className="font-medium hover:underline">
                                {activity.title}
                            </Link>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                        <div className="flex flex-wrap gap-1">
                            {activity.tags?.map((tag, index) => (
                            <Badge key={index} variant="secondary">
                                {`${tag.class}: ${tag.topic}`}
                            </Badge>
                            ))}
                        </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                        <Badge className="text-xs" variant="outline">
                            {activity.type}
                        </Badge>
                        </TableCell>
                        <TableCell className="text-right">{activity.date ? activity.date.toLocaleDateString() : ''}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </div>
        </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Developer Tools</CardTitle>
                <CardDescription>Actions for development and testing purposes.</CardDescription>
            </CardHeader>
            <CardContent>
                <LoadingButton loading={isSeeding} onClick={handleSeedDatabase}>
                    <Database className="mr-2 h-4 w-4" />
                    Seed Database
                </LoadingButton>
                <p className="text-sm text-muted-foreground mt-2">
                    This will clear all notes and questions and generate 20 new fake notes and 20 fake questions.
                </p>
            </CardContent>
        </Card>
    </main>
  )
}
