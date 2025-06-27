
"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import {
  FolderKanban,
  LogOut,
  Loader2,
  ChevronDown,
  LayoutDashboard,
  LifeBuoy,
  Lock,
  CheckCircle2,
  Building2,
  Folder as FolderIcon,
  File as FileIcon,
  ArrowLeft,
  HardDrive,
  RefreshCw
} from "lucide-react";
import { listFolders, listFilesInFolder } from "@/lib/googleDrive";

interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
  modifiedTime?: string;
  size?: string;
  iconLink?: string;
  thumbnailLink?: string;
}

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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

function DashboardContent() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [orgName, setOrgName] = useState("Your Organization");
  const [orgLogo, setOrgLogo] = useState<string | undefined>("https://placehold.co/64x64.png");
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string>("User");
  const [userEmail, setUserEmail] = useState<string>("");
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<DriveItem | null>(null);
  const [driveItems, setDriveItems] = useState<DriveItem[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [driveLink, setDriveLink] = useState<string>("#");

  const getFolderIdFromLink = (link: string) => {
    const match = link.match(/folders\/([\w-]+)/);
    return match ? match[1] : null;
  };

  const loadDriveItems = useCallback(async (token: string, folderId?: string) => {
    if (!token) return;
    
    setIsLoadingDrive(true);
    setDriveError(null);
    
    try {
      const [folders, files] = await Promise.all([
        listFolders(token, folderId),
        folderId ? listFilesInFolder(token, folderId) : Promise.resolve([])
      ]);
      
      setDriveItems([...folders, ...files]);
    } catch (error: any) {
      console.error('Error loading drive items:', error);
      setDriveError('Failed to load files. Please try again.');
      if (error.message.includes('Invalid Credentials')) {
        localStorage.removeItem('google_access_token');
        setAccessToken(null);
      }
    } finally {
      setIsLoadingDrive(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('google_access_token');
    if (token) {
      setAccessToken(token);
      if (driveLink && driveLink !== "#") {
        const folderId = getFolderIdFromLink(driveLink);
        loadDriveItems(token, folderId || undefined);
      }
    }
  }, [loadDriveItems, driveLink]);

  const handleGoogleLoginSuccess = useCallback((tokenResponse: any) => {
    const token = tokenResponse.access_token;
    setAccessToken(token);
    localStorage.setItem('google_access_token', token);
    if (driveLink && driveLink !== "#") {
      const folderId = getFolderIdFromLink(driveLink);
      loadDriveItems(token, folderId || undefined);
    }
  }, [loadDriveItems, driveLink]);

  const login = useGoogleLogin({
    onSuccess: handleGoogleLoginSuccess,
    onError: () => setDriveError('Failed to connect to Google Drive'),
    scope: 'https://www.googleapis.com/auth/drive.readonly',
  });

  const handleFolderClick = useCallback((folder: DriveItem) => {
    setCurrentFolder(folder);
    if (accessToken) {
      loadDriveItems(accessToken, folder.id);
    }
  }, [accessToken, loadDriveItems]);

  const handleBack = useCallback(() => {
    setCurrentFolder(null);
    if (accessToken && driveLink && driveLink !== "#") {
      const folderId = getFolderIdFromLink(driveLink);
      loadDriveItems(accessToken, folderId || undefined);
    }
  }, [accessToken, loadDriveItems, driveLink]);

  const handleRefresh = useCallback(() => {
    if (accessToken) {
      const folderId = currentFolder ? currentFolder.id : getFolderIdFromLink(driveLink || "");
      loadDriveItems(accessToken, folderId || undefined);
    }
  }, [accessToken, currentFolder, loadDriveItems, driveLink]);

  useEffect(() => {
    const checkAuthAndRole = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
        return;
      }

      if (user.user_metadata?.role === 'admin') {
        toast({ title: "Admin Access", description: "Redirecting to admin dashboard.", variant: "default" });
        router.push("/admin/dashboard");
        return;
      }
      
      setAuthUser(user);
      setUserEmail(user.email || "");
      setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || "User");
      
      // Fetch domain mapping and set drive link
      const currentEmail = user.email;
      if (currentEmail) {
        const { data: mapping } = await supabase
          .from('domain_mappings')
          .select('drive_link, domain')
          .eq('domain', currentEmail.substring(currentEmail.lastIndexOf("@") + 1).toLowerCase())
          .single();
        if (mapping) {
          setDriveLink(mapping.drive_link);
          setOrgName(mapping.domain);
        }
      }

      setIsLoading(false);
    };

    checkAuthAndRole();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setAuthUser(null);
        router.push('/');
      } else if (event === 'SIGNED_IN') {
        setAuthUser(session?.user ?? null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router, supabase, toast]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('google_access_token');
    setAccessToken(null);
    setDriveItems([]);
    router.push('/');
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading dashboard...</p>
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
                    <AvatarImage src={orgLogo} alt={userName || "User"} />
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
            <CardDescription className="text-md">Access resources for your organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <span className="flex items-center text-green-600 dark:text-green-400"><Lock className="mr-1.5 h-4 w-4" /> Secure</span>
              <span className="flex items-center text-green-600 dark:text-green-400"><CheckCircle2 className="mr-1.5 h-4 w-4" /> Verified</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-border">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-headline flex items-center">
                <FolderKanban className="mr-3 h-7 w-7 text-primary" />
                {currentFolder ? currentFolder.name : orgName ? `${orgName} Collateral` : 'Organization Collateral'}
              </CardTitle>
              <div className="flex space-x-2">
                {currentFolder && (
                  <Button variant="outline" size="sm" onClick={handleBack} className="flex items-center">
                    <ArrowLeft className="mr-1 h-4 w-4" /> Back
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={!accessToken || isLoadingDrive} className="flex items-center">
                  <RefreshCw className={`mr-1 h-4 w-4 ${isLoadingDrive ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!accessToken ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <HardDrive className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground text-center">Connect to Google Drive to access your files</p>
                <Button onClick={() => login()}><HardDrive className="mr-2 h-4 w-4" />Connect to Google Drive</Button>
              </div>
            ) : isLoadingDrive ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : driveError ? (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md text-red-600 dark:text-red-400">
                {driveError}
              </div>
            ) : driveItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-2 text-muted-foreground">
                <FolderIcon className="h-12 w-12" />
                <p>No files or folders found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {driveItems.map((item) => (
                  <div
                    key={item.id}
                    className="group p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer flex flex-col items-center text-center"
                  >
                    {item.mimeType.includes('folder') ? (
                      <div onClick={() => handleFolderClick(item)} className="flex flex-col items-center">
                        <FolderIcon className="h-12 w-12 text-yellow-500 mb-2 group-hover:text-yellow-600 transition-colors" />
                        <span className="font-medium text-sm line-clamp-2">{item.name}</span>
                        {item.modifiedTime && (
                          <span className="text-xs text-muted-foreground mt-1">
                            {new Date(item.modifiedTime).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    ) : (
                      <>
                        <FileIcon className="h-12 w-12 text-gray-500 mb-2 group-hover:text-gray-600 transition-colors" />
                        <span className="font-medium text-sm line-clamp-2">{item.name}</span>
                        {item.modifiedTime && (
                          <span className="text-xs text-muted-foreground mt-1">
                            {new Date(item.modifiedTime).toLocaleDateString()}
                          </span>
                        )}
                        <div className="flex space-x-2 mt-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">Preview</Button>
                            </DialogTrigger>
                            <DialogContent className="w-[90vw] h-[90vh]">
                              <DialogHeader>
                                <DialogTitle>{item.name}</DialogTitle>
                              </DialogHeader>
                              <iframe src={item.webViewLink?.replace('view', 'preview')} className="w-full h-full" />
                            </DialogContent>
                          </Dialog>
                          <a href={item.webContentLink} download>
                            <Button variant="outline" size="sm">Download</Button>
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        &copy; {currentYear || '2024'} Picasso Design Agency
      </footer>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Loading dashboard...</p>
        </div>
      }>
        <DashboardContent />
      </Suspense>
    </GoogleOAuthProvider>
  );
}
