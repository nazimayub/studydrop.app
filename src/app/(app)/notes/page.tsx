
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  File,
  ListFilter,
  MoreHorizontal,
  PlusCircle,
  Users,
} from "lucide-react"
import { collection, getDocs, deleteDoc, doc, query, where } from "firebase/firestore"
import { useAuthState } from "react-firebase-hooks/auth"

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
import { db, auth } from "@/lib/firebase/firebase"

interface Note {
  id: string;
  title: string;
  subject: string;
  status: string;
  date: string;
  content: string;
  isPublic?: boolean;
  authorName?: string;
  authorId?: string;
}

export default function NotesPage() {
    const [user] = useAuthState(auth);
    const [myNotes, setMyNotes] = useState<Note[]>([]);
    const [communityNotes, setCommunityNotes] = useState<Note[]>([]);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
    const router = useRouter();

    const fetchNotes = async () => {
        if (!user) return;
        // Fetch user's notes
        const myNotesQuery = query(collection(db, "notes"), where("authorId", "==", user.uid));
        const myNotesSnapshot = await getDocs(myNotesQuery);
        const myNotesList = myNotesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
        setMyNotes(myNotesList);

        // Fetch community notes
        const communityNotesQuery = query(collection(db, "notes"), where("isPublic", "==", true));
        const communityNotesSnapshot = await getDocs(communityNotesQuery);
        const communityNotesList = communityNotesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
        setCommunityNotes(communityNotesList);
    };

    useEffect(() => {
        if(user) {
            fetchNotes();
        }
    }, [user]);


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

    const handleExport = (notesToExport: Note[]) => {
        const headers = ["Title", "Subject", "Status", "Date", "Content"];
        const rows = notesToExport.map(note => 
            [
                `"${note.title.replace(/"/g, '""')}"`,
                `"${note.subject.replace(/"/g, '""')}"`,
                note.status,
                new Date(note.date).toLocaleDateString(),
                `"${note.content.replace(/"/g, '""')}"`
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
    <Tabs defaultValue="my-notes">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="my-notes">My Notes</TabsTrigger>
          <TabsTrigger value="community-notes">Community Notes</TabsTrigger>
        </TabsList>
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
      <TabsContent value="my-notes">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>My Notes</CardTitle>
                <CardDescription>
                Manage your personal notes and study materials.
                </CardDescription>
            </div>
             <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => handleExport(myNotes)}>
                <File className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Export
                </span>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Created at
                  </TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myNotes.map((note) => (
                    <TableRow key={note.id}>
                    <TableCell className="font-medium">
                        <Link href={`/notes/${note.id}`} className="hover:underline">{note.title}</Link>
                    </TableCell>
                    <TableCell>{note.subject}</TableCell>
                     <TableCell>
                        <Badge variant={note.isPublic ? 'default' : 'secondary'}>
                            {note.isPublic ? 'Public' : 'Private'}
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
              Showing <strong>{myNotes.length}</strong> of your notes.
            </div>
          </CardFooter>
        </Card>
      </TabsContent>
      <TabsContent value="community-notes">
        <Card>
          <CardHeader>
            <CardTitle>Community Notes</CardTitle>
            <CardDescription>
              Explore notes shared by other students.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Created at
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {communityNotes.map((note) => (
                    <TableRow key={note.id}>
                    <TableCell className="font-medium">
                        <Link href={`/notes/${note.id}`} className="hover:underline">{note.title}</Link>
                    </TableCell>
                    <TableCell>
                         <Link href={`/users/${note.authorId}`} className="hover:underline">{note.authorName}</Link>
                    </TableCell>
                    <TableCell>{note.subject}</TableCell>
                    <TableCell className="hidden md:table-cell">
                        {new Date(note.date).toLocaleDateString()}
                    </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              Showing <strong>{communityNotes.length}</strong> public notes.
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
