/**
 * Sparkline SVG component for market data visualization
 */
import React from 'react';
import {View} from 'react-native';
import {SvgXml} from 'react-native-svg';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  lineColor?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 60,
  height = 20,
  color = '#60a5fa',
  lineColor = '#e0e7ff',
}) => {
  if (!data || data.length < 2) {
    return <View style={{width, height}} />;
  }

  const padding = 2;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * plotWidth;
    const y = padding + plotHeight - ((val - min) / range) * plotHeight;
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(' L ')}`;

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <polyline points="${points.join(' ')}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="${padding + plotWidth}" cy="${padding + plotHeight - ((data[data.length - 1] - min) / range) * plotHeight}" r="1.5" fill="${color}" />
    </svg>
  `;

  return <SvgXml xml={svg} width={width} height={height} />;
};

export default Sparkline;
