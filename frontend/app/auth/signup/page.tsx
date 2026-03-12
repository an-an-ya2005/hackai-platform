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
  User, Sparkles, Trophy, Shield, CheckCircle, UserPlus
} from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const { register, loginWithGithub, isLoading } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false
  });

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!formData.agreeToTerms) {
      toast.error("Please agree to the terms of service");
      return;
    }

    try {
      const user = await register(formData.email, formData.password, formData.firstName, formData.lastName);
      toast.success("Account created successfully! Welcome to Hack-Ai thon.");
      
      // Redirect based on user role
      if (user.role === 'ADMIN') {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed. Please try again.");
    }
  };

  const handleGithubSignUp = () => {
    // No toast here - OAuth callback will handle success/error messages
    loginWithGithub();
  };

  const handleGoogleSignUp = () => {
    toast.info("Google sign-up coming soon!");
  };

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
                  Join the{" "}
                  <span className="text-primary">
                    AI Revolution
                  </span>
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Create your account and start building innovative AI solutions with 
                  developers from around the world.
                </p>
              </div>
              
              {/* Features list */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Free account with full access</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Connect with global AI community</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Submit unlimited project ideas</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Get noticed by top companies</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Sign up form */}
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
                    <UserPlus className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
                <CardDescription className="text-base">
                  Start your AI innovation journey today
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* OAuth Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={handleGithubSignUp}
                    disabled={isLoading}
                    className="h-12 border-border/40 hover:bg-muted/80 transition-all duration-200"
                  >
                    <Github className="mr-2 h-4 w-4" />
                    GitHub
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleGoogleSignUp}
                    disabled={true}
                    className="h-12 border-border/40 hover:bg-muted/80 transition-all duration-200 opacity-50 cursor-not-allowed"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Google (Coming Soon)
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background/80 px-3 text-muted-foreground font-medium">
                      Or create with email
                    </span>
                  </div>
                </div>

                {/* Email/Password Form */}
                <form onSubmit={handleEmailSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) => updateFormData("firstName", e.target.value)}
                        className="h-12"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={(e) => updateFormData("lastName", e.target.value)}
                        className="h-12"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => updateFormData("email", e.target.value)}
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
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={(e) => updateFormData("password", e.target.value)}
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

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                        className="pl-10 pr-10 h-12"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-12 px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="terms" 
                      checked={formData.agreeToTerms}
                      onCheckedChange={(checked: boolean) => updateFormData("agreeToTerms", checked)}
                    />
                    <Label 
                      htmlFor="terms" 
                      className="text-sm leading-relaxed"
                    >
                      I agree to the{" "}
                      <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
                      {" "}and{" "}
                      <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                    </Label>
                  </div>

                  <Button 
                    type="submit"
                    className="w-full h-12 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300" 
                    disabled={isLoading || !formData.agreeToTerms}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating account...
                      </div>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create Account
                      </>
                    )}
                  </Button>
                </form>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/auth/signin" className="text-primary hover:underline font-medium">
                      Sign in here
                    </Link>
                  </p>
                </div>

                {/* Trust indicators */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Shield className="h-3 w-3" />
                    <span>Your data is protected with enterprise-grade security</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mobile branding */}
            <div className="lg:hidden text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  Join the AI innovation community
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
