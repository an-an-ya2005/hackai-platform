"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/navigation";
import { 
  Trophy, Users, FileText, ArrowRight, Github, Mail, 
  Sparkles, Zap, Target, Rocket, Star, Code, Brain, Award
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function HomePage() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section with Gradient */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/5" />
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, rgba(59, 130, 246, 0.15) 2px, transparent 0)`,
            backgroundSize: '50px 50px'
          }} />
        </div>
        
        <div className="relative py-24 lg:py-40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <div className="flex items-center justify-center mb-6">
                <Badge variant="secondary" className="px-4 py-2 text-sm font-medium bg-primary/10 text-primary border-primary/20">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Hack-Ai thon 2025 - Open Now
                </Badge>
              </div>
              
              <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-7xl lg:text-8xl mb-8">
                Turn Your{" "}
                <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  AI Ideas
                </span>{" "}
                Into Reality
              </h1>
              
              <p className="text-xl leading-relaxed text-muted-foreground max-w-2xl mx-auto mb-12">
                Join the world's most innovative Hack-Ai thon. Build revolutionary solutions, 
                collaborate with brilliant minds, and compete for{" "}
                <span className="font-semibold text-foreground">$50,000</span> in prizes.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                <Button size="lg" className="px-8 py-4 text-lg bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300" asChild>
                  <Link href="/auth/signin">
                    <Rocket className="mr-2 h-5 w-5" />
                    Start Building Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-2 hover:bg-muted/50 transition-all duration-300" asChild>
                  <Link href="/about">
                    <Target className="mr-2 h-5 w-5" />
                    Learn More
                  </Link>
                </Button>
              </div>

              {/* Stats Section */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-3xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">$50K</div>
                  <div className="text-sm text-muted-foreground">Total Prizes</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">48h</div>
                  <div className="text-sm text-muted-foreground">Build Time</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">500+</div>
                  <div className="text-sm text-muted-foreground">Participants</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">100+</div>
                  <div className="text-sm text-muted-foreground">Projects</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-20">
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-6">
              Everything You Need to{" "}
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Succeed
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Our platform provides cutting-edge tools and features to bring your AI ideas to life
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-background/60 backdrop-blur-sm hover:-translate-y-2">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white mb-4 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="h-8 w-8" />
                </div>
                <CardTitle className="text-xl mb-2">Intuitive Submission</CardTitle>
                <CardDescription className="text-base">
                  Submit your hackathon ideas with our streamlined form. Include project details, 
                  tech stack, and team information with ease.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-background/60 backdrop-blur-sm hover:-translate-y-2">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8" />
                </div>
                <CardTitle className="text-xl mb-2">Team Collaboration</CardTitle>
                <CardDescription className="text-base">
                  Connect with talented developers, designers, and AI enthusiasts. 
                  Build diverse teams that complement your skills.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-background/60 backdrop-blur-sm hover:-translate-y-2">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 text-white mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-8 w-8" />
                </div>
                <CardTitle className="text-xl mb-2">Real-time Tracking</CardTitle>
                <CardDescription className="text-base">
                  Monitor your application status, receive instant feedback from judges, 
                  and track your progress throughout the competition.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-background/60 backdrop-blur-sm hover:-translate-y-2">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-white mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Brain className="h-8 w-8" />
                </div>
                <CardTitle className="text-xl mb-2">AI-Powered Tools</CardTitle>
                <CardDescription className="text-base">
                  Access cutting-edge AI APIs, pre-trained models, and development 
                  tools to accelerate your project development.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-background/60 backdrop-blur-sm hover:-translate-y-2">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 text-white mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Code className="h-8 w-8" />
                </div>
                <CardTitle className="text-xl mb-2">Expert Mentorship</CardTitle>
                <CardDescription className="text-base">
                  Get guidance from industry experts, successful entrepreneurs, 
                  and AI researchers throughout your journey.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-background/60 backdrop-blur-sm hover:-translate-y-2">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-500 text-white mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Award className="h-8 w-8" />
                </div>
                <CardTitle className="text-xl mb-2">Amazing Rewards</CardTitle>
                <CardDescription className="text-base">
                  Compete for substantial cash prizes, startup funding opportunities, 
                  and exclusive job placement programs.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-purple-500/5 to-blue-500/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="flex items-center justify-center mb-6">
              <Badge className="px-4 py-2 bg-primary/10 text-primary border-primary/20">
                <Star className="w-4 h-4 mr-2" />
                Join 500+ Innovators
              </Badge>
            </div>
            
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl mb-8">
              Ready to Build the{" "}
              <span className="bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Future of AI?
              </span>
            </h2>
            
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Join thousands of developers, researchers, and innovators who are already 
              pushing the boundaries of artificial intelligence.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
              <Button 
                size="lg" 
                className="px-10 py-6 text-lg bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105" 
                asChild
              >
                <Link href="/auth/signin">
                  <Github className="mr-3 h-6 w-6" />
                  Sign in with GitHub
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="px-10 py-6 text-lg border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300" 
                asChild
              >
                <Link href="/auth/signin">
                  <Mail className="mr-3 h-6 w-6" />
                  Sign in with Google
                </Link>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto opacity-60">
              <div className="text-center">
                <div className="text-sm font-medium text-muted-foreground mb-1">Backed by</div>
                <div className="text-lg font-semibold">Y Combinator</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-muted-foreground mb-1">Partners</div>
                <div className="text-lg font-semibold">Google AI</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-muted-foreground mb-1">Sponsors</div>
                <div className="text-lg font-semibold">OpenAI</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-muted-foreground mb-1">Support</div>
                <div className="text-lg font-semibold">AWS</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/20 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Logo and description */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-primary to-blue-600 rounded-xl">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <span className="font-bold text-2xl">Hack-Ai thon</span>
              </div>
              <p className="text-muted-foreground mb-4 max-w-md">
                The premier platform for AI innovation and collaboration. 
                Building the future, one hackathon at a time.
              </p>
              <div className="flex gap-4">
                <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                  <Github className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                  <Mail className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <div className="space-y-2">
                {user?.role === 'ADMIN' ? (
                  <Link href="/admin" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Admin Panel
                  </Link>
                ) : (
                  <>
                    <Link href="/dashboard" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Dashboard
                    </Link>
                    <Link href="/submit" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Submit Project
                    </Link>
                    <Link href="/applications" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                      My Applications
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <div className="space-y-2">
                <Link href="/about" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                  About Us
                </Link>
                <Link href="/terms" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
                <Link href="/privacy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-sm text-muted-foreground">
              © 2025 Hack-Ai thon Platform. All rights reserved.
            </p>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <Badge variant="outline" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                Made with ❤️ for innovators
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
