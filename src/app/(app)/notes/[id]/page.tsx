import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot } from "lucide-react"
import Link from "next/link"

export default function NoteDetailPage({ params }: { params: { id: string } }) {
  const note = {
    id: params.id,
    title: "Quantum Physics Fundamentals",
    subject: "Physics",
    date: "2023-06-23",
    content: `Quantum physics is the study of matter and energy at the most fundamental level. It aims to uncover the properties and behaviors of the very building blocks of nature.

While many quantum experiments examine very small objects, such as electrons and photons, quantum phenomena are all around us, acting on every scale. 

Key concepts in quantum physics include:
1.  **Wave-particle duality**: This principle states that every particle or quantum entity may be described as either a particle or a wave. It expresses the inability of the classical concepts "particle" or "wave" to fully describe the behavior of quantum-scale objects.
2.  **Quantization**: This is the concept that a physical quantity can have only certain discrete values. For example, the energy of an electron in an atom is quantized.
3.  **Quantum tunneling**: This is a quantum mechanical phenomenon where a wavefunction can propagate through a potential barrier. It has important applications in modern devices such as the tunnel diode.
4.  **Superposition**: This is a fundamental principle of quantum mechanics. It states that, much like waves in classical physics, any two (or more) quantum states can be added together ("superposed") and the result will be another valid quantum state.
5.  **Entanglement**: This is a physical phenomenon that occurs when a pair or group of particles is generated, interact, or share spatial proximity in such a way that the quantum state of each particle of the pair or group cannot be described independently of the state of the others, including when the particles are separated by a large distance.`
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-headline text-3xl">{note.title}</CardTitle>
              <CardDescription>
                Subject: {note.subject} | Created on: {note.date}
              </CardDescription>
            </div>
            <Link href={{ pathname: '/summarizer', query: { notes: note.content }}}>
              <Button>
                <Bot className="mr-2 h-4 w-4" />
                Summarize with AI
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose dark:prose-invert max-w-none">
            <p style={{ whiteSpace: 'pre-line' }}>{note.content}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
