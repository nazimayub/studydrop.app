import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp } from "lucide-react";

const post = {
    id: "1",
    title: "How does the Heinsenberg Uncertainty Principle work in practice?",
    author: "Alice Johnson",
    avatar: "https://placehold.co/40x40.png",
    fallback: "AJ",
    date: "2 days ago",
    content: "I'm having trouble understanding the practical implications of the Heisenberg Uncertainty Principle. I get the basic idea that you can't know both the position and momentum of a particle with perfect accuracy, but how does this manifest in real-world experiments or technology? Are there any simple examples that illustrate this concept well?",
};

const answers = [
    {
        id: "1",
        author: "Bob Williams",
        avatar: "https://placehold.co/40x40.png",
        fallback: "BW",
        date: "1 day ago",
        content: "A great example is in scanning tunneling microscopes (STMs). To get a very precise image (position) of an atom, the microscope's tip has to interact with it, which involves transferring momentum. This interaction inherently changes the atom's momentum, making it uncertain. So, the act of observing the position disturbs the momentum, exactly as the principle predicts.",
        upvotes: 22,
    },
    {
        id: "2",
        author: "Charlie Brown",
        avatar: "https://placehold.co/40x40.png",
        fallback: "CB",
        date: "22 hours ago",
        content: "Think about trying to measure the position of an electron with a photon of light. To get a precise measurement, you need a short-wavelength photon. But short-wavelength photons have high energy and momentum. When this photon hits the electron, it transfers a lot of momentum to it in an unpredictable way, making the electron's momentum uncertain. If you use a long-wavelength (low momentum) photon, you don't disturb the electron's momentum much, but your measurement of its position becomes fuzzy. You can't win!",
        upvotes: 48,
    }
];

export default function ForumPostPage({ params }: { params: { id: string } }) {
    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">{post.title}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={post.avatar} />
                            <AvatarFallback>{post.fallback}</AvatarFallback>
                        </Avatar>
                        <span>{post.author}</span>
                        <span>&middot;</span>
                        <span>{post.date}</span>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="whitespace-pre-wrap">{post.content}</p>
                </CardContent>
            </Card>

            <h2 className="text-2xl font-bold font-headline">{answers.length} Answers</h2>

            <div className="grid gap-4">
                {answers.map(answer => (
                    <Card key={answer.id}>
                        <CardHeader className="flex flex-row items-start gap-4">
                             <Avatar>
                                <AvatarImage src={answer.avatar} />
                                <AvatarFallback>{answer.fallback}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">{answer.author}</span>
                                    <span className="text-sm text-muted-foreground">&middot; {answer.date}</span>
                                </div>
                                <p className="mt-2">{answer.content}</p>
                            </div>
                        </CardHeader>
                         <CardFooter className="flex justify-end">
                            <Button variant="ghost" size="sm">
                                <ThumbsUp className="mr-2 h-4 w-4" />
                                {answer.upvotes}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Your Answer</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea placeholder="Type your answer here." rows={5} />
                </CardContent>
                <CardFooter>
                    <Button>Post Answer</Button>
                </CardFooter>
            </Card>
        </div>
    )
}
