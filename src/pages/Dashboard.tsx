import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Wind, LogOut, MapPin, Activity } from "lucide-react";
import AQIIndicator from "@/components/AQIIndicator";

interface Profile {
  role: string;
  health_conditions: string[];
  location_name: string | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<string>("");
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      setProfile(data);
      
      // Fetch AI recommendations
      fetchRecommendations(data);
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (profileData: Profile) => {
    setLoadingRecommendations(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-recommendations', {
        body: {
          role: profileData.role,
          health_conditions: profileData.health_conditions || [],
          location_name: profileData.location_name,
          aqi: 75, // Example AQI - will be replaced with real data
          temperature: 22,
          humidity: 65
        }
      });

      if (error) throw error;
      setRecommendations(data.recommendations);
    } catch (error: any) {
      console.error('Error fetching recommendations:', error);
      toast({
        title: "Could not load recommendations",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-atmosphere flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-atmosphere">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Wind className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">TEMPO Air Quality</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Welcome Card */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Welcome, {profile?.role?.replace('_', ' ') || 'User'}!</CardTitle>
            <CardDescription>
              Your personalized air quality monitoring dashboard powered by NASA TEMPO data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{profile?.location_name || "Location not set"}</span>
            </div>
            {profile?.health_conditions && profile.health_conditions.length > 0 && (
              <div className="flex items-start space-x-2 mt-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4 mt-0.5" />
                <span>Health considerations: {profile.health_conditions.join(', ')}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current AQI Display */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Current Air Quality</CardTitle>
              <CardDescription>Real-time AQI from NASA TEMPO & OpenAQ</CardDescription>
            </CardHeader>
            <CardContent>
              <AQIIndicator value={75} />
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Live data integration coming soon. Example AQI: 75 (Moderate)
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>Based on your role and health profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingRecommendations ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : recommendations ? (
                <div className="p-4 rounded-lg bg-gradient-subtle border border-border/50">
                  <p className="text-sm whitespace-pre-line leading-relaxed">{recommendations}</p>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    AI recommendations will appear here based on your profile and current air quality.
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Powered by Lovable AI • Updates based on real-time conditions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Map Placeholder */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Air Quality Map</CardTitle>
            <CardDescription>Interactive map with AQI overlays</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96 bg-gradient-sky rounded-lg flex items-center justify-center">
              <div className="text-center space-y-2">
                <MapPin className="h-12 w-12 text-primary-foreground mx-auto" />
                <p className="text-primary-foreground font-medium">Interactive Map</p>
                <p className="text-primary-foreground/80 text-sm">
                  Coming soon: Real-time air quality visualization
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
