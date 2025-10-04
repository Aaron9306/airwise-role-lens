import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { role, health_conditions, location_name, aqi, temperature, humidity } = await req.json();
    
    console.log('Generating recommendations for:', { role, health_conditions, location_name, aqi });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Determine AQI category
    let aqiCategory = "Good";
    if (aqi > 200) aqiCategory = "Very Unhealthy";
    else if (aqi > 150) aqiCategory = "Unhealthy";
    else if (aqi > 100) aqiCategory = "Unhealthy for Sensitive Groups";
    else if (aqi > 50) aqiCategory = "Moderate";

    const systemPrompt = `You are an air quality health advisor. Provide concise, actionable recommendations based on the user's role and current air quality conditions. Be specific and practical.`;

    const userPrompt = `Role: ${role.replace('_', ' ')}
Location: ${location_name || 'User location'}
Current AQI: ${aqi} (${aqiCategory})
Temperature: ${temperature}°C
Humidity: ${humidity}%
Health considerations: ${health_conditions?.join(', ') || 'None'}

Provide 2-3 specific, actionable recommendations for this person based on their role and the current air quality. Keep it concise and practical.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const recommendations = data.choices[0].message.content;

    console.log('Generated recommendations:', recommendations);

    return new Response(
      JSON.stringify({ recommendations }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-recommendations function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
