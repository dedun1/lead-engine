'use client';

import { useEffect, useState } from 'react';

export type ChartColors = {
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
};

function readChartColors(): ChartColors {
  if (typeof document === 'undefined') {
    return {
      chart1: '#635bff',
      chart2: '#0cb5c7',
      chart3: '#00d924',
      chart4: '#ff5630',
      chart5: '#ffab00',
    };
  }
  const root = document.documentElement;
  const style = getComputedStyle(root);
  const pick = (name: string, fallback: string) =>
    style.getPropertyValue(name).trim() || fallback;

  return {
    chart1: pick('--chart-1', '#635bff'),
    chart2: pick('--chart-2', '#0cb5c7'),
    chart3: pick('--chart-3', '#00d924'),
    chart4: pick('--chart-4', '#ff5630'),
    chart5: pick('--chart-5', '#ffab00'),
  };
}

/** Read --chart-1 … --chart-5 from the active theme on <html>. */
export function useChartColors(): ChartColors {
  const [colors, setColors] = useState<ChartColors>(readChartColors);

  useEffect(() => {
    const sync = () => setColors(readChartColors());
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  return colors;
}
