import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

interface ForecastPoint {
  time: number;
  hour: string;
  aqi: number;
  temperature: number;
  windSpeed: string;
  humidity: number;
  description: string;
}

interface ForecastChartProps {
  forecast: ForecastPoint[];
  loading: boolean;
}

const getAQIColor = (aqi: number) => {
  if (aqi <= 50) return "hsl(var(--aqi-good))";
  if (aqi <= 100) return "hsl(var(--aqi-moderate))";
  if (aqi <= 150) return "hsl(var(--aqi-sensitive))";
  if (aqi <= 200) return "hsl(var(--aqi-unhealthy))";
  if (aqi <= 300) return "hsl(var(--aqi-very-unhealthy))";
  return "hsl(var(--aqi-hazardous))";
};

const getAQICategory = (aqi: number) => {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-sm mb-2">{data.hour}</p>
        <div className="space-y-1 text-xs">
          <p className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">AQI:</span>
            <span className="font-semibold" style={{ color: getAQIColor(data.aqi) }}>
              {data.aqi} ({getAQICategory(data.aqi)})
            </span>
          </p>
          <p className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Temp:</span>
            <span className="font-medium">{data.temperature}°C</span>
          </p>
          <p className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Wind:</span>
            <span className="font-medium">{data.windSpeed} m/s</span>
          </p>
          <p className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Humidity:</span>
            <span className="font-medium">{data.humidity}%</span>
          </p>
          <p className="text-muted-foreground capitalize mt-2">{data.description}</p>
        </div>
      </div>
    );
  }
  return null;
};

const ForecastChart = ({ forecast, loading }: ForecastChartProps) => {
  if (loading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>12-Hour AQI Forecast</CardTitle>
          <CardDescription>Predicted air quality trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!forecast || forecast.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>12-Hour AQI Forecast</CardTitle>
          <CardDescription>Predicted air quality trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">No forecast data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>12-Hour AQI Forecast</CardTitle>
        <CardDescription>Predicted trends based on weather patterns</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={forecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="hour" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              domain={[0, 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="aqi"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              fill="url(#aqiGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
        
        {/* Forecast details */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {forecast.map((point, index) => (
            <div key={index} className="p-3 rounded-lg border border-border/50 bg-gradient-subtle">
              <p className="text-xs text-muted-foreground mb-1">{point.hour}</p>
              <p className="text-2xl font-bold" style={{ color: getAQIColor(point.aqi) }}>
                {point.aqi}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {getAQICategory(point.aqi)}
              </p>
            </div>
          ))}
        </div>
        
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Forecast based on weather patterns • Updated hourly
        </p>
      </CardContent>
    </Card>
  );
};

export default ForecastChart;
