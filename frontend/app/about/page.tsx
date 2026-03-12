import { Navigation } from "@/components/navigation";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Users, 
  Zap, 
  Calendar, 
  Brain,
  Rocket,
  Star,
  Code,
  Award,
  Lightbulb,
  Clock,
  ChevronRight,
  Sparkles,
  FileText
} from "lucide-react";
import Link from "next/link";
import "./about.css";

export default function AboutPage() {
  const features = [
    {
      icon: <Brain className="h-8 w-8" />,
      title: "AI Innovation",
      description: "Push the boundaries of artificial intelligence with cutting-edge solutions that solve real-world challenges",
      gradient: "from-blue-500 to-purple-600"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Global Community", 
      description: "Connect with 500+ talented developers, designers, and AI researchers from 50+ countries worldwide",
      gradient: "from-green-500 to-teal-600"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "48-Hour Sprint",
      description: "Intensive rapid prototyping session where ideas transform into working AI applications in just two days",
      gradient: "from-orange-500 to-red-600"
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: "Career Opportunities",
      description: "Win prizes, gain mentorship, and unlock exclusive job opportunities with leading tech companies",
      gradient: "from-purple-500 to-pink-600"
    }
  ];

  const timeline = [
    {
      date: "January 20, 2025",
      title: "Registration Opens",
      description: "Submit your application and start building your dream team",
      icon: <Rocket className="h-5 w-5" />,
      status: "upcoming"
    },
    {
      date: "February 15, 2025", 
      title: "Application Deadline",
      description: "Final day to submit your hackathon application and project proposal",
      icon: <Clock className="h-5 w-5" />,
      status: "upcoming"
    },
    {
      date: "February 20, 2025",
      title: "Team Selection",
      description: "Selected teams will be notified via email and invited to join",
      icon: <Users className="h-5 w-5" />,
      status: "upcoming"
    },
    {
      date: "March 1-3, 2025",
      title: "Hackathon Weekend", 
      description: "48 hours of intense building, networking, and innovation in San Francisco",
      icon: <Zap className="h-5 w-5" />,
      status: "main"
    },
    {
      date: "March 3, 2025",
      title: "Final Presentations",
      description: "Present your AI solutions to industry experts and compete for prizes",
      icon: <Trophy className="h-5 w-5" />,
      status: "final"
    }
  ];

  const stats = [
    { number: "$50K", label: "Prize Pool" },
    { number: "48hrs", label: "Build Time" },
    { number: "500+", label: "Participants" },
    { number: "50+", label: "Countries" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section - Following Home Page Design */}
      <section className="relative overflow-hidden">
        {/* Background gradient - consistent with home page */}
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
                  Hack-Ai thon 2025
                </Badge>
              </div>
              
              <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-7xl lg:text-8xl mb-8">
                About the{" "}
                <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  AI Revolution
                </span>
              </h1>
              
              <p className="text-xl leading-relaxed text-muted-foreground max-w-2xl mx-auto mb-12">
                Join the world's most innovative Hack-Ai thon. Build revolutionary solutions, 
                collaborate with brilliant minds, and compete for{" "}
                <span className="font-semibold text-foreground">$50,000</span> in prizes.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                <Button size="lg" className="px-8 py-4 text-lg bg-black hover:bg-black/90 text-white shadow-lg hover:shadow-xl transition-all duration-300" asChild>
                  <Link href="/auth/signin">
                    <Rocket className="mr-2 h-5 w-5" />
                    Join Now
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-2 border-black hover:bg-black/10 transition-all duration-300" asChild>
                  <Link href="#timeline">
                    <Calendar className="mr-2 h-5 w-5" />
                    View Timeline
                  </Link>
                </Button>
              </div>

              {/* Stats Row - Same as home page */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-3xl mx-auto">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">{stat.number}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Following Home Page Design */}
      <section className="py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-20">
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-6">
              Why Join Our{" "}
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Hackathon?
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Experience the ultimate AI innovation challenge designed for the next generation of tech leaders
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="group hover:shadow-xl transition-all duration-300 border-0 bg-background/60 backdrop-blur-sm hover:-translate-y-2"
              >
                <CardHeader className="text-center pb-4">
                  <div className={`mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section - Simplified to match home page style */}
      <section id="timeline" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-purple-500/5 to-blue-500/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-20">
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-6">
              Your Journey to{" "}
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                AI Excellence
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              From registration to victory - here's your complete hackathon timeline
            </p>
          </div>

          <div className="mx-auto max-w-4xl">
            <div className="space-y-8">
              {timeline.map((event, index) => (
                <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-background/60 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-white transition-all duration-300 group-hover:scale-110 ${
                        event.status === 'main' 
                          ? 'bg-gradient-to-r from-orange-500 to-red-600' 
                          : event.status === 'final'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-600'
                          : 'bg-gradient-to-r from-blue-500 to-purple-600'
                      }`}>
                        {event.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <CardTitle className="text-xl">{event.title}</CardTitle>
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{event.date}</Badge>
                        </div>
                        <CardDescription className="text-base">{event.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Prizes Section - Simplified cards matching home page style */}
      <section className="py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-20">
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-6">
              Incredible{" "}
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Prizes Await
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Compete for life-changing rewards and opportunities
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {/* First Place */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-background/60 backdrop-blur-sm hover:-translate-y-2">
              <CardHeader className="text-center pb-4">
                <div className="absolute top-4 right-4">
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                    <Star className="mr-1 h-3 w-3" />
                    1st Place
                  </Badge>
                </div>
                <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 text-white mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Trophy className="h-8 w-8" />
                </div>
                <CardTitle className="text-xl mb-2">Grand Champion</CardTitle>
                <div className="text-3xl font-bold text-primary mb-4">$25,000</div>
                <CardDescription className="text-sm">
                  Cash prize + equity opportunity<br/>
                  1-year premium mentorship<br/>
                  $15K in cloud credits<br/>
                  Featured startup showcase
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Second Place */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-background/60 backdrop-blur-sm hover:-translate-y-2">
              <CardHeader className="text-center pb-4">
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="bg-gradient-to-r from-gray-500 to-gray-600 text-white">
                    2nd Place
                  </Badge>
                </div>
                <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-gray-500 to-gray-600 text-white mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Trophy className="h-8 w-8" />
                </div>
                <CardTitle className="text-xl mb-2">Runner Up</CardTitle>
                <div className="text-3xl font-bold text-primary mb-4">$15,000</div>
                <CardDescription className="text-sm">
                  Cash prize<br/>
                  6-month mentorship program<br/>
                  $8K in cloud credits<br/>
                  Tech company interviews
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Third Place */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-background/60 backdrop-blur-sm hover:-translate-y-2">
              <CardHeader className="text-center pb-4">
                <div className="absolute top-4 right-4">
                  <Badge variant="outline" className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                    3rd Place
                  </Badge>
                </div>
                <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-white mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Trophy className="h-8 w-8" />
                </div>
                <CardTitle className="text-xl mb-2">Third Place</CardTitle>
                <div className="text-3xl font-bold text-primary mb-4">$10,000</div>
                <CardDescription className="text-sm">
                  Cash prize<br/>
                  3-month mentorship<br/>
                  $5K in cloud credits<br/>
                  Industry recognition
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Special Awards - Grid matching home page style */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-center mb-8">Special Category Awards</h3>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-background/60 backdrop-blur-sm hover:-translate-y-2">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-white mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Lightbulb className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">Most Innovative</CardTitle>
                  <CardDescription className="text-lg font-semibold text-primary">$5,000</CardDescription>
                </CardHeader>
              </Card>
              <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-background/60 backdrop-blur-sm hover:-translate-y-2">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-teal-600 text-white mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">Best Social Impact</CardTitle>
                  <CardDescription className="text-lg font-semibold text-primary">$5,000</CardDescription>
                </CardHeader>
              </Card>
              <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-background/60 backdrop-blur-sm hover:-translate-y-2">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Code className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">Best Technical Implementation</CardTitle>
                  <CardDescription className="text-lg font-semibold text-primary">$5,000</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Following Home Page Design */}
      <section className="py-24 relative overflow-hidden">
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
                className="px-10 py-6 text-lg bg-black hover:bg-black/90 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105" 
                asChild
              >
                <Link href="/auth/signin">
                  <Rocket className="mr-3 h-6 w-6" />
                  Start Your Journey
                  <ChevronRight className="ml-3 h-6 w-6" />
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="px-10 py-6 text-lg border-2 border-black hover:border-black hover:bg-black/10 transition-all duration-300" 
                asChild
              >
                <Link href="/submit">
                  <FileText className="mr-3 h-6 w-6" />
                  Learn More
                </Link>
              </Button>
            </div>

            {/* Trust indicators - same as home page */}
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
    </div>
  );
}
