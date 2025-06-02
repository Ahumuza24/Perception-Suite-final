"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building } from "lucide-react";

interface BrandingDisplayProps {
  organizationName: string;
  organizationLogo?: string; // URL to the logo
}

export function BrandingDisplay({ organizationName, organizationLogo }: BrandingDisplayProps) {
  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="flex flex-row items-center space-x-4">
        {organizationLogo ? (
          <Image 
            src={organizationLogo} 
            alt={`${organizationName} Logo`} 
            width={64} 
            height={64} 
            className="rounded-md object-contain"
            data-ai-hint="company logo"
          />
        ) : (
          <div className="p-3 bg-secondary rounded-md">
            <Building className="h-8 w-8 text-secondary-foreground" />
          </div>
        )}
        <div>
          <CardTitle className="text-2xl font-headline">{organizationName}</CardTitle>
          <CardDescription>Welcome to your dedicated portal.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          This space is customized for members of {organizationName}. 
          All your necessary resources and tools are accessible from here.
        </p>
      </CardContent>
    </Card>
  );
}
