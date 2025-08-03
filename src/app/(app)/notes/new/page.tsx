import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function NewNotePage() {
    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Add New Note</CardTitle>
                    <CardDescription>Fill out the form below to create a new note.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" placeholder="Note title" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input id="subject" placeholder="e.g. Physics, History" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="class">Class</Label>
                        <Input id="class" placeholder="e.g. PHYS 101, HIST 230" />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" placeholder="Write your note here..." rows={10} />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button>Create Note</Button>
                </CardFooter>
            </Card>
        </div>
    )
}
