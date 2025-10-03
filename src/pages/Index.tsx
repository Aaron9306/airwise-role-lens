import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wind, Satellite, Users, Activity, MapPin, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-atmosphere">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-sky opacity-20"></div>
        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full">
              <Satellite className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">Powered by NASA TEMPO</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Breathe Easier with{" "}
              <span className="bg-gradient-data bg-clip-text text-transparent">
                Real-Time Air Quality
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Monitor air quality across North America with NASA's cutting-edge TEMPO satellite data. 
              Get personalized insights based on your role and health conditions.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" onClick={() => navigate("/auth")} className="shadow-glow">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Comprehensive Air Quality Monitoring</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Leveraging multiple data sources for accurate, real-time air quality insights
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-card hover:shadow-glow transition-all">
            <CardContent className="pt-6 space-y-3">
              <div className="p-3 bg-primary/10 rounded-lg w-fit">
                <Satellite className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">NASA TEMPO Data</h3>
              <p className="text-sm text-muted-foreground">
                Satellite-based monitoring of NO₂, O₃, and PM2.5 across North America
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-glow transition-all">
            <CardContent className="pt-6 space-y-3">
              <div className="p-3 bg-secondary/10 rounded-lg w-fit">
                <MapPin className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="font-semibold text-lg">Ground-Level Sensors</h3>
              <p className="text-sm text-muted-foreground">
                Validated with OpenAQ ground sensor data for improved accuracy
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-glow transition-all">
            <CardContent className="pt-6 space-y-3">
              <div className="p-3 bg-accent/10 rounded-lg w-fit">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-semibold text-lg">Role-Based Insights</h3>
              <p className="text-sm text-muted-foreground">
                Personalized recommendations for teachers, parents, healthcare workers, and athletes
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-glow transition-all">
            <CardContent className="pt-6 space-y-3">
              <div className="p-3 bg-primary/10 rounded-lg w-fit">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Health Monitoring</h3>
              <p className="text-sm text-muted-foreground">
                Custom alerts and forecasts based on your health conditions
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-data shadow-glow text-primary-foreground">
          <CardContent className="py-12 text-center space-y-6">
            <Wind className="h-16 w-16 mx-auto" />
            <h2 className="text-3xl md:text-4xl font-bold">Ready to Get Started?</h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Join our community monitoring air quality across North America. 
              Create your personalized dashboard in minutes.
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate("/auth")}
              className="mt-4"
            >
              Create Your Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>Powered by NASA TEMPO, OpenAQ, and OpenWeatherMap data</p>
          <p className="mt-2">© 2025 TEMPO Air Quality Monitor. Built for NASA Space Apps Challenge.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
