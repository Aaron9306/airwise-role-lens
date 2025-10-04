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
    const { lat, lng } = await req.json();
    
    console.log('Fetching air quality for coordinates:', { lat, lng });

    // Fetch from OpenAQ API
    const openaqUrl = `https://api.openaq.org/v2/latest?coordinates=${lat},${lng}&radius=25000&limit=1`;
    
    const response = await fetch(openaqUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`OpenAQ API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAQ response:', data);

    if (!data.results || data.results.length === 0) {
      // Return default values if no data available
      return new Response(
        JSON.stringify({
          aqi: 75,
          pm25: 15,
          pm10: 25,
          no2: 20,
          o3: 50,
          location: 'Estimated',
          source: 'default'
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = data.results[0];
    const measurements = result.measurements || [];
    
    // Extract pollutant values
    const pm25 = measurements.find((m: any) => m.parameter === 'pm25')?.value || null;
    const pm10 = measurements.find((m: any) => m.parameter === 'pm10')?.value || null;
    const no2 = measurements.find((m: any) => m.parameter === 'no2')?.value || null;
    const o3 = measurements.find((m: any) => m.parameter === 'o3')?.value || null;

    // Calculate AQI from PM2.5 (simplified calculation)
    let aqi = 50; // Default moderate
    if (pm25) {
      if (pm25 <= 12) aqi = Math.round((50 / 12) * pm25);
      else if (pm25 <= 35.4) aqi = Math.round(50 + ((100 - 50) / (35.4 - 12.1)) * (pm25 - 12.1));
      else if (pm25 <= 55.4) aqi = Math.round(100 + ((150 - 100) / (55.4 - 35.5)) * (pm25 - 35.5));
      else if (pm25 <= 150.4) aqi = Math.round(150 + ((200 - 150) / (150.4 - 55.5)) * (pm25 - 55.5));
      else if (pm25 <= 250.4) aqi = Math.round(200 + ((300 - 200) / (250.4 - 150.5)) * (pm25 - 150.5));
      else aqi = Math.round(300 + ((500 - 300) / (500.4 - 250.5)) * (pm25 - 250.5));
    }

    return new Response(
      JSON.stringify({
        aqi,
        pm25,
        pm10,
        no2,
        o3,
        location: result.location,
        source: 'OpenAQ'
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in fetch-air-quality function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
