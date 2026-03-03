'use client';

export default function LoginIllustration() {
  return (
    <div className="relative w-full max-w-lg mx-auto" aria-hidden="true">
      <svg
        viewBox="0 0 600 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-2xl"
      >
        {/* Sky gradient */}
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
          </linearGradient>
          <linearGradient id="roadGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.15)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
          </linearGradient>
        </defs>

        {/* Background */}
        <rect width="600" height="320" fill="url(#skyGrad)" rx="16" />

        {/* Stars */}
        {[
          [80, 30], [150, 50], [250, 20], [350, 45], [450, 25], [520, 55],
          [120, 65], [320, 60], [480, 40], [200, 35],
        ].map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={1.5}
            fill="rgba(255,255,255,0.4)"
            className="animate-twinkle"
            style={{ animationDelay: `${i * 0.3}s` }}
          />
        ))}

        {/* City skyline */}
        <g fill="rgba(255,255,255,0.12)">
          {/* Building cluster left */}
          <rect x="40" y="120" width="35" height="120" rx="2" />
          <rect x="50" y="100" width="25" height="140" rx="2" />
          <rect x="80" y="140" width="30" height="100" rx="2" />
          <rect x="115" y="110" width="20" height="130" rx="2" />
          <rect x="140" y="130" width="28" height="110" rx="2" />

          {/* Building cluster center */}
          <rect x="220" y="90" width="30" height="150" rx="2" />
          <rect x="255" y="105" width="25" height="135" rx="2" />
          <rect x="285" y="125" width="35" height="115" rx="2" />
          <rect x="325" y="100" width="22" height="140" rx="2" />

          {/* Building cluster right */}
          <rect x="400" y="115" width="28" height="125" rx="2" />
          <rect x="433" y="130" width="32" height="110" rx="2" />
          <rect x="470" y="105" width="25" height="135" rx="2" />
          <rect x="500" y="125" width="30" height="115" rx="2" />
          <rect x="535" y="140" width="25" height="100" rx="2" />
        </g>

        {/* Building windows */}
        <g fill="rgba(255,255,200,0.25)">
          {/* Left cluster windows */}
          {[130, 150, 170, 190, 210].map((y) => (
            <g key={`lw-${y}`}>
              <rect x="55" y={y} width="4" height="4" rx="0.5" />
              <rect x="63" y={y} width="4" height="4" rx="0.5" />
              <rect x="88" y={y} width="4" height="4" rx="0.5" />
              <rect x="96" y={y} width="4" height="4" rx="0.5" />
            </g>
          ))}
          {/* Center cluster windows */}
          {[115, 135, 155, 175, 195].map((y) => (
            <g key={`cw-${y}`}>
              <rect x="228" y={y} width="4" height="4" rx="0.5" />
              <rect x="238" y={y} width="4" height="4" rx="0.5" />
              <rect x="293" y={y} width="4" height="4" rx="0.5" />
              <rect x="303" y={y} width="4" height="4" rx="0.5" />
            </g>
          ))}
          {/* Right cluster windows */}
          {[140, 160, 180, 200].map((y) => (
            <g key={`rw-${y}`}>
              <rect x="440" y={y} width="4" height="4" rx="0.5" />
              <rect x="450" y={y} width="4" height="4" rx="0.5" />
              <rect x="507" y={y} width="4" height="4" rx="0.5" />
              <rect x="517" y={y} width="4" height="4" rx="0.5" />
            </g>
          ))}
        </g>

        {/* Road */}
        <rect x="0" y="240" width="600" height="60" fill="url(#roadGrad)" rx="0" />
        <rect x="0" y="240" width="600" height="2" fill="rgba(255,255,255,0.2)" />
        <rect x="0" y="298" width="600" height="2" fill="rgba(255,255,255,0.2)" />

        {/* Road dashes */}
        <g fill="rgba(255,255,255,0.3)">
          {[0, 60, 120, 180, 240, 300, 360, 420, 480, 540].map((x) => (
            <rect key={`dash-${x}`} x={x} y="268" width="35" height="3" rx="1.5" />
          ))}
        </g>

        {/* Vehicle 1 - sedan going right */}
        <g className="animate-drive-right">
          {/* Car body */}
          <rect x="0" y="250" width="52" height="18" rx="5" fill="rgba(255,255,255,0.35)" />
          <rect x="8" y="242" width="32" height="12" rx="4" fill="rgba(255,255,255,0.25)" />
          {/* Windows */}
          <rect x="12" y="244" width="12" height="8" rx="2" fill="rgba(255,255,255,0.15)" />
          <rect x="27" y="244" width="10" height="8" rx="2" fill="rgba(255,255,255,0.15)" />
          {/* Wheels */}
          <circle cx="14" cy="270" r="5" fill="rgba(255,255,255,0.3)" />
          <circle cx="14" cy="270" r="2.5" fill="rgba(255,255,255,0.15)" />
          <circle cx="40" cy="270" r="5" fill="rgba(255,255,255,0.3)" />
          <circle cx="40" cy="270" r="2.5" fill="rgba(255,255,255,0.15)" />
          {/* Headlight */}
          <rect x="49" y="255" width="4" height="4" rx="1" fill="rgba(255,255,200,0.5)" />
        </g>

        {/* Vehicle 2 - SUV going left */}
        <g className="animate-drive-left">
          <rect x="580" y="275" width="58" height="20" rx="5" fill="rgba(255,255,255,0.3)" />
          <rect x="588" y="265" width="38" height="14" rx="4" fill="rgba(255,255,255,0.22)" />
          <rect x="592" y="267" width="14" height="9" rx="2" fill="rgba(255,255,255,0.12)" />
          <rect x="610" y="267" width="12" height="9" rx="2" fill="rgba(255,255,255,0.12)" />
          <circle cx="596" cy="297" r="5.5" fill="rgba(255,255,255,0.3)" />
          <circle cx="596" cy="297" r="2.5" fill="rgba(255,255,255,0.15)" />
          <circle cx="626" cy="297" r="5.5" fill="rgba(255,255,255,0.3)" />
          <circle cx="626" cy="297" r="2.5" fill="rgba(255,255,255,0.15)" />
          <rect x="576" y="281" width="4" height="4" rx="1" fill="rgba(255,200,200,0.5)" />
        </g>

        {/* Vehicle 3 - small car going right (slower) */}
        <g className="animate-drive-right-slow">
          <rect x="-80" y="252" width="45" height="16" rx="5" fill="rgba(255,255,255,0.28)" />
          <rect x="-74" y="244" width="28" height="11" rx="4" fill="rgba(255,255,255,0.2)" />
          <rect x="-70" y="246" width="10" height="7" rx="2" fill="rgba(255,255,255,0.12)" />
          <rect x="-57" y="246" width="9" height="7" rx="2" fill="rgba(255,255,255,0.12)" />
          <circle cx={-68} cy="270" r="4.5" fill="rgba(255,255,255,0.28)" />
          <circle cx={-68} cy="270" r="2" fill="rgba(255,255,255,0.14)" />
          <circle cx={-44} cy="270" r="4.5" fill="rgba(255,255,255,0.28)" />
          <circle cx={-44} cy="270" r="2" fill="rgba(255,255,255,0.14)" />
          <rect x="-38" y="256" width="3" height="3" rx="1" fill="rgba(255,255,200,0.45)" />
        </g>

        {/* Moon */}
        <circle cx="520" cy="50" r="20" fill="rgba(255,255,255,0.08)" />
        <circle cx="526" cy="44" r="18" fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      </svg>
    </div>
  );
}
