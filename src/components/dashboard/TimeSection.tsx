import React from 'react';
import type { TimeDisplay } from '../../hooks/dashboard/useTimeDisplay';

interface TimeSectionProps {
  timeDisplay: TimeDisplay;
  show: boolean;
}

/**
 * Time Section Component
 * Displays date, time, and timezone information
 * Maintains exact styling from original Dashboard
 */
export function TimeSection({ timeDisplay, show }: TimeSectionProps) {
  if (!show) {
    return null;
  }

  return (
    <div className="flex items-center gap-[18px] text-[1em] text-gray-300 w-full justify-center">
      <span className="text-[1em] text-gray-300 font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
        {timeDisplay.dateStr}
      </span>
      <span className="font-mono tracking-wider text-[1em] text-gray-300 font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
        {timeDisplay.timeStr}
      </span>
      <span className="text-[1em] text-gray-300 font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
        {timeDisplay.tzStr}
      </span>
    </div>
  );
}
