'use client'

import React, { useState } from 'react'

export default function ShareButtons({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false)

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback
    }
  }

  return (
    <div className='flex items-center flex-wrap gap-2 text-sm'>
      <span className='text-xs font-bold text-slate-500 uppercase tracking-wider mr-1'>Share:</span>

      {/* WhatsApp */}
      <a
        href={`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`}
        target='_blank'
        rel='noopener noreferrer'
        className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors text-xs font-semibold'
      >
        <span>💬</span> WhatsApp
      </a>

      {/* Twitter / X */}
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target='_blank'
        rel='noopener noreferrer'
        className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300 transition-colors text-xs font-semibold'
      >
        <span>𝕏</span> Post
      </a>

      {/* Facebook */}
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target='_blank'
        rel='noopener noreferrer'
        className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors text-xs font-semibold'
      >
        <span>📘</span> Share
      </a>

      {/* Copy link */}
      <button
        onClick={handleCopy}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
          copied
            ? 'bg-emerald-600 text-white border-emerald-600'
            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
        }`}
      >
        <span>🔗</span> {copied ? 'Link Copied!' : 'Copy Link'}
      </button>
    </div>
  )
}
