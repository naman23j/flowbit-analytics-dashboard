import React from 'react';

type Props = {
  width?: number | string;
  height?: number | string;
  className?: string;
};

// Decorative donut chart SVG matching Figma design 
export default function DecorativeDonut({ width = 192.5, height = 192.5, className = '' }: Props) {
  const cx = 96.25;
  const cy = 96.25;
  const outerRadius = 78;
  const innerRadius = 50;
  
  // Helper to create arc path
  const describeArc = (startAngle: number, endAngle: number, outer: number, inner: number) => {
    const startOuter = polarToCartesian(cx, cy, outer, endAngle);
    const endOuter = polarToCartesian(cx, cy, outer, startAngle);
    const startInner = polarToCartesian(cx, cy, inner, endAngle);
    const endInner = polarToCartesian(cx, cy, inner, startAngle);
    
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    
    return [
      'M', startOuter.x, startOuter.y,
      'A', outer, outer, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
      'L', endInner.x, endInner.y,
      'A', inner, inner, 0, largeArcFlag, 1, startInner.x, startInner.y,
      'Z'
    ].join(' ');
  };
  
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };
  
  // Based on screenshot proportions:
  // Operations (Blue): ~60% = 216 degrees, bottom-left to right
  // Marketing (Orange): ~30% instead of de= 108 degrees, right side
  // Facilities (Peach): ~10% = 36 degrees, top
  
  const operationsPath = describeArc(144, 360, outerRadius, innerRadius); // 216 deg
  const marketingPath = describeArc(0, 108, outerRadius, innerRadius);    // 108 deg
  const facilitiesPath = describeArc(108, 144, outerRadius, innerRadius);  // 36 deg

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 192.5 192.5"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.05))' }}
    >
      {/* Subtle background circle */}
      <circle cx={cx} cy={cy} r="88" fill="#F5F5F5" />

      {/* Operations segment - Blue - largest (60%) */}
      <path d={operationsPath} fill="#2B4DED" />

      {/* Marketing segment - Orange - medium (30%) */}
      <path d={marketingPath} fill="#FF9E69" />

      {/* Facilities segment - Peach - small (10%) */}
      <path d={facilitiesPath} fill="#FFD1A7" />

      {/* Inner white circle (donut hole) */}
      <circle cx={cx} cy={cy} r={innerRadius} fill="#FFFFFF" />
    </svg>
  );
}
