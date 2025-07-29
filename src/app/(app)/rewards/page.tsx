import { Award, Star, Trophy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const badges = [
  { name: "First Note", icon: Star, description: "Create your first note.", achieved: true },
  { name: "Question Starter", icon: Star, description: "Ask your first question.", achieved: true },
  { name: "Helping Hand", icon: Star, description: "Provide your first answer.", achieved: false },
  { name: "Note Taker Pro", icon: Trophy, description: "Create 10 notes.", achieved: true, progress: 100 },
  { name: "Curious Mind", icon: Trophy, description: "Ask 10 questions.", achieved: false, progress: 30 },
  { name: "Community Pillar", icon: Trophy, description: "Provide 10 answers.", achieved: false, progress: 10 },
];

const leaderboard = [
  { rank: 1, user: "Charlie Brown", points: 5280, avatar: "https://placehold.co/40x40.png", fallback: "CB" },
  { rank: 2, user: "Alice Johnson", points: 4150, avatar: "https://placehold.co/40x40.png", fallback: "AJ" },
  { rank: 3, user: "You", points: 1250, avatar: "https://placehold.co/40x40.png", fallback: "SB" },
  { rank: 4, user: "Bob Williams", points: 980, avatar: "https://placehold.co/40x40.png", fallback: "BW" },
];

export default function RewardsPage() {
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
                    <span>1,250 Points</span>
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
                                {leaderboard.map(entry => (
                                    <TableRow key={entry.rank} className={entry.user === 'You' ? 'bg-accent/10' : ''}>
                                        <TableCell className="font-medium text-lg">{entry.rank}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar>
                                                    <AvatarImage src={entry.avatar} />
                                                    <AvatarFallback>{entry.fallback}</AvatarFallback>
                                                </Avatar>
                                                <span>{entry.user}</span>
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
