
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/ui/loading-button";
import { BookCopy } from "lucide-react";
import { generateStudyGuide, type StudyGuide } from "@/ai/flows/study-guide-flow";

const derivativesGuide: StudyGuide = {
    concepts: [
        {
            title: "1. Definition of the Derivative",
            explanation: `The derivative measures how a function changes — its instantaneous rate of change or slope of the tangent line.

f'(x) = lim(h→0) [f(x+h) - f(x)] / h

If this limit exists, the function is differentiable at x.

Example: f(x) = x²
f'(x) = lim(h→0) [(x+h)² - x²] / h
     = lim(h→0) [2xh + h²] / h
     = 2x`
        },
        {
            title: "2. Derivative Rules",
            explanation: `Power Rule: d/dx[xⁿ] = nxⁿ⁻¹
Constant Rule: d/dx[c] = 0
Constant Multiple Rule: d/dx[c * f(x)] = c * f'(x)
Sum/Difference Rule: d/dx[f(x) ± g(x)] = f'(x) ± g'(x)`
        },
        {
            title: "3. Product & Quotient Rules",
            explanation: `Product Rule: (fg)' = f'g + fg'
Quotient Rule: (f/g)' = (f'g - fg') / g²`
        },
        {
            title: "4. Chain Rule",
            explanation: `Used for composition of functions:
d/dx[f(g(x))] = f'(g(x)) * g'(x)
Tip: Work from the outside in — differentiate the outer function, multiply by the derivative of the inner.`
        },
        {
            title: "5. Derivatives of Common Functions",
            explanation: `eˣ → eˣ
aˣ → aˣln(a)
ln(x) → 1/x
sin(x) → cos(x)
cos(x) → -sin(x)
tan(x) → sec²(x)
cot(x) → -csc²(x)
sec(x) → sec(x)tan(x)
csc(x) → -csc(x)cot(x)`
        },
        {
            title: "6. Implicit Differentiation",
            explanation: `Used when y and x are mixed in an equation.
Example: x² + y² = 25
Differentiate both sides: 2x + 2y(dy/dx) = 0
Solve for dy/dx: dy/dx = -x/y`
        },
        {
            title: "7. Inverse & Parametric Derivatives",
            explanation: `Inverse Function Rule: If f(g(x)) = x, then (g'(x)) = 1 / f'(g(x))
Parametric Equations: If x = f(t), y = g(t), then dy/dx = (dy/dt) / (dx/dt)`
        },
        {
            title: "8. Higher Derivatives",
            explanation: `The second derivative: f''(x) = d/dx[f'(x)]
It tells concavity:
f''(x) > 0: concave up
f''(x) < 0: concave down`
        },
        {
            title: "9. Applications",
            explanation: `Tangent Line Equation: y - y₁ = f'(x₁)(x - x₁)
Motion Problems: If s(t) is position, then:
v(t) = s'(t) (velocity)
a(t) = v'(t) = s''(t) (acceleration)`
        },
        {
            title: "10. Special Techniques",
            explanation: `Logarithmic Differentiation: For products, powers, or quotients involving variables in exponents.
1. Take ln on both sides.
2. Differentiate using chain rule.
3. Solve for dy/dx.

Example: y = xˣ
ln(y) = x ln(x)
Differentiate: (1/y)(dy/dx) = 1*ln(x) + x*(1/x) = ln(x) + 1
Solve: dy/dx = y(ln(x) + 1) = xˣ(ln(x) + 1)`
        }
    ],
    practiceQuestions: [
        "f(x) = 3x⁴ − 2x² + 7",
        "f(x) = √x + 1/x³",
        "f(x) = (2x+1)(x²−3x)",
        "f(x) = sin(3x)",
        "f(x) = xtan(x)",
        "f(x) = sec(x²)",
        "x² + xy + y² = 7",
        "sin(xy) = x",
        "f(x) = e^(2x²+1)",
        "f(x) = ln(x²+3)",
        "x = t², y = sin(t). Find dy/dx.",
        "y = [x²(x+1)³] / √(x²+1)",
        "y = x^(sin(x))",
    ]
};

export default function StudyGuidePage() {
    const [topic, setTopic] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [guide, setGuide] = useState<StudyGuide | null>(null);

    const handleSubmit = async () => {
        if (!topic.trim()) {
            alert("Please enter a topic.");
            return;
        }
        setIsLoading(true);
        setGuide(null);

        if (topic.trim().toLowerCase() === 'calc bc derivatives') {
            setGuide(derivativesGuide);
            setIsLoading(false);
            return;
        }

        try {
            const result = await generateStudyGuide({ topic });
            setGuide(result);
        } catch (error) {
            console.error("Error generating study guide:", error);
            alert("Sorry, there was an error generating the study guide. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid gap-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">AI Study Guide Creator</h1>
                <p className="text-muted-foreground">Enter any topic and get a customized study guide with key concepts and practice questions.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Create Your Guide</CardTitle>
                    <CardDescription>What topic do you want to master today?</CardDescription>
                </CardHeader>
                <CardContent>
                    <Input
                        placeholder="e.g., Photosynthesis, The French Revolution, Python Lists"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        disabled={isLoading}
                    />
                </CardContent>
                <CardFooter>
                    <LoadingButton loading={isLoading} onClick={handleSubmit}>
                        <BookCopy className="mr-2 h-4 w-4" />
                        Generate Guide
                    </LoadingButton>
                </CardFooter>
            </Card>

            {guide && (
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Your Study Guide for: {topic}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <section>
                            <h3 className="text-xl font-bold mb-4 font-headline">Key Concepts</h3>
                            <div className="prose dark:prose-invert max-w-none space-y-4">
                                {guide.concepts.map((concept, index) => (
                                    <div key={index} className="whitespace-pre-wrap">
                                        <h4 className="font-semibold text-lg">{concept.title}</h4>
                                        <p>{concept.explanation}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                         <section>
                            <h3 className="text-xl font-bold mb-4 font-headline">Practice Questions</h3>
                            <div className="prose dark:prose-invert max-w-none space-y-4">
                                <ul className="list-decimal pl-5">
                                    {guide.practiceQuestions.map((question, index) => (
                                        <li key={index} className="mb-2">{question}</li>
                                    ))}
                                </ul>
                            </div>
                        </section>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
