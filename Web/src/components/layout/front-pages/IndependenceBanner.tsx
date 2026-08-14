'use client'

import { useState } from 'react'

const AshokaChakra = () => (
  <svg className="w-5 h-5 animate-spin" style={{ animationDuration: '20s' }} viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="46" stroke="#000080" strokeWidth="4" fill="none" />
    <circle cx="50" cy="50" r="8" fill="#000080" />
    {[...Array(24)].map((_, i) => (
      <line
        key={i}
        x1="50"
        y1="50"
        x2="50"
        y2="8"
        stroke="#000080"
        strokeWidth="2"
        transform={`rotate(${i * 15} 50 50)`}
      />
    ))}
  </svg>
)

const InlineFlag = () => (
  <span className="inline-flex flex-col w-7 h-5 overflow-hidden rounded-[2px] shadow-sm border border-slate-200/50 flex-shrink-0">
    <span className="flex-1 bg-[#FF671F]"></span>
    <span className="flex-1 bg-white flex items-center justify-center relative">
      <span className="w-2 h-2 rounded-full border-[0.5px] border-[#000080] flex items-center justify-center">
        <span className="w-[0.5px] h-1.5 bg-[#000080]"></span>
      </span>
    </span>
    <span className="flex-1 bg-[#046A38]"></span>
  </span>
)

const IndependenceBanner = () => {
  const [show, setShow] = useState(true)

  if (!show) return null

  return (
    <div
      className="relative overflow-hidden w-full py-4.5 px-6 flex items-center justify-center shadow-md z-50"
      style={{
        backgroundImage: "url('/images/independence-bg.png')",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: '100% 100%',
        minHeight: '85px',
        borderBottom: '1px solid rgba(0, 0, 80, 0.08)',
      }}
    >
      <div className="flex flex-col items-center gap-1.5 text-center z-10 py-1.5">
        {/* Centered content header */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <InlineFlag />
          <h4 className="text-sm sm:text-base font-black tracking-wider text-[#000080] m-0 flex items-center gap-2">
            <span>HAPPY INDEPENDENCE DAY</span>
            <AshokaChakra />
            <span>JAI HIND!</span>
          </h4>
          <InlineFlag />
        </div>

        {/* Tagline */}
        <p className="text-xs sm:text-sm font-semibold text-slate-800 m-0 tracking-wide">
          Celebrating the spirit of freedom, unity, and spiritual devotion. <span className="text-emerald-950 font-bold">Har Ghar Tiranga!</span>
        </p>
      </div>

      {/* Dismiss Button */}
      <button
        onClick={() => setShow(false)}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-black/5 rounded-full text-slate-700 hover:text-slate-900 transition-colors z-20"
        aria-label="Dismiss Banner"
      >
        <i className="tabler-x text-base sm:text-lg" />
      </button>
    </div>
  )
}

export default IndependenceBanner
