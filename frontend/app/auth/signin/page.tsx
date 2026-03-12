"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { 
  Github, Mail, ArrowLeft, Eye, EyeOff, Lock, 
  User, Sparkles, Trophy, Shield, CheckCircle
} from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const { login, loginWithGithub, isLoading } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await login(email, password);
      toast.success("Welcome back! You have been successfully signed in.");
      
      // Redirect based on user role
      if (user.role === 'ADMIN') {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Please check your credentials and try again.");
    }
  };

  const handleGithubSignIn = () => {
    // No toast here - OAuth callback will handle success/error messages
    loginWithGithub();
  };

  const handleGoogleSignIn = () => {
    toast.info("Google sign-in coming soon!");
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient matching homepage */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/5" />
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, rgba(59, 130, 246, 0.15) 2px, transparent 0)`,
          backgroundSize: '50px 50px'
        }} />
      </div>
      
      <div className="relative flex items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
          
          {/* Left side - Branding */}
          <div className="hidden lg:block space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary rounded-2xl">
                  <Trophy className="h-10 w-10 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Hack-Ai thon</h1>
                  <p className="text-muted-foreground">Build the Future of AI</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <h2 className="text-4xl font-bold leading-tight">
                  Welcome back to the{" "}
                  <span className="text-primary">
                    Innovation Hub
                  </span>
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Join thousands of developers building revolutionary AI solutions. 
                  Your next breakthrough starts here.
                </p>
              </div>
              
              {/* Features list */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Access to cutting-edge AI tools</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Collaborate with global innovators</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Compete for $50,000 in prizes</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Expert mentorship & guidance</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Sign in form */}
          <div className="w-full max-w-md mx-auto space-y-6">
            <div className="flex items-center lg:hidden">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </div>

            <Card className="border-0 shadow-xl bg-background/60 backdrop-blur-sm">
              <CardHeader className="text-center space-y-3 pb-6">
                <div className="flex items-center justify-center mb-2">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                <CardDescription className="text-base">
                  Sign in to your account to continue your AI journey
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Email/Password Form */}
                <form onSubmit={handleEmailSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-12"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-12 px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="remember" 
                        checked={rememberMe}
                        onCheckedChange={(checked: boolean) => setRememberMe(checked)}
                      />
                      <Label 
                        htmlFor="remember" 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Remember me
                      </Label>
                    </div>
                    <Link 
                      href="/auth/forgot-password" 
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <Button 
                    type="submit"
                    className="w-full h-12 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Signing in...
                      </div>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Sign In
                      </>
                    )}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background/80 px-3 text-muted-foreground font-medium">
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* OAuth Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={handleGithubSignIn}
                    disabled={isLoading}
                    className="h-12 border-border/40 hover:bg-muted/80 transition-all duration-200"
                  >
                    <Github className="mr-2 h-4 w-4" />
                    GitHub
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleGoogleSignIn}
                    disabled={true}
                    className="h-12 border-border/40 hover:bg-muted/80 transition-all duration-200 opacity-50 cursor-not-allowed"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Google (Coming Soon)
                  </Button>
                </div>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Link href="/auth/signup" className="text-primary hover:underline font-medium">
                      Create your account
                    </Link>
                  </p>
                </div>

                {/* Terms and Privacy */}
                <div className="text-center text-xs text-muted-foreground">
                  By signing in, you agree to our{" "}
                  <Link href="/terms" className="underline hover:text-foreground">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="underline hover:text-foreground">
                    Privacy Policy
                  </Link>
                </div>

                {/* Trust indicators */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Shield className="h-3 w-3" />
                    <span>Secured by industry-standard encryption</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mobile branding */}
            <div className="lg:hidden text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  Join 500+ innovators building the future
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}