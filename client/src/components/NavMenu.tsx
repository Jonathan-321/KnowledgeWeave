import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  BookOpen, 
  FileText, 
  Network, 
  BarChart2, 
  User, 
  Settings, 
  Database,
  Brain
} from 'lucide-react';

interface NavLink {
  name: string;
  path: string;
  icon: React.ReactNode;
  description: string;
}

const NavMenu: React.FC = () => {
  const [location] = useLocation();

  const links: NavLink[] = [
    {
      name: 'Home',
      path: '/',
      icon: <Home className="h-4 w-4" />,
      description: 'Dashboard overview'
    },
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <BarChart2 className="h-4 w-4" />,
      description: 'Learning progress & recommendations'
    },
    {
      name: 'Learning',
      path: '/learning',
      icon: <Brain className="h-4 w-4" />,
      description: 'Practice with adaptive quizzes'
    },
    {
      name: 'Documents',
      path: '/documents',
      icon: <FileText className="h-4 w-4" />,
      description: 'Manage your learning resources'
    },
    {
      name: 'Knowledge Graph',
      path: '/knowledge',
      icon: <Network className="h-4 w-4" />,
      description: 'Explore concept connections'
    },
    {
      name: 'Statistics',
      path: '/statistics',
      icon: <BarChart2 className="h-4 w-4" />,
      description: 'Detailed learning analytics'
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: <User className="h-4 w-4" />,
      description: 'Manage account settings'
    }
  ];

  const isActive = (path: string) => {
    // Handle special cases for paths that might have multiple routes
    if (path === '/knowledge' && (location === '/knowledge' || location === '/graph')) {
      return true;
    }
    return location === path;
  };

  return (
    <div className="flex flex-col space-y-1">
      {links.map((link) => (
        <Button
          key={link.path}
          variant={isActive(link.path) ? "default" : "ghost"}
          className={`justify-start ${isActive(link.path) ? '' : 'hover:bg-accent hover:text-accent-foreground'}`}
          onClick={() => window.location.href = link.path}
        >
          <span className="mr-2">{link.icon}</span>
          {link.name}
        </Button>
      ))}
    </div>
  );
};

export default NavMenu;
