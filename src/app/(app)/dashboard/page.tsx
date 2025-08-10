
"use client"

import { useEffect, useState } from "react";
import Link from "next/link"
import {
  Activity,
  ArrowUpRight,
  Award,
  BookOpen,
  Menu,
  MessageSquare,
  Package2,
  Search,
  Users,
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
  collectionGroup
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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

interface RecentActivity {
    id: string;
    type: 'Note' | 'Question';
    title: string;
    author: string;
    authorId?: string;
    date: any;
}

export default function Dashboard() {
  const [user] = useAuthState(auth);
  const [stats, setStats] = useState({ notes: 0, questions: 0, answers: 0, points: 0 });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    const fetchAllActivity = async () => {
        // Fetch recent notes from all users
        const notesCollection = collection(db, "notes");
        const recentNotesQuery = query(notesCollection, orderBy("date", "desc"), limit(10));
        const recentNotes = (await getDocs(recentNotesQuery)).docs.map(doc => ({
            id: doc.id,
            type: 'Note' as const,
            title: doc.data().title,
            author: doc.data().authorName,
            authorId: doc.data().authorId,
            date: doc.data().date
        }));

        // Fetch recent questions from all users
        const questionsCollection = collection(db, "questions");
        const recentQuestionsQuery = query(questionsCollection, orderBy("date", "desc"), limit(10));
        const recentQuestions = (await getDocs(recentQuestionsQuery)).docs.map(doc => ({
            id: doc.id,
            type: 'Question' as const,
            title: doc.data().title,
            author: doc.data().author,
            authorId: doc.data().authorId,
            date: doc.data().date?.toDate() || new Date(doc.data().date)
        }));

        // Combine and sort activities
        const combinedActivity = [...recentNotes, ...recentQuestions].sort((a, b) => {
            const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
            const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
            return dateB.getTime() - dateA.getTime();
        }).slice(0, 10);
        
        setRecentActivity(combinedActivity);
    };

    const fetchUserStats = async () => {
        if (!user) return;
        
        // Fetch user-specific notes
        const notesQuery = query(collection(db, "notes"), where("authorId", "==", user.uid));
        const notesSnapshot = await getDocs(notesQuery);
        const notesCount = notesSnapshot.size;

        // Fetch user-specific questions
        const questionsQuery = query(collection(db, "questions"), where("authorId", "==", user.uid));
        const questionsSnapshot = await getDocs(questionsQuery);
        const questionsCount = questionsSnapshot.size;

        // Fetch user-specific answers
        const answersQuery = query(collectionGroup(db, 'answers'), where("authorId", "==", user.uid));
        const answersSnapshot = await getDocs(answersQuery);
        const answersCount = answersSnapshot.size;
        
        // Fetch user points
        let userPoints = 0;
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            userPoints = userDoc.data().points || 0;
        }

        setStats({ notes: notesCount, questions: questionsCount, answers: answersCount, points: userPoints });
    };

    fetchAllActivity();
    if (user) {
        fetchUserStats();
    }
  }, [user]);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
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
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-2">
                <CardTitle>Recent Community Activity</CardTitle>
                <CardDescription>
                  Recent notes and questions from all students.
                </CardDescription>
              </div>
              <Button asChild size="sm" className="ml-auto gap-1">
                <Link href="/notes">
                  View All
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Type</TableHead>
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
                             <Link href={activity.type === 'Note' ? `/notes/${activity.id}` : `/forum/${activity.id}`} className="hidden text-sm text-muted-foreground md:inline hover:underline">
                                {activity.title}
                            </Link>
                        </TableCell>
                        <TableCell>
                        <Badge className="text-xs" variant="outline">
                            {activity.type}
                        </Badge>
                        </TableCell>
                        <TableCell className="text-right">{new Date(activity.date).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
               <Link href="/notes/new">
                <Button className="w-full">Create New Note</Button>
               </Link>
               <Link href="/forum/new">
                <Button variant="outline" className="w-full">Ask a Question</Button>
               </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
