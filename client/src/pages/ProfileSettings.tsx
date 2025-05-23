import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { User, Settings, Bookmark, BellRing, Book, Code, Brain, Clock } from 'lucide-react';

interface LearningStyle {
  visualLearning: number;
  auditoryLearning: number;
  readingWriting: number;
  kinestheticLearning: number;
  preferredContentTypes: string[];
  studySessionDuration: number;
  dailyGoalMinutes: number;
  preferredStudyTime: 'morning' | 'afternoon' | 'evening' | 'any';
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
  bio: string;
  avatar?: string;
  learningStyle: LearningStyle;
  notificationSettings: {
    studyReminders: boolean;
    reviewDueNotifications: boolean;
    resourceRecommendations: boolean;
    progressReports: boolean;
    emailNotifications: boolean;
  };
}

const ProfileSettings: React.FC = () => {
  // In a real implementation, fetch from API
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['/api/user/profile'],
    queryFn: async () => {
      // Mock data for demonstration
      return {
        id: 1,
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        bio: 'Software engineer passionate about ML and data science. Using KnowledgeWeave to structure my learning journey.',
        avatar: 'https://i.pravatar.cc/150?img=5',
        learningStyle: {
          visualLearning: 80,
          auditoryLearning: 60,
          readingWriting: 75,
          kinestheticLearning: 65,
          preferredContentTypes: ['video', 'interactive'],
          studySessionDuration: 30,
          dailyGoalMinutes: 60,
          preferredStudyTime: 'evening'
        },
        notificationSettings: {
          studyReminders: true,
          reviewDueNotifications: true,
          resourceRecommendations: true,
          progressReports: false,
          emailNotifications: true
        }
      } as UserProfile;
    }
  });
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Update state when data is loaded
  React.useEffect(() => {
    if (userProfile) {
      setProfile(userProfile);
    }
  }, [userProfile]);
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedProfile: UserProfile) => {
      // In a real implementation, make API call
      // For demo, simulate API call
      return new Promise<UserProfile>((resolve) => {
        setTimeout(() => {
          resolve(updatedProfile);
        }, 1000);
      });
    },
    onSuccess: () => {
      toast({
        title: 'Profile updated',
        description: 'Your changes have been saved successfully.',
      });
    }
  });
  
  const handleProfileUpdate = () => {
    if (profile) {
      updateProfileMutation.mutate(profile);
    }
  };
  
  const handleLearningStyleChange = (key: keyof LearningStyle, value: any) => {
    if (profile) {
      setProfile({
        ...profile,
        learningStyle: {
          ...profile.learningStyle,
          [key]: value
        }
      });
    }
  };
  
  const handleNotificationChange = (key: keyof UserProfile['notificationSettings'], value: boolean) => {
    if (profile) {
      setProfile({
        ...profile,
        notificationSettings: {
          ...profile.notificationSettings,
          [key]: value
        }
      });
    }
  };
  
  if (isLoading || !profile) {
    return <div className="flex justify-center items-center h-64">Loading profile settings...</div>;
  }
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-1">Profile Settings</h1>
      <p className="text-muted-foreground mb-6">Manage your account and learning preferences</p>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="learning">
            <Brain className="h-4 w-4 mr-2" />
            Learning Preferences
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <BellRing className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>
        
        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details and public profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img 
                    src={profile.avatar || 'https://i.pravatar.cc/150?img=0'} 
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="absolute bottom-0 right-0 rounded-full h-8 w-8 p-0"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="sr-only">Change avatar</span>
                  </Button>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-lg">{profile.name}</h3>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input 
                  id="name" 
                  value={profile.name} 
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={profile.email} 
                  onChange={(e) => setProfile({...profile, email: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea 
                  id="bio" 
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={profile.bio} 
                  onChange={(e) => setProfile({...profile, bio: e.target.value})}
                />
                <p className="text-xs text-muted-foreground">
                  This will be displayed on your public profile
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleProfileUpdate}>
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Learning Preferences Tab */}
        <TabsContent value="learning">
          <Card>
            <CardHeader>
              <CardTitle>Learning Style Preferences</CardTitle>
              <CardDescription>Customize how you prefer to learn to get the most from your study sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Learning Modalities</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Adjust the sliders to reflect your learning style preferences. This helps us recommend the most effective resources.
                </p>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="visual-learning" className="flex items-center text-sm">
                        <Book className="h-4 w-4 mr-1 text-blue-500" /> Visual Learning
                      </Label>
                      <span className="text-sm">{profile.learningStyle.visualLearning}%</span>
                    </div>
                    <input 
                      id="visual-learning" 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={profile.learningStyle.visualLearning} 
                      onChange={(e) => handleLearningStyleChange('visualLearning', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="auditory-learning" className="flex items-center text-sm">
                        <BellRing className="h-4 w-4 mr-1 text-amber-500" /> Auditory Learning
                      </Label>
                      <span className="text-sm">{profile.learningStyle.auditoryLearning}%</span>
                    </div>
                    <input 
                      id="auditory-learning" 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={profile.learningStyle.auditoryLearning} 
                      onChange={(e) => handleLearningStyleChange('auditoryLearning', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="reading-writing" className="flex items-center text-sm">
                        <Bookmark className="h-4 w-4 mr-1 text-green-500" /> Reading/Writing
                      </Label>
                      <span className="text-sm">{profile.learningStyle.readingWriting}%</span>
                    </div>
                    <input 
                      id="reading-writing" 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={profile.learningStyle.readingWriting} 
                      onChange={(e) => handleLearningStyleChange('readingWriting', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="kinesthetic-learning" className="flex items-center text-sm">
                        <Code className="h-4 w-4 mr-1 text-purple-500" /> Kinesthetic/Interactive
                      </Label>
                      <span className="text-sm">{profile.learningStyle.kinestheticLearning}%</span>
                    </div>
                    <input 
                      id="kinesthetic-learning" 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={profile.learningStyle.kinestheticLearning} 
                      onChange={(e) => handleLearningStyleChange('kinestheticLearning', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="font-medium">Study Preferences</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="session-duration">Preferred Study Session Length</Label>
                    <Select 
                      value={profile.learningStyle.studySessionDuration.toString()} 
                      onValueChange={(value) => handleLearningStyleChange('studySessionDuration', parseInt(value))}
                    >
                      <SelectTrigger id="session-duration">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                        <SelectItem value="90">90 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="daily-goal">Daily Study Goal</Label>
                    <Select 
                      value={profile.learningStyle.dailyGoalMinutes.toString()} 
                      onValueChange={(value) => handleLearningStyleChange('dailyGoalMinutes', parseInt(value))}
                    >
                      <SelectTrigger id="daily-goal">
                        <SelectValue placeholder="Select goal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="90">1.5 hours</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="180">3 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="preferred-time">Preferred Study Time</Label>
                    <Select 
                      value={profile.learningStyle.preferredStudyTime} 
                      onValueChange={(value) => handleLearningStyleChange('preferredStudyTime', value)}
                    >
                      <SelectTrigger id="preferred-time">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning</SelectItem>
                        <SelectItem value="afternoon">Afternoon</SelectItem>
                        <SelectItem value="evening">Evening</SelectItem>
                        <SelectItem value="any">Any time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="content-types">Preferred Content Types</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="content-video" 
                          checked={profile.learningStyle.preferredContentTypes.includes('video')}
                          onChange={(e) => {
                            const types = [...profile.learningStyle.preferredContentTypes];
                            if (e.target.checked) {
                              if (!types.includes('video')) types.push('video');
                            } else {
                              const index = types.indexOf('video');
                              if (index >= 0) types.splice(index, 1);
                            }
                            handleLearningStyleChange('preferredContentTypes', types);
                          }}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="content-video" className="text-sm">Videos</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="content-article" 
                          checked={profile.learningStyle.preferredContentTypes.includes('article')}
                          onChange={(e) => {
                            const types = [...profile.learningStyle.preferredContentTypes];
                            if (e.target.checked) {
                              if (!types.includes('article')) types.push('article');
                            } else {
                              const index = types.indexOf('article');
                              if (index >= 0) types.splice(index, 1);
                            }
                            handleLearningStyleChange('preferredContentTypes', types);
                          }}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="content-article" className="text-sm">Articles</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="content-interactive" 
                          checked={profile.learningStyle.preferredContentTypes.includes('interactive')}
                          onChange={(e) => {
                            const types = [...profile.learningStyle.preferredContentTypes];
                            if (e.target.checked) {
                              if (!types.includes('interactive')) types.push('interactive');
                            } else {
                              const index = types.indexOf('interactive');
                              if (index >= 0) types.splice(index, 1);
                            }
                            handleLearningStyleChange('preferredContentTypes', types);
                          }}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="content-interactive" className="text-sm">Interactive</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="content-course" 
                          checked={profile.learningStyle.preferredContentTypes.includes('course')}
                          onChange={(e) => {
                            const types = [...profile.learningStyle.preferredContentTypes];
                            if (e.target.checked) {
                              if (!types.includes('course')) types.push('course');
                            } else {
                              const index = types.indexOf('course');
                              if (index >= 0) types.splice(index, 1);
                            }
                            handleLearningStyleChange('preferredContentTypes', types);
                          }}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="content-course" className="text-sm">Courses</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleProfileUpdate}>
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Manage when and how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Study Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive daily reminders to complete your study goals
                    </p>
                  </div>
                  <Switch 
                    checked={profile.notificationSettings.studyReminders}
                    onCheckedChange={(checked) => handleNotificationChange('studyReminders', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Review Due Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Alerts when spaced repetition reviews are due
                    </p>
                  </div>
                  <Switch 
                    checked={profile.notificationSettings.reviewDueNotifications}
                    onCheckedChange={(checked) => handleNotificationChange('reviewDueNotifications', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Resource Recommendations</Label>
                    <p className="text-sm text-muted-foreground">
                      Suggestions for new learning resources based on your interests
                    </p>
                  </div>
                  <Switch 
                    checked={profile.notificationSettings.resourceRecommendations}
                    onCheckedChange={(checked) => handleNotificationChange('resourceRecommendations', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Progress Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Weekly summaries of your learning progress
                    </p>
                  </div>
                  <Switch 
                    checked={profile.notificationSettings.progressReports}
                    onCheckedChange={(checked) => handleNotificationChange('progressReports', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email as well as in-app
                    </p>
                  </div>
                  <Switch 
                    checked={profile.notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleProfileUpdate}>
                Save Notification Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfileSettings;
