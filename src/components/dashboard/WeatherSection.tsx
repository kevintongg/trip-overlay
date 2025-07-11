import React from 'react';
import type { SpeedDisplay } from '../../hooks/dashboard/useSpeedDisplay';
import type { WeatherResponse } from '../../types/weather';
import {
  getWeatherIcon,
  getWeatherTemp,
  getWeatherHighLow,
  getWeatherDesc,
  getWeatherFeelsLike,
  getWeatherHumidity,
  getWeatherWind,
  getWeatherUvi,
  getUviClass,
} from '../../utils/dashboard/weatherFormatters';

interface WeatherSectionProps {
  weatherData: WeatherResponse | null | undefined;
  speedDisplay: SpeedDisplay;
  show: boolean;
  showSpeed: boolean;
  units?: string;
}

/**
 * Weather Section Component
 * Displays weather information with optional speed display when cycling
 * Maintains exact styling and logic from original Dashboard
 */
export function WeatherSection({
  weatherData,
  speedDisplay,
  show,
  showSpeed,
  units = 'metric',
}: WeatherSectionProps) {
  if (!show) {
    return null;
  }

  return (
    <div key="weather-section" className="mb-3 w-full">
      <div className="flex items-center justify-center">
        {/* Weather Icon */}
        <div
          key="weather-icon"
          className="text-[1.8em] flex items-center leading-none mr-1 font-emoji drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]"
        >
          {getWeatherIcon(weatherData)}
        </div>

        {/* Temperature Container */}
        <div
          key="temperature"
          className="flex flex-col items-center gap-1 mx-3"
        >
          <div className="text-[1.05em] font-black text-white tracking-wide drop-shadow-[0_3px_12px_rgba(0,0,0,0.9)] font-inter leading-none">
            {getWeatherTemp(weatherData, units)}
          </div>
          <div className="text-[0.8em] text-gray-300 font-medium tracking-wide drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] font-inter whitespace-nowrap opacity-80">
            {getWeatherHighLow(weatherData, units)}
          </div>
        </div>

        {/* Weather Description */}
        <div
          key="weather-desc"
          className="text-[0.9em] text-gray-200 font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] capitalize ml-3 text-left leading-tight"
        >
          {getWeatherDesc(weatherData)}
        </div>

        {/* Speed Display - Only show when cycling and speed is enabled */}
        {showSpeed && speedDisplay.currentMode === 'CYCLING' && (
          <div
            key="speed-display"
            className="flex flex-col items-start ml-2 font-semibold"
          >
            <div className="flex justify-start items-baseline w-full text-[0.98em] font-bold text-green-500 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] font-mono tracking-wider">
              <span className="text-center min-w-[3.5em]">
                {speedDisplay.speedMph}
              </span>
              <span className="ml-2 text-[0.8em] text-green-500 font-medium tracking-wider">
                mph
              </span>
            </div>
            <div className="flex justify-start items-baseline w-full text-[0.98em] font-bold text-green-500 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] font-mono tracking-wider">
              <span className="text-center min-w-[3.5em]">
                {speedDisplay.speedKmh}
              </span>
              <span className="ml-2 text-[0.8em] text-green-500 font-medium tracking-wider">
                km/h
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Additional Weather Details - matching original implementation */}
      <div className="mt-2 w-full text-[0.85em]">
        {/* First line: Feels like and humidity */}
        {(getWeatherFeelsLike(weatherData) ||
          getWeatherHumidity(weatherData)) && (
          <div className="text-center text-gray-300 mb-1">
            {[
              getWeatherFeelsLike(weatherData, units) &&
                `Feels like: ${getWeatherFeelsLike(weatherData, units)}`,
              getWeatherHumidity(weatherData) &&
                `Humidity: ${getWeatherHumidity(weatherData)}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </div>
        )}

        {/* Second line: Wind and UV Index */}
        {(getWeatherWind(weatherData) !== null || getWeatherUvi(weatherData)) && (
          <div className="text-center text-gray-300">
            {[
              getWeatherWind(weatherData) !== null &&
                `Wind: ${getWeatherWind(weatherData)}`,
              getWeatherUvi(weatherData) && (
                <span key="uvi">
                  UV Index:{' '}
                  <span
                    className={`${getUviClass(parseFloat(getWeatherUvi(weatherData)!))} font-mono`}
                  >
                    {getWeatherUvi(weatherData)}
                  </span>
                </span>
              ),
            ]
              .filter(Boolean)
              .map((item, index, array) => (
                <span key={index}>
                  {item}
                  {index < array.length - 1 && ' · '}
                </span>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
