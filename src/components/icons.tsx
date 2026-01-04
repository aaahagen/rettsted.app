import type { SVGProps } from 'react';

export function RettStedLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg 
      width="900" 
      height="220" 
      viewBox="0 0 900 220" 
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g transform="translate(110,110)">
        <circle r="90" fill="none" stroke="#1F4FD8" strokeWidth="8"/>
        <circle r="72" fill="none" stroke="#000000" strokeWidth="6"/>
        <circle r="56" fill="none" stroke="#1F4FD8" strokeWidth="6"/>
        <circle r="40" fill="none" stroke="#F28C28" strokeWidth="8"/>
        <circle r="24" fill="none" stroke="#000000" strokeWidth="4"/>
        <circle r="6" fill="#000000"/>
      </g>
      <text x="240" y="135" fontSize="86" fontFamily="Arial, Helvetica, sans-serif" fontWeight="600">
        <tspan fill="#1F4FD8">Rett</tspan>
        <tspan fill="#F28C28" fontSize="102" dy="6" fontWeight="700" style={{letterSpacing: '1px'}}>S</tspan>
        <tspan fill="#1F4FD8" fontSize="86" dy="-6">ted</tspan>
      </text>
    </svg>
  );
}
