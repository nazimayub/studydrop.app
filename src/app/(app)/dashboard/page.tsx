
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
import { collection, getDocs, limit, orderBy, query, getDoc, doc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

interface RecentActivity {
    id: string;
    type: 'Note' | 'Question';
    title: string;
    author: string;
    date: any;
}

export default function Dashboard() {
  const [user] = useAuthState(auth);
  const [stats, setStats] = useState({ notes: 0, questions: 0, answers: 0, points: 0 });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Notes
      const notesCollection = collection(db, "notes");
      const notesSnapshot = await getDocs(notesCollection);
      const notesCount = notesSnapshot.size;
      const notesQuery = query(notesCollection, orderBy("date", "desc"), limit(3));
      const recentNotes = (await getDocs(notesQuery)).docs.map(doc => ({
        id: doc.id,
        type: 'Note' as const,
        title: doc.data().title,
        author: doc.data().authorName,
        date: doc.data().date
      }));

      // Fetch Questions and Answers
      const questionsCollection = collection(db, "questions");
      const questionsSnapshot = await getDocs(questionsCollection);
      const questionsCount = questionsSnapshot.size;
      let answersCount = 0;
      for (const questionDoc of questionsSnapshot.docs) {
          const answersSnapshot = await getDocs(collection(db, "questions", questionDoc.id, "answers"));
          answersCount += answersSnapshot.size;
      }

      const questionsQuery = query(questionsCollection, orderBy("date", "desc"), limit(3));
      const recentQuestions = (await getDocs(questionsQuery)).docs.map(doc => ({
        id: doc.id,
        type: 'Question' as const,
        title: doc.data().title,
        author: doc.data().author,
        date: doc.data().date?.toDate() || new Date(doc.data().date)
      }));

      // Combine and sort activities
      const combinedActivity = [...recentNotes, ...recentQuestions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
      
      setRecentActivity(combinedActivity);

      let userPoints = 0;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            userPoints = userDoc.data().points || 0;
        }
      }

      setStats({ notes: notesCount, questions: questionsCount, answers: answersCount, points: userPoints });
    };

    fetchData();
  }, [user]);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Notes Created
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.notes}</div>
              <p className="text-xs text-muted-foreground">
                Total notes created
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Questions Asked
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.questions}</div>
              <p className="text-xs text-muted-foreground">
                Total questions asked
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Answers Provided</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.answers}</div>
              <p className="text-xs text-muted-foreground">
                Total answers provided
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
                +150 this week
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-2">
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Recent notes and questions from your network.
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
                            <div className="font-medium">{activity.author}</div>
                        </TableCell>
                        <TableCell>
                            <div className="hidden text-sm text-muted-foreground md:inline">
                                {activity.title}
                            </div>
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
