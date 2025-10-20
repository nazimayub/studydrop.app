
"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { courses } from "@/lib/courses";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ActivityTag {
  class: string;
  topic: string;
}

interface Activity {
    id: string;
    type: 'Note' | 'Question';
    title: string;
    author: string;
    authorId?: string;
    date: Date;
    tags: ActivityTag[];
    url: string;
}

export default function ActivityPage() {
    const [allActivity, setAllActivity] = useState<Activity[]>([]);
    const [filteredActivity, setFilteredActivity] = useState<Activity[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [activityType, setActivityType] = useState<'all' | 'notes' | 'questions'>('all');
    
    const [selectedClass, setSelectedClass] = useState("");
    const [availableUnits, setAvailableUnits] = useState<string[]>([]);
    const [selectedUnit, setSelectedUnit] = useState("");
    const [activeFilters, setActiveFilters] = useState<ActivityTag[]>([]);


    useEffect(() => {
       const fetchAllActivity = async () => {
            const toDate = (firebaseDate: any): Date => {
                if (!firebaseDate) return new Date();
                if (firebaseDate.toDate) return firebaseDate.toDate();
                if (typeof firebaseDate === 'string') return new Date(firebaseDate);
                if (firebaseDate.seconds) return new Date(firebaseDate.seconds * 1000);
                return new Date();
            };

            const notesCollection = collection(db, "notes");
            const recentNotesQuery = query(notesCollection, where("isPublic", "==", true), orderBy("date", "desc"));
            const recentNotesSnapshot = await getDocs(recentNotesQuery);
            const recentNotes: Activity[] = recentNotesSnapshot.docs.map(doc => ({
                id: doc.id,
                type: 'Note' as const,
                title: doc.data().title,
                author: doc.data().authorName,
                authorId: doc.data().authorId,
                date: toDate(doc.data().date),
                tags: doc.data().tags || [],
                url: `/notes/${doc.id}`,
            }));

            const questionsCollection = collection(db, "questions");
            const recentQuestionsQuery = query(questionsCollection, orderBy("date", "desc"));
            const recentQuestionsSnapshot = await getDocs(recentQuestionsQuery);
            const recentQuestions: Activity[] = recentQuestionsSnapshot.docs.map(doc => ({
                id: doc.id,
                type: 'Question' as const,
                title: doc.data().title,
                author: doc.data().author,
                authorId: doc.data().authorId,
                date: toDate(doc.data().date),
                tags: doc.data().tags || [],
                url: `/forum/${doc.id}`
            }));

            const combinedActivity = [...recentNotes, ...recentQuestions]
                .sort((a, b) => b.date.getTime() - a.date.getTime());
            
            setAllActivity(combinedActivity);
        };
        fetchAllActivity();
    }, []);

    useEffect(() => {
        let activity = allActivity;

        if (activityType !== 'all') {
            activity = activity.filter(item => item.type.toLowerCase().startsWith(activityType.slice(0, -1)));
        }

        if (searchTerm) {
            activity = activity.filter(item => item.title.toLowerCase().includes(searchTerm.toLowerCase()));
        }
       if (activeFilters.length > 0) {
            activity = activity.filter(item => {
                return activeFilters.every(filter => 
                    item.tags?.some(tag => tag.class === filter.class && tag.topic === filter.topic)
                );
            });
        }
        setFilteredActivity(activity);
    }, [searchTerm, activeFilters, allActivity, activityType]);
    
     useEffect(() => {
        if (selectedClass) {
            const course = courses.find(c => c.name === selectedClass);
            setAvailableUnits(course ? course.units : []);
            setSelectedUnit("");
        } else {
            setAvailableUnits([]);
        }
    }, [selectedClass]);
    
    const handleAddFilter = () => {
        if (selectedClass && selectedUnit) {
            const newFilter = { class: selectedClass, topic: selectedUnit };
             if (!activeFilters.some(f => f.class === newFilter.class && f.topic === newFilter.topic)) {
                setActiveFilters([...activeFilters, newFilter]);
            }
        }
        setSelectedClass("");
        setSelectedUnit("");
    };

    const handleRemoveFilter = (filterToRemove: ActivityTag) => {
        setActiveFilters(activeFilters.filter(f => !(f.class === filterToRemove.class && f.topic === filterToRemove.topic)));
    };
    
    const UserLink = ({ authorId, children }: { authorId?: string, children: React.ReactNode }) => {
        return authorId ? <Link href={`/users/${authorId}`} className="hover:underline">{children}</Link> : <>{children}</>;
    };

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold font-headline">Community Activity</h1>
            <p className="text-muted-foreground">The latest notes and questions from the community.</p>
        </div>
      </div>
      <Card>
          <CardHeader>
            <Tabs defaultValue="all" onValueChange={(value) => setActivityType(value as any)}>
                <TabsList className="mb-4">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                    <TabsTrigger value="questions">Questions</TabsTrigger>
                </TabsList>
            </Tabs>
             <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <Input placeholder="Search by title..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by Class" />
                        </SelectTrigger>
                        <SelectContent>
                            {courses.map(course => (
                                <SelectItem key={course.name} value={course.name}>{course.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                     <Select value={selectedUnit} onValueChange={setSelectedUnit} disabled={!selectedClass}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by Unit" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableUnits.map(unit => (
                                <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleAddFilter} disabled={!selectedUnit}>Add Filter</Button>
                </div>
              </div>
          </CardHeader>
           {activeFilters.length > 0 && (
                <CardContent className="border-t pt-4">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">Active filters:</span>
                        {activeFilters.map(tag => (
                            <Badge key={`${tag.class}-${tag.topic}`} variant="secondary">
                                {tag.class}: {tag.topic}
                                <button className="ml-1" onClick={() => handleRemoveFilter(tag)}>
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                        <Button variant="ghost" size="sm" onClick={() => setActiveFilters([])}>Clear all</Button>
                    </div>
                </CardContent>
            )}
            <CardContent className="p-0">
               <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivity.map(activity => (
                    <TableRow key={activity.id}>
                        <TableCell>
                            {activity.authorId ? (
                                 <Link href={`/users/${activity.authorId}`} className="font-medium hover:underline">{activity.author}</Link>
                            ) : (
                                <div className="font-medium">{activity.author}</div>
                            )}
                        </TableCell>
                        <TableCell>
                             <Link href={activity.url} className="font-medium hover:underline">
                                {activity.title}
                            </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(activity.tags) && activity.tags.map((tag: any, index: number) => (
                              <Badge key={index} variant="secondary">
                                {`${tag.class}: ${tag.topic}`}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                        <Badge className="text-xs" variant="outline">
                            {activity.type}
                        </Badge>
                        </TableCell>
                        <TableCell className="text-right">{activity.date.toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
             <CardFooter>
            <div className="text-xs text-muted-foreground">
              Showing <strong>{filteredActivity.length}</strong> results.
            </div>
          </CardFooter>
      </Card>
      
    </div>
  )
}
