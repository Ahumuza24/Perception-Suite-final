
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  FolderKanban,
  ExternalLink,
  LogOut,
  Loader2,
  
  ChevronDown,
  LayoutDashboard,
  LifeBuoy,
  Lock,
  CheckCircle2,
  Building2,
  Rocket
} from "lucide-react";
import { PerceptionSuiteLogo } from "@/components/icons/PerceptionSuiteLogo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

function DashboardContent() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [orgName, setOrgName] = useState("Your Organization");
  const [orgLogo, setOrgLogo] = useState<string | undefined>("https://placehold.co/64x64.png");
  const [driveLink, setDriveLink] = useState<string>("#");
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string>("User");
  const [userEmail, setUserEmail] = useState<string>("");


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
      if (userRole === 'admin') {
        toast({ title: "Admin Access", description: "Redirecting to admin dashboard.", variant: "default" });
        router.push("/admin/dashboard");
        setIsLoading(false);
        return;
      }
      
      if (!authUser || authUser.id !== userToVerify.id || authUser.user_metadata?.role !== userRole ) {
         setAuthUser(userToVerify);
      }

      setUserEmail(userToVerify.email || "");
      setUserName(userToVerify.user_metadata?.full_name || userToVerify.email?.split('@')[0] || "User");

      const currentEmail = userToVerify.email;
      if (!currentEmail) {
        toast({ title: "Invalid Email", description: "Could not determine your organization's domain. Email is missing.", variant: "destructive", duration: 5000 });
        router.push("/error/unrecognized-domain");
        setIsLoading(false);
        return;
      }

      const currentOrgDomain = currentEmail.substring(currentEmail.lastIndexOf("@") + 1).toLowerCase();

      if (currentOrgDomain) {
        const { data: mapping, error: mappingError } = await supabase
          .from('domain_mappings')
          .select('drive_link, domain')
          .eq('domain', currentOrgDomain) // Query with lowercase domain
          .single();

        if (mappingError || !mapping) {
          console.error("Domain mapping error or not found:", mappingError);
          toast({ title: "Domain Not Recognized", description: `Your domain (${currentOrgDomain}) is not configured for Drive access. Redirecting...`, variant: "destructive", duration: 5000 });
          router.push("/error/unrecognized-domain");
          setIsLoading(false);
          return;
        } else {
          setOrgName(mapping.domain);
          setOrgLogo(`https://placehold.co/64x64.png?text=${mapping.domain[0].toUpperCase()}`);
          setDriveLink(mapping.drive_link);
        }
      } else {
         toast({ title: "Invalid Email", description: "Could not determine your organization's domain from email.", variant: "destructive", duration: 5000 });
         router.push("/error/unrecognized-domain");
         setIsLoading(false);
         return;
      }
      setIsLoading(false);
    };

    if (authUser) {
        checkAuthAndRole();
    } else { // Only run initial fetch if authUser is not set yet
        checkAuthAndRole();
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setAuthUser(null);
        router.push('/');
      } else if (session?.user) {
        const currentAuthUserRole = authUser?.user_metadata?.role;
        const newSessionUserRole = session.user.user_metadata?.role;
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || !authUser || session.user.id !== authUser.id || currentAuthUserRole !== newSessionUserRole) {
          setAuthUser(session.user); 
        }
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, router, supabase, toast]);

  const handleLogout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
  };

  const getUserInitials = () => {
    if (userName) {
        const names = userName.split(' ');
        if (names.length > 1) {
            return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return userName.substring(0, 2).toUpperCase();
    }
    return "U";
  }

  if (isLoading || !authUser || authUser.user_metadata?.role === 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Verifying access and loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="p-4 border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <PerceptionSuiteLogo />
          </div>

          <div className="flex items-center space-x-4">
            

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative flex items-center space-x-2 p-1 h-auto">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={orgLogo} alt={userName || "User"} data-ai-hint="company logo" />
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
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/support')}>
                  <LifeBuoy className="mr-2 h-4 w-4" />
                  <span>Support</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-8 space-y-8">
        <Card className="shadow-lg border-border">
          <CardHeader>
            <CardTitle className="text-3xl font-headline">👋 Welcome back, {userName}!</CardTitle>
            <CardDescription className="text-md">Access resources for {orgName}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <span className="flex items-center text-green-600 dark:text-green-400"><Lock className="mr-1.5 h-4 w-4" /> Secure</span>
              <span className="flex items-center text-green-600 dark:text-green-400"><CheckCircle2 className="mr-1.5 h-4 w-4" /> Verified</span>
              <span className="flex items-center text-muted-foreground"><Building2 className="mr-1.5 h-4 w-4" /> {orgName}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-border">
          <CardHeader>
            <CardTitle className="text-2xl font-headline flex items-center">
              <FolderKanban className="mr-3 h-7 w-7 text-primary" />
              Your Organization Collateral
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Card className="bg-card shadow-inner">
              <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                      <Rocket className="mr-2 h-5 w-5 text-primary" />
                      Access {orgName} Drive
                  </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    All your organization's design collateral in one place.
                  </p>
                  <Button
                    size="lg"
                    onClick={() => window.open(driveLink, "_blank")}
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
                    aria-label={`Open ${orgName} Google Drive folder`}
                    disabled={driveLink === "#" || !driveLink.startsWith("https://drive.google.com/")}
                  >
                    <ExternalLink className="mr-2 h-5 w-5" /> Open Folder
                  </Button>
                  {driveLink === "#" && <p className="text-sm text-destructive">Drive link not configured for your domain.</p>}
              </CardContent>
            </Card>
            {/* <p className="text-sm text-muted-foreground text-center pt-2">
              📊 Folder contains: -- files • Last updated: --
            </p> */}
          </CardContent>
        </Card>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        &copy; {new Date().getFullYear()} Picasso Design Agency
      </footer>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading dashboard...</p>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

