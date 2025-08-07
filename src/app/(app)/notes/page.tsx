
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  File,
  ListFilter,
  MoreHorizontal,
  PlusCircle,
} from "lucide-react"
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore"

import { Badge } from "@/components/ui/badge"
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
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
import { db } from "@/lib/firebase/firebase"

interface Note {
  id: string;
  title: string;
  subject: string;
  status: string;
  date: string;
}

export default function NotesPage() {
    const [notesData, setNotesData] = useState<Note[]>([]);
    const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
    const [statusFilter, setStatusFilter] = useState("all");
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
    const router = useRouter();

    const fetchNotes = async () => {
        const notesCollection = collection(db, "notes");
        const notesSnapshot = await getDocs(notesCollection);
        const notesList = notesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
        setNotesData(notesList);
    };

    useEffect(() => {
        fetchNotes();
    }, []);

    useEffect(() => {
        if (statusFilter === "all") {
            setFilteredNotes(notesData);
        } else {
            setFilteredNotes(notesData.filter(note => note.status.toLowerCase() === statusFilter));
        }
    }, [statusFilter, notesData]);

    const handleDeleteClick = (noteId: string) => {
        setNoteToDelete(noteId);
        setShowDeleteDialog(true);
    };

    const handleDeleteConfirm = async () => {
        if (noteToDelete) {
            await deleteDoc(doc(db, "notes", noteToDelete));
            setNoteToDelete(null);
            setShowDeleteDialog(false);
            fetchNotes(); // Refresh notes list
        }
    };

  return (
    <>
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setStatusFilter('all')}>All</TabsTrigger>
          <TabsTrigger value="published" onClick={() => setStatusFilter('published')}>Published</TabsTrigger>
          <TabsTrigger value="draft" onClick={() => setStatusFilter('draft')}>Draft</TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <ListFilter className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Filter
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="published">Published</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="draft">Draft</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Export
            </span>
          </Button>
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
      <TabsContent value={statusFilter}>
        <Card>
          <CardHeader>
            <CardTitle>My Notes</CardTitle>
            <CardDescription>
              Manage your notes and study materials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
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
                    <TableCell>{note.subject}</TableCell>
                    <TableCell>
                        <Badge variant={note.status === 'Published' ? 'default' : 'secondary'}>
                            {note.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                        {new Date(note.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              Showing <strong>1-{filteredNotes.length}</strong> of <strong>{notesData.length}</strong> notes
            </div>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
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
