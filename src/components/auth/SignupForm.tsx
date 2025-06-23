
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Mail, Lock, UserPlus, ShieldCheck, User, Loader2 } from "lucide-react";
import { PerceptionSuiteLogo } from "@/components/icons/PerceptionSuiteLogo";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

const formSchema = z.object({
  fullName: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  confirmPassword: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.fullName,
          role: 'user', // Set default role to 'user'
        },
        // Optional: Add email redirect URL if you have email confirmation enabled
        // emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setIsLoading(false);

    if (error) {
      toast({
        title: "Sign-up Failed",
        description: error.message || "Could not create account. Please try again.",
        variant: "destructive",
      });
    } else if (data.user && data.user.identities && data.user.identities.length === 0) {
      toast({
        title: "Email Confirmation Required",
        description: "A confirmation link has been sent to your email address. Please verify your email to complete registration. If the email already exists and is unconfirmed, this message will also appear.",
        variant: "default",
        duration: 10000, // Keep toast longer
      });
      // Don't redirect immediately, user needs to confirm email.
      // router.push("/");
    }
     else if (data.user) {
      toast({
        title: "Account Created!",
        description: "You have successfully signed up. Please login.",
      });
      router.push("/"); // Redirect to login page
      router.refresh();
    } else {
       toast({
        title: "Sign-up Issue",
        description: "An unexpected issue occurred. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
          <div className="flex justify-center w-full mb-4">
            <PerceptionSuiteLogo />
          </div>
          <CardTitle className="text-3xl font-headline flex items-center justify-center">
            <UserPlus className="mr-3 h-8 w-8 text-primary" /> Create Your Account
          </CardTitle>
          
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <User className="mr-2 h-4 w-4" /> Full Name
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Mail className="mr-2 h-4 w-4" /> Email Address
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Lock className="mr-2 h-4 w-4" /> Password
                    </FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Lock className="mr-2 h-4 w-4" /> Confirm Password
                    </FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                 Sign Up
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center text-center">
          <div className="text-sm">
            Already have an account?{" "}
            <Link href="/" className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </div>
                  </CardFooter>
      </Card>
       <p className="mt-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Picasso Design Agency. All rights reserved.
      </p>
    </div>
  );
}
