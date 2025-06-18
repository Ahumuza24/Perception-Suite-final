
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LifeBuoy, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { PerceptionSuiteLogo } from "@/components/icons/PerceptionSuiteLogo";

export default function SupportPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
      <Card className="w-full max-w-lg shadow-xl border-border">
        <CardHeader>
          <div className="mx-auto mb-5">
            <PerceptionSuiteLogo />
          </div>
          <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4">
            <LifeBuoy className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline">Support Center</CardTitle>
          <CardDescription className="text-lg">
            We're here to help!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            If you need assistance, please reach out to our support team at creative@picassodesign-agency.com <br /> or <br />  Call: +256 777 581360.
          </p>
          
          <Button onClick={() => router.back()} className="mt-4" variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </CardContent>
      </Card>
       <p className="mt-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} PerceptionSuite.
      </p>
    </div>
  );
}

    