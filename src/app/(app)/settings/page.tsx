import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SettingsPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Settings</h1>
        <p className="text-muted-foreground">Manage your application settings.</p>
      </div>
      <div className="grid gap-8">
        <Card>
            <CardHeader>
                <CardTitle>General</CardTitle>
                <CardDescription>Manage general application settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="space-y-2">
                    <Label>Theme</Label>
                     <Select defaultValue="system">
                        <SelectTrigger className="w-[280px]">
                            <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                <div className="space-y-2">
                    <Label>Language</Label>
                    <Select defaultValue="en">
                        <SelectTrigger className="w-[280px]">
                            <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Accessibility</CardTitle>
                <CardDescription>Manage accessibility settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label className="text-base">High Contrast Mode</Label>
                        <p className="text-sm text-muted-foreground">
                            Increase visibility and readability.
                        </p>
                    </div>
                    <Switch />
                </div>
                <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label className="text-base">Reduce Motion</Label>
                        <p className="text-sm text-muted-foreground">
                            Reduce animations and motion effects.
                        </p>
                    </div>
                    <Switch />
                </div>
            </CardContent>
        </Card>
      </div>

       <div className="flex justify-start">
            <Button>Save Preferences</Button>
       </div>
    </div>
  )
}
