import Link from "next/link"
import {
  Activity,
  ArrowUpRight,
  Award,
  BookOpen,
  DollarSign,
  Menu,
  MessageSquare,
  Package2,
  Search,
  Users,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function Dashboard() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Notes Created
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">42</div>
              <p className="text-xs text-muted-foreground">
                +5 since last week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Questions Asked
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+12</div>
              <p className="text-xs text-muted-foreground">
                in the last hour
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Answers Provided</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+8</div>
              <p className="text-xs text-muted-foreground">
                +2 since yesterday
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Points Earned</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,250</div>
              <p className="text-xs text-muted-foreground">
                +150 this week
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-2">
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Recent notes and questions from your network.
                </CardDescription>
              </div>
              <Button asChild size="sm" className="ml-auto gap-1">
                <Link href="/notes">
                  View All
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <div className="font-medium">Olivia Martin</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        Biology 101 Notes
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="text-xs" variant="outline">
                        Note
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">2023-06-23</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <div className="font-medium">Jackson Lee</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                         How does photosynthesis work?
                      </div>
                    </TableCell>
                    <TableCell>
                     <Badge className="text-xs" variant="outline">
                        Question
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">2023-06-24</TableCell>
                  </TableRow>
                  <TableRow>
                     <TableCell>
                      <div className="font-medium">Isabella Nguyen</div>
                       <div className="hidden text-sm text-muted-foreground md:inline">
                        Summary of "The Great Gatsby"
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="text-xs" variant="outline">
                        Note
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">2023-06-25</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                       <div className="font-medium">William Kim</div>
                       <div className="hidden text-sm text-muted-foreground md:inline">
                        Calculus II Practice Problems
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="text-xs" variant="outline">
                        Note
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">2023-06-26</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
               <Link href="/notes">
                <Button className="w-full">Create New Note</Button>
               </Link>
               <Link href="/forum">
                <Button variant="outline" className="w-full">Ask a Question</Button>
               </Link>
               <Link href="/summarizer">
                <Button variant="outline" className="w-full">Summarize Text</Button>
               </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
