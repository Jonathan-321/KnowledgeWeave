import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Brain, Upload, Bell, Menu, Sun, Moon, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Knowledge Graph", href: "/knowledge" },
    { label: "Documents", href: "/documents" },
    { label: "Learning", href: "/learning" },
    { label: "Insights", href: "/insights" },
  ];

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Brain className="text-primary mr-2" size={24} />
              <span className="text-xl font-bold text-primary">NexusLearn</span>
            </div>
            <nav className="hidden md:ml-8 md:flex md:space-x-8">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <a
                    className={`${
                      location === link.href
                        ? "border-b-2 border-primary text-primary"
                        : "border-transparent text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
                    } px-1 py-2 text-sm font-medium`}
                  >
                    {link.label}
                  </a>
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Button className="flex items-center">
                <Upload className="mr-2" size={16} />
                <span>Add Document</span>
              </Button>
            </div>
            <div className="ml-4 md:flex items-center md:ml-6">
              <button className="p-1 rounded-full text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary focus:outline-none">
                <Bell size={20} />
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="ml-3 max-w-xs bg-neutral-200 dark:bg-gray-800 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                      <span className="text-xs font-medium">JS</span>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
                    {theme === "light" ? (
                      <Moon className="mr-2" size={16} />
                    ) : (
                      <Sun className="mr-2" size={16} />
                    )}
                    <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <LogOut className="mr-2" size={16} />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <button
              type="button"
              className="md:hidden ml-2 inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary focus:outline-none"
              onClick={toggleSidebar}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${mobileMenuOpen ? "" : "hidden"}`} id="mobile-menu">
        <div className="pt-2 pb-3 space-y-1">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <a
                className={`${
                  location === link.href
                    ? "bg-primary text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-neutral-200 dark:hover:bg-gray-800"
                } block pl-3 pr-4 py-2 text-base font-medium`}
              >
                {link.label}
              </a>
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
