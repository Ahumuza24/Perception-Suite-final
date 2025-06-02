"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { PerceptionSuiteLogo } from "@/components/icons/PerceptionSuiteLogo";

export default function UnrecognizedDomainErrorPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader>
          <div className="mx-auto mb-6">
            <PerceptionSuiteLogo />
          </div>
          <div className="mx-auto bg-destructive/10 p-3 rounded-full mb-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-3xl font-headline text-destructive">Access Denied</CardTitle>
          <CardDescription className="text-lg">
            Unrecognized Email Domain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The email domain you used is not recognized by our system. 
            Therefore, automatic redirection to a Google Drive folder is not possible.
          </p>
          <p className="text-muted-foreground">
            Please ensure you are using the correct email address associated with your organization. 
            If you believe this is an error, please contact your administrator or our support team.
          </p>
          <Button onClick={() => router.push("/")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
          </Button>
        </CardContent>
      </Card>
       <p className="mt-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} PerceptionSuite.
      </p>
    </div>
  );
}
