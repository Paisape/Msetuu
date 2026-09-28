'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Alert from '@mui/material/Alert'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'

type Props = {
  mode: 'create' | 'edit'
  postId?: string
}

const CATEGORIES = [
  'Devotional',
  'E-Puja',
  'Chadhava',
  'Vedic Wisdom',
  'Jyotish & Astrology',
  'Sacred Temples',
  'Festivals & Vrat',
  'Mantras & Slokas'
]

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function BlogEditorClient({ mode, postId }: Props) {
  const params = useParams()
  const router = useRouter()
  const locale = params?.lang || 'en'

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: 'Devotional',
    authorName: 'Mandirsetuu Team',
    readTimeMinutes: 5,
    featuredImage: '',
    excerpt: '',
    content: `<h2>Introduction</h2>\n<p>Write your sacred Vedic insights and devotional story here...</p>\n\n<h2>Significance & Vidhi</h2>\n<p>Detail the ritual steps, auspicious timings, and scriptures referenced.</p>\n\n<ul>\n  <li>Key spiritual benefit 1</li>\n  <li>Key spiritual benefit 2</li>\n  <li>Key spiritual benefit 3</li>\n</ul>`,
    tags: '',
    metaTitle: '',
    metaDescription: '',
    canonicalUrl: '',
    published: true
  })

  const [contentTab, setContentTab] = useState<'EDIT' | 'PREVIEW'>('EDIT')
  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Auto-generate slug when title changes in create mode
  const handleTitleChange = (newTitle: string) => {
    setFormData(prev => ({
      ...prev,
      title: newTitle,
      slug: mode === 'create' && !prev.slug ? slugify(newTitle) : prev.slug,
      metaTitle: !prev.metaTitle ? newTitle : prev.metaTitle
    }))
  }

  // Load existing post if in edit mode
  useEffect(() => {
    if (mode !== 'edit' || !postId) return

    const loadPost = async () => {
      try {
        const res = await fetch(`/api/blog/${postId}`)
        if (!res.ok) throw new Error('Failed to load blog post.')
        const data = await res.json()
        setFormData({
          title: data.title || '',
          slug: data.slug || '',
          category: data.category || 'Devotional',
          authorName: data.authorName || 'Mandirsetuu Team',
          readTimeMinutes: data.readTimeMinutes || 5,
          featuredImage: data.featuredImage || '',
          excerpt: data.excerpt || '',
          content: data.content || '',
          tags: data.tags || '',
          metaTitle: data.metaTitle || '',
          metaDescription: data.metaDescription || '',
          canonicalUrl: data.canonicalUrl || '',
          published: Boolean(data.published)
        })
      } catch (err: any) {
        setErrorMsg(err.message || 'Error loading post.')
      } finally {
        setLoading(false)
      }
    }

    loadPost()
  }, [mode, postId])

  // Image Upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    setErrorMsg(null)

    try {
      const data = new FormData()
      data.append('file', file)
      data.append('type', 'banner')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error || 'Failed to upload image.')
      }

      const uploadResult = await res.json()
      setFormData(prev => ({ ...prev, featuredImage: uploadResult.url }))
      setSuccessMsg('Image uploaded and optimized successfully!')
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err: any) {
      setErrorMsg(err.message || 'Image upload failed.')
    } finally {
      setUploadingImage(false)
    }
  }

  // Content quick toolbar insertion
  const insertTextAtCursor = (prefix: string, suffix: string = '') => {
    setFormData(prev => ({
      ...prev,
      content: `${prev.content}\n${prefix}${suffix}`
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      setErrorMsg('Please enter an Article Title.')
      return
    }

    if (!formData.content.trim()) {
      setErrorMsg('Please write article content before saving.')
      return
    }

    setSaving(true)
    setErrorMsg(null)

    try {
      const endpoint = mode === 'edit' ? `/api/blog/${postId}` : '/api/blog'
      const method = mode === 'edit' ? 'PATCH' : 'POST'

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to save blog post.')
      }

      const savedPost = await res.json()
      setSuccessMsg(
        mode === 'edit'
          ? 'Blog post updated successfully!'
          : 'Blog post published successfully!'
      )

      setTimeout(() => {
        router.push(`/${locale}/apps/mandir-setu/blog`)
      }, 1200)
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving post.')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box className='p-20 flex flex-col items-center justify-center text-slate-500'>
        <CircularProgress size={40} className='text-[#006241] mb-3' />
        <Typography variant='body2'>Loading blog post details...</Typography>
      </Box>
    )
  }

  return (
    <form onSubmit={handleSubmit} className='p-6 max-w-6xl mx-auto'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8'>
        <div>
          <div className='flex items-center gap-2 mb-1'>
            <Link
              href={`/${locale}/apps/mandir-setu/blog`}
              className='text-xs font-bold text-slate-500 hover:text-[#006241]'
            >
              &larr; Back to Blog Posts
            </Link>
          </div>
          <Typography variant='h4' className='font-bold text-slate-800'>
            {mode === 'edit' ? 'Edit Blog Post' : 'Create New Blog Post'}
          </Typography>
          <Typography variant='body2' className='text-slate-500'>
            Compose sacred articles, optimize metadata for Google, and publish to the live site.
          </Typography>
        </div>

        <div className='flex items-center gap-3'>
          <Button
            component={Link}
            href={`/${locale}/apps/mandir-setu/blog`}
            variant='outlined'
            size='large'
          >
            Cancel
          </Button>

          <Button
            type='submit'
            variant='contained'
            color='primary'
            size='large'
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} color='inherit' /> : <i className='tabler-check' />}
            className='bg-[#006241] hover:bg-[#004e34] font-bold px-8 shadow-md'
          >
            {saving ? 'Saving...' : mode === 'edit' ? 'Update Post' : 'Publish Post'}
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <Alert severity='error' className='mb-6' onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      {successMsg && (
        <Alert severity='success' className='mb-6' onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}

      <Grid container spacing={6}>
        {/* Main Content (Left Column) */}
        <Grid item xs={12} lg={8}>
          {/* Article Info Card */}
          <Card className='p-6 mb-6 shadow-sm border border-slate-200/70'>
            <Typography variant='h6' className='font-bold text-slate-800 mb-4 flex items-center gap-2'>
              <span>✍️</span> Article Information
            </Typography>

            <div className='space-y-5'>
              <TextField
                fullWidth
                label='Article Title *'
                placeholder='e.g. The Sacred Significance of Offering Mustard Oil to Shani Dev'
                value={formData.title}
                onChange={e => handleTitleChange(e.target.value)}
                required
              />

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <TextField
                  fullWidth
                  label='URL Slug *'
                  placeholder='e.g. significance-of-offering-oil-shani-dev'
                  value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: slugify(e.target.value) })}
                  helperText={`Public URL: /blog/${formData.slug || 'your-slug'}`}
                  required
                />

                <TextField
                  select
                  fullWidth
                  label='Category *'
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  {CATEGORIES.map(cat => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </TextField>
              </div>

              <TextField
                fullWidth
                multiline
                rows={2}
                label='Excerpt / Summary (1-2 sentences)'
                placeholder='Short summary shown on search results, Google snippets, and blog index cards.'
                value={formData.excerpt}
                onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                helperText='Recommended length: 120 - 160 characters'
              />
            </div>
          </Card>

          {/* Article Body Editor Card */}
          <Card className='p-6 shadow-sm border border-slate-200/70'>
            <div className='flex items-center justify-between mb-3'>
              <Typography variant='h6' className='font-bold text-slate-800 flex items-center gap-2'>
                <span>📖</span> Article Content (HTML &amp; Rich Text)
              </Typography>

              <Tabs
                value={contentTab}
                onChange={(_, val) => setContentTab(val)}
                className='min-h-0'
              >
                <Tab label='Editor' value='EDIT' className='py-1 min-h-0 font-bold text-xs' />
                <Tab label='Live Preview' value='PREVIEW' className='py-1 min-h-0 font-bold text-xs' />
              </Tabs>
            </div>

            {/* Quick Formatting Toolbar */}
            {contentTab === 'EDIT' && (
              <div className='flex items-center flex-wrap gap-1.5 p-2 bg-slate-50 rounded-lg border border-slate-200 mb-3'>
                <span className='text-[11px] font-bold text-slate-400 uppercase mr-1'>Insert:</span>
                <button
                  type='button'
                  onClick={() => insertTextAtCursor('<h2>Heading 2</h2>\n<p>Content...</p>')}
                  className='px-2.5 py-1 text-xs font-semibold bg-white rounded border border-slate-300 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 transition-colors'
                >
                  + H2 Heading
                </button>
                <button
                  type='button'
                  onClick={() => insertTextAtCursor('<h3>Heading 3</h3>\n<p>Content...</p>')}
                  className='px-2.5 py-1 text-xs font-semibold bg-white rounded border border-slate-300 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 transition-colors'
                >
                  + H3 Subtitle
                </button>
                <button
                  type='button'
                  onClick={() => insertTextAtCursor('<ul>\n  <li>Bullet point 1</li>\n  <li>Bullet point 2</li>\n</ul>')}
                  className='px-2.5 py-1 text-xs font-semibold bg-white rounded border border-slate-300 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 transition-colors'
                >
                  + Bullet List
                </button>
                <button
                  type='button'
                  onClick={() => insertTextAtCursor('<blockquote>"Sacred mantra or scripture verse..."</blockquote>')}
                  className='px-2.5 py-1 text-xs font-semibold bg-white rounded border border-slate-300 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 transition-colors'
                >
                  + Devotional Quote
                </button>
              </div>
            )}

            {contentTab === 'EDIT' ? (
              <TextField
                fullWidth
                multiline
                rows={16}
                placeholder='Write the full article content here using HTML tags (<h2>, <h3>, <p>, <ul>, <li>, <blockquote>)...'
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                className='font-mono text-sm'
                required
              />
            ) : (
              <div className='p-6 rounded-xl border border-slate-200 bg-slate-50/50 min-h-[380px]'>
                <div
                  className='prose prose-slate max-w-none [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-[#006241] [&_h3]:text-xl [&_h3]:font-bold [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-[#006241] [&_blockquote]:pl-4 [&_blockquote]:italic'
                  dangerouslySetInnerHTML={{ __html: formData.content || '<p className="text-slate-400">No content entered yet...</p>' }}
                />
              </div>
            )}
          </Card>
        </Grid>

        {/* Sidebar Settings (Right Column) */}
        <Grid item xs={12} lg={4}>
          {/* Publish & Status Card */}
          <Card className='p-6 mb-6 shadow-sm border border-slate-200/70'>
            <Typography variant='h6' className='font-bold text-slate-800 mb-4 flex items-center gap-2'>
              <span>🚀</span> Publication Status
            </Typography>

            <div className='p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 mb-5'>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.published}
                    onChange={e => setFormData({ ...formData, published: e.target.checked })}
                    color='success'
                  />
                }
                label={
                  <div>
                    <div className='font-bold text-sm text-slate-800'>
                      {formData.published ? 'Published (Live)' : 'Draft (Hidden)'}
                    </div>
                    <div className='text-xs text-slate-500'>
                      {formData.published
                        ? 'Visible to Google crawlers and all website visitors.'
                        : 'Only accessible in the admin console.'}
                    </div>
                  </div>
                }
              />
            </div>

            <div className='space-y-4'>
              <TextField
                fullWidth
                label='Author Name'
                value={formData.authorName}
                onChange={e => setFormData({ ...formData, authorName: e.target.value })}
                placeholder='e.g. Acharya Pt. Ramesh Shastri'
              />

              <TextField
                fullWidth
                type='number'
                label='Estimated Read Time (minutes)'
                value={formData.readTimeMinutes}
                onChange={e => setFormData({ ...formData, readTimeMinutes: Number(e.target.value) || 5 })}
              />
            </div>
          </Card>

          {/* Featured Image Card */}
          <Card className='p-6 mb-6 shadow-sm border border-slate-200/70'>
            <Typography variant='h6' className='font-bold text-slate-800 mb-3 flex items-center gap-2'>
              <span>🖼️</span> Featured Image
            </Typography>
            <Typography variant='caption' className='text-slate-400 block mb-4'>
              Recommended size: 1200 x 630 pixels (16:9 ratio for Google and social previews).
            </Typography>

            {formData.featuredImage ? (
              <div className='mb-4 rounded-xl overflow-hidden border border-slate-200 relative group'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={formData.featuredImage}
                  alt='Featured preview'
                  className='w-full h-44 object-cover'
                />
                <button
                  type='button'
                  onClick={() => setFormData({ ...formData, featuredImage: '' })}
                  className='absolute top-2 right-2 bg-rose-600 text-white p-1.5 rounded-full text-xs hover:bg-rose-700 shadow-md'
                >
                  ✕ Remove
                </button>
              </div>
            ) : null}

            <div className='space-y-3'>
              <TextField
                fullWidth
                size='small'
                label='Image URL or Upload Below'
                placeholder='https://images.unsplash.com/...'
                value={formData.featuredImage}
                onChange={e => setFormData({ ...formData, featuredImage: e.target.value })}
              />

              <Button
                component='label'
                variant='outlined'
                fullWidth
                disabled={uploadingImage}
                startIcon={uploadingImage ? <CircularProgress size={16} /> : <i className='tabler-upload' />}
              >
                {uploadingImage ? 'Uploading & Compressing...' : 'Upload Image File'}
                <input
                  type='file'
                  accept='image/*'
                  hidden
                  onChange={handleImageUpload}
                />
              </Button>
            </div>
          </Card>

          {/* SEO & Google Search Snippet Card */}
          <Card className='p-6 shadow-sm border border-slate-200/70'>
            <Typography variant='h6' className='font-bold text-slate-800 mb-2 flex items-center gap-2'>
              <span>🔍</span> SEO &amp; Google Snippet
            </Typography>
            <Typography variant='caption' className='text-slate-400 block mb-4'>
              Customize how this article appears in Google search results and on social shares.
            </Typography>

            {/* Google Search Snippet Preview */}
            <div className='p-4 rounded-xl bg-slate-50 border border-slate-200 mb-5 text-xs font-sans'>
              <div className='text-[11px] text-slate-500 mb-1 flex items-center gap-1.5'>
                <span>mandirsetuu.com</span> &rsaquo; <span>blog</span> &rsaquo; <span>{formData.slug || 'article-slug'}</span>
              </div>
              <div className='text-blue-700 font-medium text-sm hover:underline cursor-pointer line-clamp-1 mb-1'>
                {formData.metaTitle || formData.title || 'Your Article Title'} - Mandirsetuu
              </div>
              <div className='text-slate-600 line-clamp-2'>
                {formData.metaDescription || formData.excerpt || 'Article summary description will appear here in Google search engine results.'}
              </div>
            </div>

            <div className='space-y-4'>
              <TextField
                fullWidth
                size='small'
                label='SEO Meta Title'
                placeholder='Leave blank to use Article Title'
                value={formData.metaTitle}
                onChange={e => setFormData({ ...formData, metaTitle: e.target.value })}
                helperText={`${formData.metaTitle.length}/60 characters recommended`}
              />

              <TextField
                fullWidth
                size='small'
                multiline
                rows={2}
                label='SEO Meta Description'
                placeholder='Leave blank to use Excerpt'
                value={formData.metaDescription}
                onChange={e => setFormData({ ...formData, metaDescription: e.target.value })}
                helperText={`${formData.metaDescription.length}/160 characters recommended`}
              />

              <TextField
                fullWidth
                size='small'
                label='Tags / Keywords (comma separated)'
                placeholder='Shani Dev, Chadhava, Saturday Vrat, Sade Sati'
                value={formData.tags}
                onChange={e => setFormData({ ...formData, tags: e.target.value })}
              />

              <TextField
                fullWidth
                size='small'
                label='Canonical URL (optional)'
                placeholder='https://mandirsetuu.com/blog/...'
                value={formData.canonicalUrl}
                onChange={e => setFormData({ ...formData, canonicalUrl: e.target.value })}
              />
            </div>
          </Card>
        </Grid>
      </Grid>
    </form>
  )
}
