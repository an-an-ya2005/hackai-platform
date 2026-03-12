"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Menu, 
  Trophy, 
  Users, 
  FileText, 
  BarChart3, 
  LogOut, 
  Sparkles,
  User,
  Settings,
  ChevronDown,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { NotificationBell } from "@/components/notification-bell";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <BarChart3 className="h-4 w-4" />,
    roles: ["PARTICIPANT"], // Only participants can access dashboard
  },
  {
    title: "Submit Idea",
    href: "/submit",
    icon: <FileText className="h-4 w-4" />,
    roles: ["PARTICIPANT"], // Only participants can submit ideas
  },
  {
    title: "My Applications",
    href: "/applications",
    icon: <Trophy className="h-4 w-4" />,
    roles: ["PARTICIPANT"], // Only participants have applications
  },
  {
    title: "Notifications",
    href: "/notifications",
    icon: <Bell className="h-4 w-4" />,
    roles: ["PARTICIPANT"], // Only participants get notifications
  },
  {
    title: "Admin Panel",
    href: "/admin",
    icon: <Users className="h-4 w-4" />,
    roles: ["ADMIN"], // Only admins can access admin panel
  },
];

export function Navigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  const NavLinks = ({ isMobile = false }) => (
    <>
      {filteredNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => isMobile && setIsOpen(false)}
          className={cn(
            "group relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
            isMobile ? "w-full" : "",
            pathname === item.href
              ? "bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg shadow-primary/25"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/80 hover:scale-105"
          )}
        >
          <div className={cn(
            "transition-all duration-300",
            pathname === item.href ? "scale-110" : "group-hover:scale-110"
          )}>
            {item.icon}
          </div>
          {item.title}
          {pathname === item.href && !isMobile && (
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
          )}
        </Link>
      ))}
    </>
  );

  return (
    <nav className={cn(
      "sticky top-0 z-50 border-b transition-all duration-300",
      scrolled 
        ? "bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-lg shadow-black/5" 
        : "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    )}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Enhanced Logo */}
          <div className="flex items-center">
            <Link href="/" className="group flex items-center gap-3 transition-all duration-300 hover:scale-105">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 rounded-xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300" />
                <div className="relative p-2 bg-gradient-to-r from-primary to-blue-600 rounded-xl">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  Hack-Ai thon
                </span>
                <span className="text-xs text-muted-foreground -mt-1">2025</span>
              </div>
            </Link>
          </div>

          {/* Enhanced Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <NavLinks />
            {/* About Link */}
            <Link
              href="/about"
              className={cn(
                "group relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                pathname === "/about"
                  ? "bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg shadow-primary/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/80 hover:scale-105"
              )}
            >
              <Sparkles className={cn(
                "h-4 w-4 transition-all duration-300",
                pathname === "/about" ? "scale-110" : "group-hover:scale-110"
              )} />
              About
              {pathname === "/about" && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
              )}
            </Link>
          </div>

          {/* Enhanced Right Side */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {isAuthenticated && user ? (
              <>
                {/* Notifications Bell */}
                <NotificationBell />

                {/* Enhanced User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="group relative h-10 gap-2 rounded-xl px-3 hover:bg-muted/80 transition-all duration-300 hover:scale-105">
                      <Avatar className="h-7 w-7 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300">
                        <AvatarImage src={user.avatar} alt={user.name || 'User'} />
                        <AvatarFallback className="bg-gradient-to-r from-primary to-blue-600 text-white text-xs font-semibold">
                          {user.name ? user.name.split(" ").map((n) => n[0]).join("") : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:block text-sm font-medium">
                        {user.name?.split(" ")[0] || 'User'}
                      </span>
                      <ChevronDown className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-all duration-300" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 p-2" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal p-3 bg-gradient-to-r from-primary/5 to-blue-600/5 rounded-lg mb-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar} alt={user.name || 'User'} />
                          <AvatarFallback className="bg-gradient-to-r from-primary to-blue-600 text-white font-semibold">
                            {user.name ? user.name.split(" ").map((n) => n[0]).join("") : "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <p className="text-sm font-semibold leading-none">{user.name || 'User'}</p>
                          <p className="text-xs leading-none text-muted-foreground mt-1">
                            {user.email}
                          </p>
                          <Badge variant="secondary" className="mt-2 w-fit text-xs">
                            {user.role || 'Participant'}
                          </Badge>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem className="gap-2 p-3 rounded-lg cursor-pointer hover:bg-muted/80 transition-all duration-200">
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem className="gap-2 p-3 rounded-lg cursor-pointer hover:bg-muted/80 transition-all duration-200">
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                      onClick={logout}
                      className="gap-2 p-3 rounded-lg cursor-pointer text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" className="hover:bg-black/10 text-black dark:text-white dark:hover:bg-white/10 transition-all duration-300 hover:scale-105" asChild>
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
                <Button className="bg-black hover:bg-black/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" asChild>
                  <Link href="/auth/signin">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Get Started
                  </Link>
                </Button>
              </div>
            )}

            {/* Enhanced Mobile menu */}
            <div className="md:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-muted/80 transition-all duration-300 hover:scale-105">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 p-0">
                  <div className="flex flex-col h-full">
                    {/* Mobile Header */}
                    <div className="p-6 border-b bg-gradient-to-r from-primary/5 to-blue-600/5">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 rounded-xl blur opacity-25" />
                          <div className="relative p-2 bg-gradient-to-r from-primary to-blue-600 rounded-xl">
                            <Trophy className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">Hack-Ai thon</h3>
                          <p className="text-sm text-muted-foreground">2025 Edition</p>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Navigation */}
                    <div className="flex-1 overflow-y-auto p-6">
                      <div className="space-y-2">
                        <NavLinks isMobile />
                        <Link
                          href="/about"
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "group relative flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 w-full",
                            pathname === "/about"
                              ? "bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg shadow-primary/25"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                          )}
                        >
                          <Sparkles className="h-4 w-4" />
                          About
                        </Link>
                      </div>
                    </div>

                    {/* Mobile User Section */}
                    {isAuthenticated && user && (
                      <div className="p-6 border-t bg-muted/20">
                        <div className="flex items-center gap-3 mb-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar} alt={user.name || 'User'} />
                            <AvatarFallback className="bg-gradient-to-r from-primary to-blue-600 text-white font-semibold">
                              {user.name ? user.name.split(" ").map((n) => n[0]).join("") : "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">{user.name || 'User'}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <Button 
                          onClick={logout}
                          className="w-full gap-2 bg-black hover:bg-black/90 text-white transition-all duration-200"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign out
                        </Button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
