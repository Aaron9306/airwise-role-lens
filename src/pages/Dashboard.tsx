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
  location_lat: number | null;
  location_lng: number | null;
}

interface AirQualityData {
  aqi: number;
  pm25: number | null;
  pm10: number | null;
  no2: number | null;
  o3: number | null;
  location: string;
  source: string;
}

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  description: string;
  location: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<string>("");
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingData, setLoadingData] = useState(false);

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
      
      // Fetch real-time data if location is available
      if (data.location_lat && data.location_lng) {
        fetchRealTimeData(data);
      } else {
        // Use default values if no location
        setAirQuality({
          aqi: 75,
          pm25: 15,
          pm10: 25,
          no2: 20,
          o3: 50,
          location: 'Default Location',
          source: 'default'
        });
        setWeather({
          temperature: 22,
          humidity: 65,
          windSpeed: 3.5,
          description: 'clear sky',
          location: 'Default Location'
        });
        fetchRecommendations(data, 75, 22, 65);
      }
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

  const fetchRealTimeData = async (profileData: Profile) => {
    setLoadingData(true);
    try {
      const lat = profileData.location_lat || 32.7767; // Default to Dallas
      const lng = profileData.location_lng || -96.7970;

      // Fetch air quality and weather in parallel
      const [aqResponse, weatherResponse] = await Promise.all([
        supabase.functions.invoke('fetch-air-quality', {
          body: { lat, lng }
        }),
        supabase.functions.invoke('fetch-weather', {
          body: { lat, lng }
        })
      ]);

      if (aqResponse.error) throw aqResponse.error;
      if (weatherResponse.error) throw weatherResponse.error;

      setAirQuality(aqResponse.data);
      setWeather(weatherResponse.data);

      // Fetch AI recommendations with real data
      fetchRecommendations(
        profileData,
        aqResponse.data.aqi,
        weatherResponse.data.temperature,
        weatherResponse.data.humidity
      );
    } catch (error: any) {
      console.error('Error fetching real-time data:', error);
      toast({
        title: "Could not load real-time data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const fetchRecommendations = async (
    profileData: Profile,
    aqi: number,
    temperature: number,
    humidity: number
  ) => {
    setLoadingRecommendations(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-recommendations', {
        body: {
          role: profileData.role,
          health_conditions: profileData.health_conditions || [],
          location_name: profileData.location_name,
          aqi,
          temperature,
          humidity
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
              {loadingData ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : airQuality ? (
                <>
                  <AQIIndicator value={airQuality.aqi} />
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    {airQuality.pm25 && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-muted-foreground">PM2.5</p>
                        <p className="font-semibold">{airQuality.pm25.toFixed(1)} µg/m³</p>
                      </div>
                    )}
                    {airQuality.pm10 && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-muted-foreground">PM10</p>
                        <p className="font-semibold">{airQuality.pm10.toFixed(1)} µg/m³</p>
                      </div>
                    )}
                    {airQuality.no2 && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-muted-foreground">NO₂</p>
                        <p className="font-semibold">{airQuality.no2.toFixed(1)} ppb</p>
                      </div>
                    )}
                    {airQuality.o3 && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-muted-foreground">O₃</p>
                        <p className="font-semibold">{airQuality.o3.toFixed(1)} ppb</p>
                      </div>
                    )}
                  </div>
                  {weather && (
                    <div className="mt-4 p-3 rounded-lg bg-gradient-subtle border border-border/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Temperature</p>
                          <p className="text-2xl font-bold">{weather.temperature}°C</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Humidity</p>
                          <p className="text-lg font-semibold">{weather.humidity}%</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 capitalize">{weather.description}</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    Data from {airQuality.source} • Updated in real-time
                  </p>
                </>
              ) : (
                <AQIIndicator value={75} />
              )}
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
