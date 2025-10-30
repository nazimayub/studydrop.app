
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Activity, NotebookText, UploadCloud, Users, Menu, BrainCircuit } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import placeholderImages from '@/lib/placeholder-images.json';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-16 flex items-center bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <Logo />
        </Link>
        <nav className="ml-auto hidden md:flex items-center gap-4 sm:gap-6">
          <Link href="#features" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            Features
          </Link>
          <Link href="#testimonials" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            Testimonials
          </Link>
          <Link href="/login" prefetch={false}>
            <Button variant="outline">Login</Button>
          </Link>
          <Link href="/signup" prefetch={false}>
            <Button>Get Started</Button>
          </Link>
        </nav>
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden ml-auto">
                    <Menu />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="right">
                <nav className="grid gap-6 text-lg font-medium mt-8">
                     <Link href="#features" className="text-muted-foreground hover:text-foreground" prefetch={false}>
                        Features
                    </Link>
                    <Link href="#testimonials" className="text-muted-foreground hover:text-foreground" prefetch={false}>
                        Testimonials
                    </Link>
                    <Link href="/login" className="text-muted-foreground hover:text-foreground" prefetch={false}>
                        Login
                    </Link>
                    <Link href="/signup" className="mt-4" prefetch={false}>
                        <Button className="w-full">Get Started</Button>
                    </Link>
                </nav>
            </SheetContent>
        </Sheet>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 animated-gradient bg-gradient-to-r from-blue-200 via-cyan-200 to-teal-200 dark:from-blue-900/50 dark:via-cyan-900/50 dark:to-teal-900/50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-8 text-center">
              <Image
                src="/logo-icon.png"
                width="144"
                height="144"
                alt="Open Desk hero icon"
                className="mx-auto"
                priority
              />
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                  Built for students, by students.
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl mx-auto">
                  Open Desk helps you connect with classmates, share notes, and master your courses together. Stay on top of your classes, effortlessly.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  prefetch={false}
                >
                  Sign Up for Free
                </Link>
                <Link
                  href="#features"
                  className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  prefetch={false}
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Everything You Need to Succeed</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  From collaborative forums to seamless note organization, we've got you covered.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-4 lg:max-w-none mt-12">
              <div className="grid gap-1 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <Activity className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold font-headline">Catch-up Feed</h3>
                <p className="text-sm text-muted-foreground">
                  See the most recent notes and questions for your classes in a centralized feed so you're always in the loop.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <NotebookText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold font-headline">Notes Management</h3>
                <p className="text-sm text-muted-foreground">
                  A comprehensive system to create, organize, filter, and annotate your study materials effectively.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <BrainCircuit className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold font-headline">AI Coach</h3>
                <p className="text-sm text-muted-foreground">
                   Helps write better notes and makes review easier.
                </p>
              </div>
              <div className="grid gap-1 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                   <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold font-headline">Q&amp;A Forum</h3>
                <p className="text-sm text-muted-foreground">
                  Stuck on a problem? Ask questions and get answers from a community of peers and experts.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32 bg-secondary/50">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline">
                What students are saying
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                We're helping students save time and understand concepts better.
              </p>
            </div>
            <div className="mx-auto w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 pt-12">
               <Card>
                <CardContent className="pt-6">
                  <p className="mb-4">"Wasn't sure about this at first, but the catch-up feed is actually useful. I don't have to chase my friends for notes anymore."</p>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-semibold">High School Sophomore</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="mb-4">"I uploaded my messy notes for my APUSH class, and the AI assistant cleaned them up and made practice questions. I was surprised it worked so well."</p>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-semibold">High School Junior</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="mb-4">"The Q&A forum is less intimidating than asking in a giant lecture hall. Got a solid answer on a stats problem without feeling dumb."</p>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-semibold">College Freshman</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="mb-4">"Honestly just started using it for the reward points, but I ended up actually learning from other people's notes. It's a decent system."</p>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-semibold">High School Senior</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="mb-4">"Figuring out what to study for midterms is always a mess. The AI study guide tool helped me focus on what's actually important for my bio exam."</p>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-semibold">High School Junior</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="mb-4">"I thought this would be just another school app, but being able to see how other people explain concepts in the forum is actually pretty helpful for my physics class."</p>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-semibold">High School Senior</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
               <Card>
                <CardContent className="pt-6">
                  <p className="mb-4">"My friend sent me a link to a note, and I didn't think much of it. But I ended up finding a whole set of notes for my chem class that made sense."</p>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-semibold">High School Sophomore</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
               <Card>
                <CardContent className="pt-6">
                  <p className="mb-4">"Was expecting to be confused, but it's surprisingly straightforward. Found a study guide for my Econ 101 final that was actually on point."</p>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-semibold">College Sophomore</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 Open Desk. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}

    