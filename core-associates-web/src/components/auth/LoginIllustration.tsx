'use client';

export default function LoginIllustration() {
  return (
    <div className="relative w-full max-w-2xl mx-auto animate-float" aria-hidden="true">
      <svg
        viewBox="0 0 700 380"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-2xl"
      >
        {/* Sky gradient */}
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
          </linearGradient>
          <linearGradient id="roadGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.15)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
          </linearGradient>
          <radialGradient id="moonGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <radialGradient id="lampGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="rgba(255,255,200,0.2)" />
            <stop offset="100%" stopColor="rgba(255,255,200,0)" />
          </radialGradient>
        </defs>

        {/* Background */}
        <rect width="700" height="380" fill="url(#skyGrad)" rx="20" />

        {/* Moon glow */}
        <circle cx="600" cy="55" r="50" fill="url(#moonGlow)" className="animate-pulse-glow" />
        <circle cx="600" cy="55" r="22" fill="rgba(255,255,255,0.1)" />
        <circle cx="607" cy="48" r="20" fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

        {/* Stars - more and bigger */}
        {[
          [60, 25], [130, 50], [200, 18], [280, 42], [360, 22], [440, 55],
          [520, 30], [100, 70], [340, 65], [480, 38], [170, 40], [410, 18],
          [550, 68], [30, 55], [240, 58], [650, 35], [580, 18], [70, 45],
        ].map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={i % 3 === 0 ? 2 : 1.5}
            fill="rgba(255,255,255,0.5)"
            className="animate-twinkle"
            style={{ animationDelay: `${i * 0.25}s` }}
          />
        ))}

        {/* City skyline - taller buildings */}
        <g fill="rgba(255,255,255,0.12)">
          {/* Left cluster */}
          <rect x="30" y="110" width="40" height="170" rx="2" />
          <rect x="42" y="85" width="28" height="195" rx="2" />
          <rect x="75" y="130" width="35" height="150" rx="2" />
          <rect x="115" y="95" width="24" height="185" rx="2" />
          <rect x="144" y="120" width="32" height="160" rx="2" />
          <rect x="180" y="145" width="22" height="135" rx="2" />

          {/* Center cluster */}
          <rect x="240" y="80" width="34" height="200" rx="2" />
          <rect x="278" y="100" width="28" height="180" rx="2" />
          <rect x="310" y="120" width="40" height="160" rx="2" />
          <rect x="355" y="90" width="26" height="190" rx="2" />
          <rect x="385" y="115" width="30" height="165" rx="2" />

          {/* Right cluster */}
          <rect x="450" y="105" width="32" height="175" rx="2" />
          <rect x="487" y="125" width="38" height="155" rx="2" />
          <rect x="530" y="95" width="28" height="185" rx="2" />
          <rect x="562" y="120" width="34" height="160" rx="2" />
          <rect x="600" y="140" width="28" height="140" rx="2" />
          <rect x="635" y="130" width="35" height="150" rx="2" />
        </g>

        {/* Building windows - warm yellow */}
        <g fill="rgba(255,255,200,0.3)">
          {[130, 155, 180, 205, 230, 250].map((y) => (
            <g key={`lw-${y}`}>
              <rect x="48" y={y} width="4" height="4" rx="0.5" />
              <rect x="57" y={y} width="4" height="4" rx="0.5" />
              <rect x="83" y={y} width="4" height="4" rx="0.5" />
              <rect x="93" y={y} width="4" height="4" rx="0.5" />
              <rect x="121" y={y} width="4" height="4" rx="0.5" />
            </g>
          ))}
          {[110, 135, 160, 185, 210, 240].map((y) => (
            <g key={`cw-${y}`}>
              <rect x="248" y={y} width="4" height="4" rx="0.5" />
              <rect x="258" y={y} width="4" height="4" rx="0.5" />
              <rect x="316" y={y} width="4" height="4" rx="0.5" />
              <rect x="328" y={y} width="4" height="4" rx="0.5" />
              <rect x="361" y={y} width="4" height="4" rx="0.5" />
            </g>
          ))}
          {[135, 160, 185, 210, 240].map((y) => (
            <g key={`rw-${y}`}>
              <rect x="495" y={y} width="4" height="4" rx="0.5" />
              <rect x="507" y={y} width="4" height="4" rx="0.5" />
              <rect x="536" y={y} width="4" height="4" rx="0.5" />
              <rect x="570" y={y} width="4" height="4" rx="0.5" />
              <rect x="641" y={y} width="4" height="4" rx="0.5" />
            </g>
          ))}
        </g>

        {/* Street lamps */}
        {[190, 420].map((x) => (
          <g key={`lamp-${x}`}>
            <rect x={x} y="240" width="3" height="40" fill="rgba(255,255,255,0.15)" rx="1" />
            <rect x={x - 4} y="237" width="11" height="5" fill="rgba(255,255,255,0.2)" rx="2" />
            <circle cx={x + 1.5} cy="237" r="12" fill="url(#lampGlow)" className="animate-pulse-glow" />
            <circle cx={x + 1.5} cy="237" r="3" fill="rgba(255,255,200,0.4)" />
          </g>
        ))}

        {/* Traffic light */}
        <g>
          <rect x="330" y="238" width="3" height="42" fill="rgba(255,255,255,0.15)" rx="1" />
          <rect x="324" y="225" width="15" height="18" rx="3" fill="rgba(255,255,255,0.18)" />
          <circle cx="331.5" cy="230" r="2.5" fill="rgba(255,100,100,0.5)" className="animate-pulse-glow" />
          <circle cx="331.5" cy="237" r="2.5" fill="rgba(255,255,100,0.2)" />
        </g>

        {/* Road */}
        <rect x="0" y="280" width="700" height="70" fill="url(#roadGrad)" rx="0" />
        <rect x="0" y="280" width="700" height="2" fill="rgba(255,255,255,0.2)" />
        <rect x="0" y="348" width="700" height="2" fill="rgba(255,255,255,0.2)" />

        {/* Road dashes */}
        <g fill="rgba(255,255,255,0.3)">
          {[0, 70, 140, 210, 280, 350, 420, 490, 560, 630].map((x) => (
            <rect key={`dash-${x}`} x={x} y="313" width="40" height="3" rx="1.5" />
          ))}
        </g>

        {/* Crosswalk */}
        <g fill="rgba(255,255,255,0.12)">
          {[282, 289, 296, 303, 310, 317, 324, 331, 338, 345].map((y) => (
            <rect key={`cw-${y}`} x="210" y={y} width="30" height="4" rx="1" />
          ))}
        </g>

        {/* Vehicle 1 - sedan going right */}
        <g className="animate-drive-right">
          <rect x="0" y="290" width="52" height="18" rx="5" fill="rgba(255,255,255,0.35)" />
          <rect x="8" y="282" width="32" height="12" rx="4" fill="rgba(255,255,255,0.25)" />
          <rect x="12" y="284" width="12" height="8" rx="2" fill="rgba(255,255,255,0.15)" />
          <rect x="27" y="284" width="10" height="8" rx="2" fill="rgba(255,255,255,0.15)" />
          <circle cx="14" cy="310" r="5" fill="rgba(255,255,255,0.3)" />
          <circle cx="14" cy="310" r="2.5" fill="rgba(255,255,255,0.15)" />
          <circle cx="40" cy="310" r="5" fill="rgba(255,255,255,0.3)" />
          <circle cx="40" cy="310" r="2.5" fill="rgba(255,255,255,0.15)" />
          <rect x="49" y="295" width="4" height="4" rx="1" fill="rgba(255,255,200,0.5)" />
        </g>

        {/* Vehicle 2 - SUV going left */}
        <g className="animate-drive-left">
          <rect x="680" y="320" width="58" height="20" rx="5" fill="rgba(255,255,255,0.3)" />
          <rect x="688" y="310" width="38" height="14" rx="4" fill="rgba(255,255,255,0.22)" />
          <rect x="692" y="312" width="14" height="9" rx="2" fill="rgba(255,255,255,0.12)" />
          <rect x="710" y="312" width="12" height="9" rx="2" fill="rgba(255,255,255,0.12)" />
          <circle cx="696" cy="342" r="5.5" fill="rgba(255,255,255,0.3)" />
          <circle cx="696" cy="342" r="2.5" fill="rgba(255,255,255,0.15)" />
          <circle cx="726" cy="342" r="5.5" fill="rgba(255,255,255,0.3)" />
          <circle cx="726" cy="342" r="2.5" fill="rgba(255,255,255,0.15)" />
          <rect x="676" y="326" width="4" height="4" rx="1" fill="rgba(255,200,200,0.5)" />
        </g>

        {/* Vehicle 3 - small car going right (slower) */}
        <g className="animate-drive-right-slow">
          <rect x="-80" y="292" width="45" height="16" rx="5" fill="rgba(255,255,255,0.28)" />
          <rect x="-74" y="284" width="28" height="11" rx="4" fill="rgba(255,255,255,0.2)" />
          <rect x="-70" y="286" width="10" height="7" rx="2" fill="rgba(255,255,255,0.12)" />
          <rect x="-57" y="286" width="9" height="7" rx="2" fill="rgba(255,255,255,0.12)" />
          <circle cx={-68} cy="310" r="4.5" fill="rgba(255,255,255,0.28)" />
          <circle cx={-68} cy="310" r="2" fill="rgba(255,255,255,0.14)" />
          <circle cx={-44} cy="310" r="4.5" fill="rgba(255,255,255,0.28)" />
          <circle cx={-44} cy="310" r="2" fill="rgba(255,255,255,0.14)" />
          <rect x="-38" y="296" width="3" height="3" rx="1" fill="rgba(255,255,200,0.45)" />
        </g>

        {/* Vehicle 4 - bus going left (slow, on bottom lane) */}
        <g className="animate-drive-left" style={{ animationDuration: '20s' }}>
          <rect x="720" y="330" width="70" height="22" rx="5" fill="rgba(255,255,255,0.25)" />
          <rect x="728" y="322" width="52" height="12" rx="3" fill="rgba(255,255,255,0.18)" />
          <rect x="732" y="324" width="10" height="8" rx="1.5" fill="rgba(255,255,255,0.12)" />
          <rect x="745" y="324" width="10" height="8" rx="1.5" fill="rgba(255,255,255,0.12)" />
          <rect x="758" y="324" width="10" height="8" rx="1.5" fill="rgba(255,255,255,0.12)" />
          <circle cx="738" cy="354" r="5" fill="rgba(255,255,255,0.28)" />
          <circle cx="738" cy="354" r="2.5" fill="rgba(255,255,255,0.14)" />
          <circle cx="778" cy="354" r="5" fill="rgba(255,255,255,0.28)" />
          <circle cx="778" cy="354" r="2.5" fill="rgba(255,255,255,0.14)" />
          <rect x="716" y="337" width="4" height="4" rx="1" fill="rgba(255,200,200,0.4)" />
        </g>
      </svg>
    </div>
  );
}
