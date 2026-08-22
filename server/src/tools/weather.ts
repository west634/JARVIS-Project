import type { ToolExecutionResult } from "./types.js";

const WEATHER_CODES: Record<number, string> = {
  0: "clear sky",
  1: "mainly clear",
  2: "partly cloudy",
  3: "overcast",
  45: "fog",
  48: "depositing rime fog",
  51: "light drizzle",
  53: "moderate drizzle",
  55: "dense drizzle",
  61: "slight rain",
  63: "moderate rain",
  65: "heavy rain",
  66: "freezing rain",
  71: "slight snow",
  73: "moderate snow",
  75: "heavy snow",
  80: "rain showers",
  81: "moderate rain showers",
  82: "violent rain showers",
  95: "thunderstorm",
  96: "thunderstorm with hail",
  99: "severe thunderstorm with hail",
};

export async function getWeather(args: Record<string, unknown>): Promise<ToolExecutionResult> {
  const location = String(args.location ?? "").trim();
  if (!location) {
    return { contentForModel: "Error: no location was provided for the weather lookup." };
  }

  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`
  );
  if (!geoRes.ok) {
    return { contentForModel: `Error: location lookup service returned status ${geoRes.status}.` };
  }
  const geo = (await geoRes.json()) as {
    results?: Array<{ latitude: number; longitude: number; name: string; country?: string }>;
  };
  const place = geo.results?.[0];
  if (!place) {
    return { contentForModel: `Error: could not resolve a location for "${location}".` };
  }

  const forecastRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&temperature_unit=celsius&wind_speed_unit=kmh`
  );
  if (!forecastRes.ok) {
    return { contentForModel: `Error: forecast service returned status ${forecastRes.status}.` };
  }
  const forecast = (await forecastRes.json()) as {
    current?: {
      temperature_2m: number;
      apparent_temperature: number;
      relative_humidity_2m: number;
      wind_speed_10m: number;
      weather_code: number;
    };
  };
  const c = forecast.current;
  if (!c) {
    return { contentForModel: "Error: forecast service returned no current conditions." };
  }

  const label = `${place.name}${place.country ? ", " + place.country : ""}`;
  const condition = WEATHER_CODES[c.weather_code] ?? "conditions unavailable";

  return {
    contentForModel: `Live weather for ${label}: ${condition}, temperature ${c.temperature_2m} C (feels like ${c.apparent_temperature} C), humidity ${c.relative_humidity_2m}%, wind ${c.wind_speed_10m} km/h.`,
  };
}
