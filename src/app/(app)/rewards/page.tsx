
"use client"
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit, doc, getDoc, collectionGroup, where, runTransaction } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { Award, Star, Trophy, Palette } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface UserData {
    id: string;
    firstName: string;
    lastName: string;
    points: number;
    photoURL?: string;
    unlockedThemes?: string[];
    activeTheme?: string;
}

interface Badge {
    name: string;
    icon: React.ElementType;
    description: string;
    achieved: boolean;
    progress?: number;
    goal: number;
}

interface Theme {
    id: string;
    name: string;
    cost: number;
    className: string;
    description: string;
}

const THEMES: Theme[] = [
    { id: 'default', name: 'Default', cost: 0, className: '', description: 'The standard profile theme.' },
    { id: 'sunset', name: 'Sunset', cost: 100, className: 'theme-sunset', description: 'A warm theme with orange and purple hues.' },
    { id: 'forest', name: 'Forest', cost: 150, className: 'theme-forest', description: 'A calming theme with shades of green.' },
    { id: 'ocean', name: 'Ocean', cost: 200, className: 'theme-ocean', description: 'A cool theme with deep blue colors.' },
];

export default function RewardsPage() {
    const [user] = auth ? useAuthState(auth) : [null];
    const [currentUserData, setCurrentUserData] = useState<UserData | null>(null);
    const [leaderboard, setLeaderboard] = useState<UserData[]>([]);
    const [badges, setBadges] = useState<Badge[]>([]);
    const { toast } = useToast();
    
    const fetchUserData = async () => {
        if (!user || !db) return;

        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            setCurrentUserData({ id: user.uid, ...userDocSnap.data() } as UserData);
        }

        const notesSnapshot = await getDocs(query(collection(db, "notes"), where("authorId", "==", user.uid)));
        const userNotesCount = notesSnapshot.size;

        const questionsSnapshot = await getDocs(query(collection(db, "questions"), where("authorId", "==", user.uid)));
        const userQuestionsCount = questionsSnapshot.size;

        const answersSnapshot = await getDocs(query(collectionGroup(db, 'answers'), where("authorId", "==", user.uid)));
        const userAnswerCount = answersSnapshot.size;

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
        if (!db) return;
        try {
            const usersCollection = collection(db, "users");
            const q = query(usersCollection, orderBy("points", "desc"), limit(10));
            const querySnapshot = await getDocs(q);
            const leaderboardData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
            setLeaderboard(leaderboardData);
        } catch (error) {
            console.error("Error fetching leaderboard: ", error);
            // This might be a permission error if rules are not set correctly.
            // A toast is shown in the main fetch function.
        }
    };
    
    useEffect(() => {
        const fetchAllData = async () => {
            await fetchLeaderboard();
            if (user) {
                await fetchUserData();
            }
        }
        fetchAllData().catch(err => {
            if ((err as any).code === 'permission-denied') {
                toast({
                    variant: "destructive",
                    title: "Permissions Error",
                    description: "Could not load leaderboard data due to permissions."
                });
            }
        });
    }, [user]);

    const handleUnlockTheme = async (theme: Theme) => {
        if (!user || !currentUserData || !db) return;

        if (currentUserData.points < theme.cost) {
            toast({ variant: 'destructive', title: 'Not enough points!' });
            return;
        }

        const userRef = doc(db, 'users', user.uid);
        try {
            await runTransaction(db, async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) throw 'User does not exist!';

                const newPoints = userDoc.data().points - theme.cost;
                const newUnlockedThemes = [...(userDoc.data().unlockedThemes || []), theme.id];
                
                transaction.update(userRef, {
                    points: newPoints,
                    unlockedThemes: newUnlockedThemes,
                });
            });
            
            toast({ title: 'Theme Unlocked!', description: `You can now use the ${theme.name} theme on your profile.` });
            await fetchUserData(); // Re-fetch to update UI
        } catch (error) {
            console.error('Error unlocking theme:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not unlock theme.' });
        }
    };
    
    const handleApplyTheme = async (themeId: string) => {
        if (!user || !db) return;
        try {
            const userRef = doc(db, 'users', user.uid);
            await runTransaction(db, async (transaction) => {
                transaction.update(userRef, { activeTheme: themeId });
            });
            toast({ title: 'Theme Applied!', description: 'Your profile has been updated.' });
            await fetchUserData(); // Re-fetch to update UI
        } catch (error) {
            console.error('Error applying theme:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not apply theme.' });
        }
    };

  return (
    <div className="grid gap-6">
       <div>
            <h1 className="text-3xl font-bold font-headline">Rewards</h1>
            <p className="text-muted-foreground">Earn points and badges for your contributions.</p>
        </div>
        <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <CardTitle>Your Progress</CardTitle>
                <div className="flex items-center gap-2 font-bold text-2xl text-primary">
                    <Award className="h-6 w-6" />
                    <span>{(currentUserData?.points || 0).toLocaleString()} Points</span>
                </div>
            </CardHeader>
        </Card>
        <Tabs defaultValue="badges">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="badges">Badges</TabsTrigger>
                <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
                <TabsTrigger value="themes">Profile Themes</TabsTrigger>
            </TabsList>
            <TabsContent value="badges">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {badges.map(badge => (
                        <Card key={badge.name} className={badge.achieved ? 'border-primary' : ''}>
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    <badge.icon className={`h-8 w-8 ${badge.achieved ? 'text-primary' : 'text-muted-foreground'}`} />
                                    <div>
                                        <CardTitle>{badge.name}</CardTitle>
                                        <CardDescription>{badge.description}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            {!badge.achieved && badge.progress !== undefined && (
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
                        <div className="overflow-x-auto">
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
                                        <TableRow key={entry.id} className={entry.id === user?.uid ? 'bg-secondary' : ''}>
                                            <TableCell className="font-medium text-lg">{index + 1}</TableCell>
                                            <TableCell>
                                                <Link href={`/users/${entry.id}`} className="flex items-center gap-2 hover:underline">
                                                    <Avatar>
                                                        <AvatarImage src={entry.photoURL} />
                                                        <AvatarFallback>{`${entry.firstName?.charAt(0) || ''}${entry.lastName?.charAt(0) || ''}`}</AvatarFallback>
                                                    </Avatar>
                                                    <span>{entry.id === user?.uid ? 'You' : `${entry.firstName} ${entry.lastName}`}</span>
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">{entry.points.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="themes">
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {THEMES.map(theme => {
                        const isUnlocked = currentUserData?.unlockedThemes?.includes(theme.id) || theme.cost === 0;
                        const isActive = currentUserData?.activeTheme === theme.id;
                        return (
                            <Card key={theme.id} className={cn("flex flex-col", isActive && "border-primary")}>
                                <CardHeader>
                                     <div className="flex items-center justify-between">
                                        <CardTitle>{theme.name}</CardTitle>
                                        <div className={cn("h-8 w-8 rounded-full", theme.className)}></div>
                                     </div>
                                    <CardDescription>{theme.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    {isUnlocked ? (
                                        <div className="text-sm font-semibold text-green-600">Unlocked</div>
                                    ) : (
                                        <div className="flex items-center gap-1 text-sm font-semibold">
                                            <Award className="h-4 w-4" />
                                            {theme.cost.toLocaleString()} Points
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter>
                                    {isUnlocked ? (
                                        <Button
                                            className="w-full"
                                            variant={isActive ? "secondary" : "default"}
                                            onClick={() => handleApplyTheme(theme.id)}
                                            disabled={isActive}
                                        >
                                            {isActive ? 'Active' : 'Apply Theme'}
                                        </Button>
                                    ) : (
                                        <Button
                                            className="w-full"
                                            onClick={() => handleUnlockTheme(theme)}
                                            disabled={(currentUserData?.points || 0) < theme.cost}
                                        >
                                            Unlock
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            </TabsContent>
        </Tabs>
    </div>
  )
}

    