import Image from 'next/image'

export function Watermark() {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
      {/* Logo watermark - center */}
      <div className="absolute opacity-8">
        <Image
          src="/logo.png"
          alt="Watermark"
          width={400}
          height={400}
          className="object-contain"
        />
      </div>

      {/* Bengali text - left side */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1200 850"
        className="absolute inset-0 pointer-events-none"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <style>{`
            .watermark-text {
              font-weight: bold;
              fill: #b0b0b0;
              text-anchor: middle;
            }
            .watermark-bengali {
              font-family: 'Noto Sans Bengali', Arial, sans-serif;
              font-size: 56px;
              letter-spacing: 1px;
            }
            .watermark-english {
              font-family: Arial, sans-serif;
              font-size: 40px;
              letter-spacing: 2px;
            }
          `}</style>
        </defs>

        {/* Bengali text - LEFT SIDE */}
        <g opacity="0.14">
          <text className="watermark-text watermark-bengali" x="150" y="425" textAnchor="middle">
            জীবনধারা
          </text>
        </g>

        {/* English text - RIGHT SIDE */}
        <g opacity="0.12">
          <text
            className="watermark-text watermark-english"
            x="1050"
            y="400"
            textAnchor="middle"
            letterSpacing="3"
          >
            JIBONDHARA
          </text>
          <text
            className="watermark-text watermark-english"
            x="1050"
            y="450"
            textAnchor="middle"
            letterSpacing="3"
          >
            SOCIETY
          </text>
        </g>
      </svg>
    </div>
  )
}
