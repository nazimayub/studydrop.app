import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export default function NewQuestionPage() {
    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Ask a New Question</CardTitle>
                    <CardDescription>Fill out the form below to post your question to the forum.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Question / Title</Label>
                        <Input id="title" placeholder="What is your question?" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="tags">Tags</Label>
                        <Input id="tags" placeholder="e.g. physics, javascript, history" />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" placeholder="Add more details about your question..." rows={10} />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="anonymous" />
                        <Label htmlFor="anonymous">Post anonymously</Label>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button>Post Question</Button>
                </CardFooter>
            </Card>
        </div>
    )
}
