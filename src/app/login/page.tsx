
"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  auth,
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "@/lib/firebase/auth";
import { Braces, Loader2, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password cannot be empty." }),
});

const signUpSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

const phoneSchema = z.object({
  phone: z.string().min(10, { message: "Please enter a valid phone number." }),
});

const codeSchema = z.object({
  code: z.string().min(6, { message: "Verification code must be 6 digits." }),
});


function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.012,36.45,44,30.638,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isPhoneLoading, setIsPhoneLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [phoneSignInStep, setPhoneSignInStep] = useState<'phone' | 'code'>('phone');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "" },
  });

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  });
  
  const codeForm = useForm<z.infer<typeof codeSchema>>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  });

  useEffect(() => {
    if (user && !loading) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  async function onLogin(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    try {
      await signInWithEmail(values.email, values.password);
      toast({ title: "Login Successful", description: "Welcome back!" });
      router.push('/');
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Login Failed", description: error.message });
    } finally {
      setIsLoading(false);
    }
  }

  async function onSignUp(values: z.infer<typeof signUpSchema>) {
    setIsLoading(true);
    try {
      await signUpWithEmail(values.email, values.password);
      toast({ title: "Sign Up Successful", description: "Welcome to CodeLeap!" });
      router.push('/');
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Sign Up Failed", description: error.message });
    } finally {
      setIsLoading(false);
    }
  }

  async function onGoogleSignIn() {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      toast({ title: "Login Successful", description: "Welcome!" });
      router.push('/');
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Google Sign-In Failed", description: error.message });
    } finally {
      setIsGoogleLoading(false);
    }
  }

  async function onPhoneSubmit(values: z.infer<typeof phoneSchema>) {
    setIsPhoneLoading(true);
    try {
      const result = await signInWithPhoneNumber(values.phone, 'recaptcha-container');
      setConfirmationResult(result);
      setPhoneSignInStep('code');
      toast({ title: "Verification Code Sent", description: "Please check your phone for the code." });
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Phone Sign-In Failed", description: error.message });
    } finally {
      setIsPhoneLoading(false);
    }
  }

  async function onCodeSubmit(values: z.infer<typeof codeSchema>) {
    if (!confirmationResult) return;
    setIsPhoneLoading(true);
    try {
      await confirmationResult.confirm(values.code);
      toast({ title: "Login Successful", description: "Welcome!" });
      router.push('/');
    } catch (error: any) {
      toast({ variant: 'destructive', title: "Verification Failed", description: error.message });
    } finally {
      setIsPhoneLoading(false);
    }
  }

  if (loading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
       <div id="recaptcha-container" className="fixed bottom-4 right-4"></div>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center gap-2">
            <Braces className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-bold">CodeLeap</CardTitle>
          </div>
          <CardDescription>
            Your journey into code starts here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4 pt-4">
                  <FormField control={loginForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input placeholder="you@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={loginForm.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Login
                  </Button>
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="signup">
              <Form {...signUpForm}>
                <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-4 pt-4">
                  <FormField control={signUpForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input placeholder="you@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={signUpForm.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign Up
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={onGoogleSignIn} disabled={isGoogleLoading}>
                  {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2" />}
                  Google
              </Button>
               <Tabs defaultValue="phone">
                <TabsContent value="phone" className="m-0">
                  {phoneSignInStep === 'phone' ? (
                     <Form {...phoneForm}>
                        <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="flex gap-2">
                           <FormField control={phoneForm.control} name="phone" render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl><Input placeholder="Phone number" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                           )} />
                           <Button type="submit" variant="outline" disabled={isPhoneLoading}>
                              {isPhoneLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
                           </Button>
                        </form>
                     </Form>
                  ) : (
                     <Form {...codeForm}>
                        <form onSubmit={codeForm.handleSubmit(onCodeSubmit)} className="flex gap-2">
                            <FormField control={codeForm.control} name="code" render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl><Input placeholder="6-digit code" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                           )} />
                           <Button type="submit" variant="outline" disabled={isPhoneLoading}>
                              {isPhoneLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                           </Button>
                        </form>
                     </Form>
                  )}
                </TabsContent>
               </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
