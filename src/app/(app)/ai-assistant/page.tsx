
"use client"
import { useState, ChangeEvent } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { File as FileIcon, X, Lightbulb } from "lucide-react";
import Image from "next/image";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function AiAssistantPage() {
    const [text, setText] = useState("");
    const [attachment, setAttachment] = useState<File | null>(null);
    const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > MAX_FILE_SIZE) {
                alert(`File too large. Max size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
                return;
            }
            setAttachment(file);
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => setAttachmentPreview(reader.result as string);
                reader.readAsDataURL(file);
            } else {
                setAttachmentPreview('file');
            }
        }
    };

    const handleSubmit = async () => {
        if (!text.trim() && !attachment) {
            alert("Please provide some text or an attachment.");
            return;
        }
        setIsLoading(true);
        setResult(null);

        // Simulate AI processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        // This is where you would replace with the content you want to provide
        const aiResponse = `
### Enhanced Notes:

**Original Idea:** "mitochondria is the powerhouse of the cell"

**AI Enhancement:**
The mitochondrion is a double-membraned organelle found in most eukaryotic organisms. It's often called the "powerhouse of the cell" because it generates most of the cell's supply of adenosine triphosphate (ATP), used as a source of chemical energy.

**Key Functions:**
- **Cellular Respiration:** Converts glucose and oxygen into ATP.
- **Heat Production:** Plays a role in thermogenesis.
- **Calcium Homeostasis:** Helps regulate the concentration of calcium ions within the cell.

**Structure:**
- **Outer membrane:** Porous outer layer.
- **Inner membrane:** Folded into cristae, where the electron transport chain takes place.
- **Matrix:** The space within the inner membrane, containing mitochondrial DNA and ribosomes.

### Practice Questions:

1.  What are the three primary functions of the mitochondria?
2.  Describe the role of the inner mitochondrial membrane in ATP synthesis.
3.  Why is the mitochondrion's double-membraned structure important for its function?
        `;

        setResult(aiResponse);
        setIsLoading(false);
    };


    return (
        <div className="grid gap-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">AI Assistant</h1>
                <p className="text-muted-foreground">Supercharge your notes and create practice questions.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Note Enhancer</CardTitle>
                    <CardDescription>Enter your notes or upload a document/image, and the AI will enhance them and generate practice questions.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                     <Textarea
                        placeholder="Paste your notes here..."
                        rows={10}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                     <div className="grid gap-2">
                        <label htmlFor="attachment">Or upload an attachment</label>
                        <Input id="attachment" type="file" onChange={handleFileChange} />
                         {attachmentPreview && (
                            <div className="mt-4 p-2 border rounded-md relative w-fit">
                                {attachmentPreview === 'file' ? (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
                                        <FileIcon className="h-10 w-10" />
                                        <span className="font-semibold">{attachment?.name}</span>
                                    </div>
                                ) : (
                                    <Image src={attachmentPreview} alt="Attachment preview" width={200} height={200} className="rounded-md object-cover" />
                                )}
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                    onClick={() => {
                                        setAttachment(null);
                                        setAttachmentPreview(null);
                                        (document.getElementById('attachment') as HTMLInputElement).value = '';
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter>
                    <LoadingButton loading={isLoading} onClick={handleSubmit}>
                        <Lightbulb className="mr-2 h-4 w-4" />
                        Enhance Notes
                    </LoadingButton>
                </CardFooter>
            </Card>

            {result && (
                <Card>
                    <CardHeader>
                        <CardTitle>AI Enhanced Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div
                            className="prose dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, '<br />') }}
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
