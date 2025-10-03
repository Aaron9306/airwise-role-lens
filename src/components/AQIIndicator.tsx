import { cn } from "@/lib/utils";

interface AQIIndicatorProps {
  value: number;
  size?: "sm" | "md" | "lg";
}

const getAQIInfo = (aqi: number) => {
  if (aqi <= 50) {
    return {
      level: "Good",
      color: "aqi-good",
      description: "Air quality is satisfactory",
    };
  } else if (aqi <= 100) {
    return {
      level: "Moderate",
      color: "aqi-moderate",
      description: "Air quality is acceptable",
    };
  } else if (aqi <= 150) {
    return {
      level: "Unhealthy for Sensitive Groups",
      color: "aqi-sensitive",
      description: "Sensitive groups may experience health effects",
    };
  } else if (aqi <= 200) {
    return {
      level: "Unhealthy",
      color: "aqi-unhealthy",
      description: "Everyone may begin to experience health effects",
    };
  } else if (aqi <= 300) {
    return {
      level: "Very Unhealthy",
      color: "aqi-very-unhealthy",
      description: "Health alert: everyone may experience serious effects",
    };
  } else {
    return {
      level: "Hazardous",
      color: "aqi-hazardous",
      description: "Health warning of emergency conditions",
    };
  }
};

const AQIIndicator = ({ value, size = "md" }: AQIIndicatorProps) => {
  const info = getAQIInfo(value);
  
  const sizeClasses = {
    sm: "h-20 w-20 text-2xl",
    md: "h-32 w-32 text-4xl",
    lg: "h-48 w-48 text-6xl",
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div
        className={cn(
          "rounded-full flex items-center justify-center font-bold transition-all",
          sizeClasses[size]
        )}
        style={{
          backgroundColor: `hsl(var(--${info.color}))`,
          color: "white",
          boxShadow: `0 8px 32px -4px hsl(var(--${info.color}) / 0.4)`,
        }}
      >
        {value}
      </div>
      <div className="text-center space-y-1">
        <p className="font-semibold text-lg">{info.level}</p>
        <p className="text-sm text-muted-foreground max-w-xs">{info.description}</p>
      </div>
    </div>
  );
};

export default AQIIndicator;
