
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  LogOut,
  Loader2,
  ShieldCheck,
  ChevronDown,
  LayoutDashboard,
  Link2,
  PlusCircle,
  Edit3,
  Trash2
} from "lucide-react";
import { PerceptionSuiteLogo } from "@/components/icons/PerceptionSuiteLogo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

const domainMappingFormSchema = z.object({
  domain: z.string().min(1, { message: "Domain name is required." })
    .refine(value => /^([a-zA-Z0-9]+(-[a-zA-Z0-9]+)*\.)+[a-zA-Z]{2,}$/.test(value), {
      message: "Invalid domain name format (e.g., example.com)."
    }),
  driveLink: z.string().url({ message: "Please enter a valid URL." })
    .refine(value => value.startsWith("https://drive.google.com/"), {
      message: "URL must be a Google Drive link (e.g., https://drive.google.com/...)."
    }),
});
type DomainMappingFormValues = z.infer<typeof domainMappingFormSchema>;

interface DomainMapping {
  id: string;
  domain: string;
  drive_link: string;
  created_at?: string;
}

function AdminDashboardContent() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string>("Admin");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userAvatar, setUserAvatar] = useState<string | undefined>("https://placehold.co/64x64.png");

  const [domainMappings, setDomainMappings] = useState<DomainMapping[]>([]);
  const [isLoadingMappings, setIsLoadingMappings] = useState(false);
  const [isMappingDialogOpen, setIsMappingDialogOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<DomainMapping | null>(null);

  const [isDeleteMappingAlertOpen, setIsDeleteMappingAlertOpen] = useState(false);
  const [mappingIdToDelete, setMappingIdToDelete] = useState<string | null>(null);

  const domainMappingForm = useForm<DomainMappingFormValues>({
    resolver: zodResolver(domainMappingFormSchema),
    defaultValues: { domain: "", driveLink: "" },
  });

  const fetchDomainMappings = async () => {
    if (!authUser || authUser.user_metadata?.role !== 'admin') return;
    setIsLoadingMappings(true);
    const { data, error } = await supabase.from("domain_mappings").select("*").order("domain", { ascending: true });
    if (error) {
      toast({ title: "Error Fetching Mappings", description: "Could not fetch domain mappings. " + error.message, variant: "destructive" });
      setDomainMappings([]);
    } else {
      setDomainMappings(data || []);
    }
    setIsLoadingMappings(false);
  };

  useEffect(() => {
    const checkAuthAndRole = async () => {
      setIsLoading(true);
      const userToVerify = authUser || (await supabase.auth.getUser()).data.user;

      if (!userToVerify) {
        router.push("/");
        setIsLoading(false);
        return;
      }

      const userRole = userToVerify.user_metadata?.role;
      if (userRole !== 'admin') {
        toast({ title: "Access Denied", description: "Redirecting to user dashboard.", variant: "destructive" });
        router.push("/dashboard");
        setIsLoading(false);
        return;
      }

      if (!authUser || authUser.id !== userToVerify.id || authUser.user_metadata?.role !== userRole) {
        setAuthUser(userToVerify);
      }
      setUserEmail(userToVerify.email || "");
      setUserName(userToVerify.user_metadata?.full_name || userToVerify.email?.split('@')[0] || "Admin");
      await fetchDomainMappings();
      setIsLoading(false);
    };

    // Initial check or check when authUser changes
    if (authUser) {
        checkAuthAndRole();
    } else if (isLoading) { // Only run initial fetch if isLoading is true (first mount)
        checkAuthAndRole();
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setAuthUser(null);
        router.push('/'); // Ensure redirect on sign out
      } else if (session?.user) {
        const currentAuthUserRole = authUser?.user_metadata?.role;
        const newSessionUserRole = session.user.user_metadata?.role;
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || !authUser || session.user.id !== authUser.id || currentAuthUserRole !== newSessionUserRole) {
          setAuthUser(session.user); // This will trigger the main useEffect to re-run checkAuthAndRole
        }
      }
    });
    return () => { authListener?.subscription.unsubscribe(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]); // Dependency on authUser is key for re-evaluation


  const handleLogout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
  };

  const getUserInitials = () => userName ? (userName.split(' ').length > 1 ? `${userName.split(' ')[0][0]}${userName.split(' ')[userName.split(' ').length - 1][0]}`.toUpperCase() : userName.substring(0, 2).toUpperCase()) : "A";

  const handleAddNewMapping = () => {
    setEditingMapping(null);
    domainMappingForm.reset({ domain: "", driveLink: "" });
    setIsMappingDialogOpen(true);
  };

  const handleEditMappingDialog = (mapping: DomainMapping) => {
    setEditingMapping(mapping);
    domainMappingForm.reset({ domain: mapping.domain, driveLink: mapping.drive_link });
    setIsMappingDialogOpen(true);
  };

  const openDeleteConfirmDialog = (id: string) => {
    setMappingIdToDelete(id);
    setIsDeleteMappingAlertOpen(true);
  };

  const handleDeleteMapping = async () => {
    if (!mappingIdToDelete) return;
    const { error } = await supabase.from("domain_mappings").delete().eq("id", mappingIdToDelete);
    if (error) {
      toast({ title: "Error Deleting Mapping", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Domain mapping deleted successfully." });
      fetchDomainMappings();
    }
    setIsDeleteMappingAlertOpen(false); setMappingIdToDelete(null);
  };

  const onSubmitDomainMapping = async (values: DomainMappingFormValues) => {
    if (editingMapping) {
      const { error } = await supabase.from("domain_mappings").update({ domain: values.domain, drive_link: values.driveLink }).eq("id", editingMapping.id);
      if (error) {
        toast({ title: "Error Updating Mapping", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Domain mapping updated successfully." });
        setIsMappingDialogOpen(false); setEditingMapping(null); fetchDomainMappings();
      }
    } else {
      const { error } = await supabase.from("domain_mappings").insert([{ domain: values.domain, drive_link: values.driveLink }]);
      if (error) {
        toast({ title: "Error Adding Mapping", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Domain mapping added successfully." });
        setIsMappingDialogOpen(false); fetchDomainMappings();
      }
    }
    domainMappingForm.reset();
  };

  if (isLoading || !authUser || authUser.user_metadata?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Verifying admin access...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="p-4 border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <PerceptionSuiteLogo />
            <span className="font-semibold text-lg hidden md:block">Admin Panel</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 text-sm text-green-600 dark:text-green-400">
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Secure Admin Session</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative flex items-center space-x-2 p-1 h-auto">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userAvatar} alt={userName || "Admin"} data-ai-hint="admin avatar" />
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                      <p className="text-sm font-medium">{userName}</p>
                      <p className="text-xs text-muted-foreground">{userEmail}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Admin Account</DropdownMenuLabel><DropdownMenuSeparator />
                <DropdownMenuItem disabled><LayoutDashboard className="mr-2 h-4 w-4" /><span>Admin Dashboard</span></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" /><span>Sign Out</span></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-8 space-y-8">
        <Card className="shadow-lg border-border">
          <CardHeader>
            <CardTitle className="text-3xl font-headline">Admin Dashboard</CardTitle>
            <CardDescription className="text-md">Manage your PerceptionSuite instance.</CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="domain-mappings" className="w-full">
          <TabsList className="grid w-full grid-cols-1 md:w-[250px]">
            <TabsTrigger value="domain-mappings"><Link2 className="mr-2 h-4 w-4" /> Domain Mappings</TabsTrigger>
          </TabsList>

          <TabsContent value="domain-mappings" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Domain to Drive Mappings</CardTitle>
                  <CardDescription>Configure which email domains map to specific Google Drive links.</CardDescription>
                </div>
                <Button size="sm" onClick={handleAddNewMapping}><PlusCircle className="mr-2 h-4 w-4" /> Add New Mapping</Button>
              </CardHeader>
              <CardContent>
                 <Dialog open={isMappingDialogOpen} onOpenChange={(isOpen) => { setIsMappingDialogOpen(isOpen); if (!isOpen) { setEditingMapping(null); domainMappingForm.reset();}}}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingMapping ? "Edit Domain Mapping" : "Add New Domain Mapping"}</DialogTitle>
                      <DialogDescription>{editingMapping ? "Update the domain and Google Drive link." : "Enter the email domain and the corresponding Google Drive link."}</DialogDescription>
                    </DialogHeader>
                    <Form {...domainMappingForm}>
                      <form onSubmit={domainMappingForm.handleSubmit(onSubmitDomainMapping)} className="space-y-4">
                        <FormField control={domainMappingForm.control} name="domain" render={({ field }) => (<FormItem><FormLabel>Domain Name</FormLabel><FormControl><Input placeholder="example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={domainMappingForm.control} name="driveLink" render={({ field }) => (<FormItem><FormLabel>Google Drive Link</FormLabel><FormControl><Input placeholder="https://drive.google.com/corp/example" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <DialogFooter>
                          <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                          <Button type="submit" disabled={domainMappingForm.formState.isSubmitting}>{domainMappingForm.formState.isSubmitting ? <Loader2 className="animate-spin" /> : (editingMapping ? "Save Changes" : "Add Mapping")}</Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                {isLoadingMappings ? (<div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2 text-muted-foreground">Loading mappings...</p></div>) : (
                  <Table>
                    <TableHeader><TableRow><TableHead>Domain</TableHead><TableHead>Google Drive Link</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {domainMappings.map((mapping) => (
                        <TableRow key={mapping.id}>
                          <TableCell className="font-medium">{mapping.domain}</TableCell>
                          <TableCell><a href={mapping.drive_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{mapping.drive_link}</a></TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="icon" aria-label="Edit Mapping" onClick={() => handleEditMappingDialog(mapping)}><Edit3 className="h-4 w-4" /></Button>
                            <Button variant="destructive" size="icon" aria-label="Delete Mapping" onClick={() => openDeleteConfirmDialog(mapping.id)}><Trash2 className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {domainMappings.length === 0 && !isLoadingMappings && (<TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No domain mappings configured yet.</TableCell></TableRow>)}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={isDeleteMappingAlertOpen} onOpenChange={setIsDeleteMappingAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the domain mapping.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel onClick={() => setMappingIdToDelete(null)}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteMapping} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        &copy; {new Date().getFullYear()} PerceptionSuite Admin Panel.
      </footer>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Admin Dashboard...</p>
      </div>
    }>
      <AdminDashboardContent />
    </Suspense>
  );
}

    