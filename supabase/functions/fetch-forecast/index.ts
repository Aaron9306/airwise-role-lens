import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lat, lng, currentAqi } = await req.json();
    
    console.log('Fetching forecast for coordinates:', { lat, lng, currentAqi });

    const OPENWEATHER_API_KEY = Deno.env.get("OPENWEATHER_API_KEY");
    if (!OPENWEATHER_API_KEY) {
      throw new Error("OPENWEATHER_API_KEY is not configured");
    }

    // Fetch 5-day/3-hour forecast from OpenWeatherMap
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&units=metric&appid=${OPENWEATHER_API_KEY}`;
    
    const response = await fetch(forecastUrl);

    if (!response.ok) {
      throw new Error(`OpenWeatherMap API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenWeatherMap forecast response received');

    // Process forecast data - take next 12 hours (4 data points at 3-hour intervals)
    const forecastPoints = data.list.slice(0, 4).map((item: any, index: number) => {
      const hour = new Date(item.dt * 1000).getHours();
      const windSpeed = item.wind.speed;
      const humidity = item.main.humidity;
      const temp = item.main.temp;
      
      // Predict AQI based on weather conditions
      // Higher wind = better dispersion (lower AQI)
      // Higher humidity = can trap pollutants (higher AQI)
      // Rush hours (7-9am, 5-7pm) = higher pollution
      
      let aqiModifier = 0;
      
      // Wind effect (stronger wind disperses pollution)
      if (windSpeed > 5) aqiModifier -= 15;
      else if (windSpeed > 3) aqiModifier -= 5;
      else if (windSpeed < 1) aqiModifier += 10;
      
      // Humidity effect
      if (humidity > 80) aqiModifier += 10;
      else if (humidity > 60) aqiModifier += 5;
      else if (humidity < 30) aqiModifier -= 5;
      
      // Rush hour effect
      if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
        aqiModifier += 20;
      } else if (hour >= 22 || hour <= 5) {
        aqiModifier -= 10; // Less traffic at night
      }
      
      // Temperature effect (higher temp can increase ground-level ozone)
      if (temp > 30) aqiModifier += 10;
      else if (temp > 25) aqiModifier += 5;
      
      // Calculate predicted AQI
      const predictedAqi = Math.max(0, Math.min(500, currentAqi + aqiModifier));
      
      return {
        time: item.dt * 1000,
        hour: new Date(item.dt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
        aqi: Math.round(predictedAqi),
        temperature: Math.round(temp),
        windSpeed: windSpeed.toFixed(1),
        humidity: humidity,
        description: item.weather[0].description
      };
    });

    console.log('Forecast points generated:', forecastPoints.length);

    return new Response(
      JSON.stringify({ forecast: forecastPoints }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in fetch-forecast function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
