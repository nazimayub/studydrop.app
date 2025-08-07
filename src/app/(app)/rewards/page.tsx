
"use client"
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit, doc, getDoc, collectionGroup } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { Award, Star, Trophy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserData {
    id: string;
    firstName: string;
    lastName: string;
    points: number;
    photoURL?: string;
}

interface Badge {
    name: string;
    icon: React.ElementType;
    description: string;
    achieved: boolean;
    progress?: number;
    goal: number;
}

export default function RewardsPage() {
    const [user] = useAuthState(auth);
    const [currentUserData, setCurrentUserData] = useState<UserData | null>(null);
    const [leaderboard, setLeaderboard] = useState<UserData[]>([]);
    const [badges, setBadges] = useState<Badge[]>([]);
    
    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) return;

            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                setCurrentUserData({ id: user.uid, ...userDocSnap.data() } as UserData);
            }

            const notesSnapshot = await getDocs(collection(db, "notes"));
            const userNotesCount = notesSnapshot.docs.filter(d => d.data().authorId === user.uid).length;

            const questionsSnapshot = await getDocs(collection(db, "questions"));
            const userQuestionsCount = questionsSnapshot.docs.filter(d => d.data().authorId === user.uid).length;

            const answersSnapshot = await getDocs(collectionGroup(db, 'answers'));
            const userAnswerCount = answersSnapshot.docs.filter(d => d.data().authorId === user.uid).length;

            const initialBadges: Omit<Badge, 'achieved' | 'progress'>[] = [
                { name: "First Note", icon: Star, description: "Create your first note.", goal: 1 },
                { name: "Question Starter", icon: Star, description: "Ask your first question.", goal: 1 },
                { name: "Helping Hand", icon: Star, description: "Provide your first answer.", goal: 1 },
                { name: "Note Taker Pro", icon: Trophy, description: "Create 10 notes.", goal: 10 },
                { name: "Curious Mind", icon: Trophy, description: "Ask 10 questions.", goal: 10 },
                { name: "Community Pillar", icon: Trophy, description: "Provide 10 answers.", goal: 10 },
            ];

            const calculatedBadges = initialBadges.map(b => {
                let currentProgress = 0;
                if (b.name.includes("Note")) currentProgress = userNotesCount;
                if (b.name.includes("Question")) currentProgress = userQuestionsCount;
                if (b.name.includes("Answer")) currentProgress = userAnswerCount;

                return {
                    ...b,
                    progress: Math.min((currentProgress / b.goal) * 100, 100),
                    achieved: currentProgress >= b.goal,
                }
            })
            setBadges(calculatedBadges);

        };

        const fetchLeaderboard = async () => {
            const usersCollection = collection(db, "users");
            const q = query(usersCollection, orderBy("points", "desc"), limit(10));
            const querySnapshot = await getDocs(q);
            const leaderboardData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
            setLeaderboard(leaderboardData);
        };
        
        fetchUserData();
        fetchLeaderboard();

    }, [user]);

  return (
    <div className="grid gap-6">
       <div>
            <h1 className="text-3xl font-bold font-headline">Rewards</h1>
            <p className="text-muted-foreground">Earn points and badges for your contributions.</p>
        </div>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Your Progress</CardTitle>
                <div className="flex items-center gap-2 font-bold text-2xl text-accent">
                    <Award className="h-6 w-6" />
                    <span>{currentUserData?.points.toLocaleString() || 0} Points</span>
                </div>
            </CardHeader>
        </Card>
        <Tabs defaultValue="badges">
            <TabsList>
                <TabsTrigger value="badges">Badges</TabsTrigger>
                <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            </TabsList>
            <TabsContent value="badges">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {badges.map(badge => (
                        <Card key={badge.name} className={badge.achieved ? 'bg-accent/10' : ''}>
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    <badge.icon className={`h-8 w-8 ${badge.achieved ? 'text-accent' : 'text-muted-foreground'}`} />
                                    <div>
                                        <CardTitle>{badge.name}</CardTitle>
                                        <CardDescription>{badge.description}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            {badge.progress !== undefined && (
                                <CardContent>
                                    <Progress value={badge.progress} className="h-2" />
                                </CardContent>
                            )}
                        </Card>
                    ))}
                </div>
            </TabsContent>
            <TabsContent value="leaderboard">
                <Card>
                    <CardHeader>
                        <CardTitle>Top Students</CardTitle>
                        <CardDescription>See how you rank against other students.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Rank</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead className="text-right">Points</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leaderboard.map((entry, index) => (
                                    <TableRow key={entry.id} className={entry.id === user?.uid ? 'bg-accent/10' : ''}>
                                        <TableCell className="font-medium text-lg">{index + 1}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar>
                                                    <AvatarImage src={entry.photoURL} />
                                                    <AvatarFallback>{`${entry.firstName?.charAt(0) || ''}${entry.lastName?.charAt(0) || ''}`}</AvatarFallback>
                                                </Avatar>
                                                <span>{entry.id === user?.uid ? 'You' : `${entry.firstName} ${entry.lastName}`}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">{entry.points.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  )
}
