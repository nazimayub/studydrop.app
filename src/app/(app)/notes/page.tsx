
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  File,
  MoreHorizontal,
  PlusCircle,
  X,
} from "lucide-react"
import { collection, getDocs, deleteDoc, doc, query, where, orderBy } from "firebase/firestore"
import { useAuthState } from "react-firebase-hooks/auth"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { db, auth } from "@/lib/firebase/firebase"
import { Badge } from "@/components/ui/badge"
import { courses } from "@/lib/ap-courses"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

interface NoteTag {
  class: string;
  topic: string;
}

interface Note {
  id: string;
  title: string;
  status: string;
  date: string;
  content: string;
  isPublic?: boolean;
  authorName?: string;
  authorId?: string;
  tags?: NoteTag[];
}

export default function NotesPage() {
    const [user] = useAuthState(auth);
    const [allNotes, setAllNotes] = useState<Note[]>([]);
    const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
    const router = useRouter();

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedClass, setSelectedClass] = useState("");
    const [availableUnits, setAvailableUnits] = useState<string[]>([]);
    const [selectedUnit, setSelectedUnit] = useState("");
    const [activeFilters, setActiveFilters] = useState<NoteTag[]>([]);

    const fetchNotes = async () => {
        const notesQuery = query(collection(db, "notes"), where("isPublic", "==", true), orderBy("date", "desc"));
        const notesSnapshot = await getDocs(notesQuery);
        const notesList = notesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
        setAllNotes(notesList);
        setFilteredNotes(notesList);
    };

    useEffect(() => {
        fetchNotes();
    }, []);

    useEffect(() => {
        let notes = allNotes;
        if (searchTerm) {
            notes = notes.filter(note => note.title.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        if (activeFilters.length > 0) {
            notes = notes.filter(note => 
                activeFilters.every(filter => 
                    note.tags?.some(tag => tag.class === filter.class && tag.topic === filter.topic)
                )
            );
        }
        setFilteredNotes(notes);
    }, [searchTerm, activeFilters, allNotes]);

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
            setSelectedUnit("");
        }
    };

    const handleRemoveFilter = (filterToRemove: NoteTag) => {
        setActiveFilters(activeFilters.filter(f => !(f.class === filterToRemove.class && f.topic === filterToRemove.topic)));
    };


    const handleDeleteClick = (noteId: string) => {
        setNoteToDelete(noteId);
        setShowDeleteDialog(true);
    };

    const handleDeleteConfirm = async () => {
        if (noteToDelete) {
            await deleteDoc(doc(db, "notes", noteToDelete));
            setNoteToDelete(null);
            setShowDeleteDialog(false);
            fetchNotes();
        }
    };

    const handleExport = (notesToExport: Note[]) => {
        const headers = ["Title", "Author", "Date", "Content", "Tags"];
        const rows = notesToExport.map(note => 
            [
                `"${note.title.replace(/"/g, '""')}"`,
                 `"${note.authorName?.replace(/"/g, '""')}"`,
                new Date(note.date).toLocaleDateString(),
                `"${note.content.replace(/"/g, '""')}"`,
                `"${note.tags?.map(t => `${t.class}:${t.topic}`).join(', ') || ''}"`
            ].join(',')
        );

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "notes.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

  return (
    <>
    <div className="flex items-center">
        <div className="flex-1">
            <h1 className="text-3xl font-bold font-headline">All Notes</h1>
            <p className="text-muted-foreground">Explore notes shared by the community.</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/notes/new">
            <Button size="sm" className="h-8 gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Add Note
                </span>
            </Button>
          </Link>
        </div>
      </div>
       <Card>
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <Input placeholder="Search by note title..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
          </CardHeader>
           {activeFilters.length > 0 && (
                <CardContent className="border-t pt-4">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">Active filters:</span>
                        {activeFilters.map(filter => (
                            <Badge key={`${filter.class}-${filter.topic}`} variant="secondary">
                                {filter.class}: {filter.topic}
                                <button className="ml-1" onClick={() => handleRemoveFilter(filter)}>
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
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Created at
                  </TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotes.map((note) => (
                    <TableRow key={note.id}>
                    <TableCell className="font-medium">
                        <Link href={`/notes/${note.id}`} className="hover:underline">{note.title}</Link>
                    </TableCell>
                    <TableCell>
                         <Link href={`/users/${note.authorId}`} className="hover:underline">{note.authorName}</Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {note.tags?.slice(0, 2).map(tag => (
                          <Badge key={`${tag.class}-${tag.topic}`} variant="secondary">{tag.topic}</Badge>
                        ))}
                         {note.tags && note.tags.length > 2 && (
                          <Badge variant="outline">+{note.tags.length - 2}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                        {new Date(note.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                        {user?.uid === note.authorId && (
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                aria-haspopup="true"
                                size="icon"
                                variant="ghost"
                                >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onSelect={() => router.push(`/notes/${note.id}/edit`)}>Edit</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleDeleteClick(note.id)}>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              Showing <strong>{filteredNotes.length}</strong> of <strong>{allNotes.length}</strong> public notes.
            </div>
             <div className="ml-auto">
                <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => handleExport(filteredNotes)}>
                    <File className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Export Filtered
                    </span>
                </Button>
            </div>
          </CardFooter>
        </Card>
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                note.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
