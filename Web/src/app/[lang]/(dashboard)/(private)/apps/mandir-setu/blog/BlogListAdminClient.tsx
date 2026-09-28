'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import Tooltip from '@mui/material/Tooltip'

export type AdminBlogPost = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string
  featuredImage: string | null
  category: string | null
  tags: string | null
  authorName: string | null
  readTimeMinutes: number | null
  published: boolean
  publishedAt: string | null
  createdAt: string
  viewsCount: number
}

const CATEGORIES = [
  'All',
  'Devotional',
  'E-Puja',
  'Chadhava',
  'Vedic Wisdom',
  'Jyotish & Astrology',
  'Sacred Temples',
  'Festivals & Vrat',
  'Mantras & Slokas'
]

export default function BlogListAdminClient() {
  const params = useParams()
  const router = useRouter()
  const locale = params?.lang || 'en'

  const [posts, setPosts] = useState<AdminBlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL')

  const loadPosts = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/blog?all=1')
      if (!res.ok) throw new Error('Failed to load blog posts.')
      const data = await res.json()
      setPosts(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while loading posts.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
  }, [])

  const handleDelete = async (post: AdminBlogPost) => {
    if (!confirm(`Are you sure you want to delete "${post.title}"?`)) return

    try {
      const res = await fetch(`/api/blog/${post.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to delete post.')
      }

      setSuccessMsg(`"${post.title}" was deleted successfully.`)
      setPosts(prev => prev.filter(p => p.id !== post.id))
      setTimeout(() => setSuccessMsg(null), 3500)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete post.')
      setTimeout(() => setErrorMsg(null), 4000)
    }
  }

  const handleTogglePublish = async (post: AdminBlogPost) => {
    const nextPublished = !post.published
    try {
      const res = await fetch(`/api/blog/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: nextPublished })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to update post status.')
      }

      const updated = await res.json()
      setPosts(prev => prev.map(p => (p.id === post.id ? { ...p, published: updated.published, publishedAt: updated.publishedAt } : p)))
      setSuccessMsg(`Post marked as ${nextPublished ? 'Published' : 'Draft'}.`)
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update status.')
      setTimeout(() => setErrorMsg(null), 4000)
    }
  }

  const filteredPosts = posts.filter(post => {
    const matchesSearch =
      !searchQuery.trim() ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.tags && post.tags.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (post.authorName && post.authorName.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory =
      selectedCategory === 'All' ||
      (post.category && post.category.toLowerCase() === selectedCategory.toLowerCase())

    const matchesStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'PUBLISHED' && post.published) ||
      (filterStatus === 'DRAFT' && !post.published)

    return matchesSearch && matchesCategory && matchesStatus
  })

  const totalPublished = posts.filter(p => p.published).length
  const totalDrafts = posts.filter(p => !p.published).length
  const totalViews = posts.reduce((acc, p) => acc + (p.viewsCount || 0), 0)

  return (
    <div className='p-6 max-w-7xl mx-auto'>
      {/* Header Bar */}
      <div className='flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8'>
        <div>
          <Typography variant='h4' className='font-bold text-slate-800 flex items-center gap-2.5'>
            <span>📰</span> Blog Management &amp; Content CMS
          </Typography>
          <Typography variant='body2' className='text-slate-500 mt-1'>
            Create, publish, and manage SEO-optimized spiritual articles, temple guides, and Vedic wisdom blogs.
          </Typography>
        </div>

        <div className='flex items-center gap-3'>
          <Button
            component={Link}
            href={`/${locale}/apps/mandir-setu/blog/create`}
            variant='contained'
            color='primary'
            size='large'
            startIcon={<i className='tabler-plus' />}
            className='font-bold shadow-md bg-[#006241] hover:bg-[#004e34]'
          >
            + Create New Blog Post
          </Button>

          <Button
            component='a'
            href='/blog'
            target='_blank'
            rel='noopener noreferrer'
            variant='outlined'
            size='large'
            startIcon={<i className='tabler-external-link' />}
          >
            View Live Blog
          </Button>
        </div>
      </div>

      {/* Messages */}
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

      {/* Metrics Row */}
      <Grid container spacing={4} className='mb-8'>
        <Grid item xs={12} sm={6} md={3}>
          <Card className='p-5 shadow-sm border border-slate-200/70'>
            <div className='flex items-center justify-between'>
              <div>
                <Typography variant='caption' className='text-slate-500 font-bold uppercase tracking-wider'>
                  Total Articles
                </Typography>
                <Typography variant='h4' className='font-bold text-slate-800 mt-1'>
                  {posts.length}
                </Typography>
              </div>
              <div className='w-12 h-12 rounded-2xl bg-emerald-50 text-[#006241] flex items-center justify-center text-2xl'>
                📜
              </div>
            </div>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className='p-5 shadow-sm border border-slate-200/70'>
            <div className='flex items-center justify-between'>
              <div>
                <Typography variant='caption' className='text-slate-500 font-bold uppercase tracking-wider'>
                  Published (Live)
                </Typography>
                <Typography variant='h4' className='font-bold text-emerald-600 mt-1'>
                  {totalPublished}
                </Typography>
              </div>
              <div className='w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl'>
                ✅
              </div>
            </div>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className='p-5 shadow-sm border border-slate-200/70'>
            <div className='flex items-center justify-between'>
              <div>
                <Typography variant='caption' className='text-slate-500 font-bold uppercase tracking-wider'>
                  Drafts
                </Typography>
                <Typography variant='h4' className='font-bold text-amber-600 mt-1'>
                  {totalDrafts}
                </Typography>
              </div>
              <div className='w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl'>
                📝
              </div>
            </div>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className='p-5 shadow-sm border border-slate-200/70'>
            <div className='flex items-center justify-between'>
              <div>
                <Typography variant='caption' className='text-slate-500 font-bold uppercase tracking-wider'>
                  Total Views
                </Typography>
                <Typography variant='h4' className='font-bold text-blue-600 mt-1'>
                  {totalViews.toLocaleString()}
                </Typography>
              </div>
              <div className='w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl'>
                👁️
              </div>
            </div>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Toolbar */}
      <Card className='p-4 mb-6 shadow-sm border border-slate-200/70'>
        <div className='flex flex-col md:flex-row items-center justify-between gap-4'>
          <div className='flex items-center gap-3 w-full md:w-auto'>
            <TextField
              size='small'
              placeholder='Search by title, tag, or author...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='w-full md:w-80'
            />

            <TextField
              select
              size='small'
              label='Category'
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className='w-48'
            >
              {CATEGORIES.map(cat => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              size='small'
              variant={filterStatus === 'ALL' ? 'contained' : 'outlined'}
              onClick={() => setFilterStatus('ALL')}
            >
              All ({posts.length})
            </Button>
            <Button
              size='small'
              variant={filterStatus === 'PUBLISHED' ? 'contained' : 'outlined'}
              color='success'
              onClick={() => setFilterStatus('PUBLISHED')}
            >
              Published ({totalPublished})
            </Button>
            <Button
              size='small'
              variant={filterStatus === 'DRAFT' ? 'contained' : 'outlined'}
              color='warning'
              onClick={() => setFilterStatus('DRAFT')}
            >
              Drafts ({totalDrafts})
            </Button>
          </div>
        </div>
      </Card>

      {/* Posts Table */}
      <Card className='shadow-sm border border-slate-200/70 overflow-hidden'>
        {loading ? (
          <Box className='p-16 flex flex-col items-center justify-center text-slate-500'>
            <CircularProgress size={36} className='text-[#006241] mb-3' />
            <Typography variant='body2'>Loading blog articles...</Typography>
          </Box>
        ) : filteredPosts.length === 0 ? (
          <Box className='p-16 text-center text-slate-500'>
            <div className='text-5xl mb-3'>🪔</div>
            <Typography variant='h6' className='font-bold text-slate-700 mb-1'>
              No blog posts found
            </Typography>
            <Typography variant='body2' className='text-slate-400 mb-6'>
              {searchQuery || selectedCategory !== 'All' || filterStatus !== 'ALL'
                ? 'No posts matched your current filters.'
                : 'Get started by creating your very first devotional article for Mandirsetuu.'}
            </Typography>
            <Button
              component={Link}
              href={`/${locale}/apps/mandir-setu/blog/create`}
              variant='contained'
              color='primary'
              className='bg-[#006241]'
            >
              + Create First Blog Post
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead className='bg-slate-50'>
                <TableRow>
                  <TableCell className='font-bold'>Image</TableCell>
                  <TableCell className='font-bold'>Article Title</TableCell>
                  <TableCell className='font-bold'>Category</TableCell>
                  <TableCell className='font-bold'>Author</TableCell>
                  <TableCell className='font-bold text-center'>Views</TableCell>
                  <TableCell className='font-bold text-center'>Status</TableCell>
                  <TableCell className='font-bold'>Created Date</TableCell>
                  <TableCell className='font-bold text-right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPosts.map(post => (
                  <TableRow key={post.id} hover>
                    {/* Thumbnail */}
                    <TableCell>
                      {post.featuredImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.featuredImage}
                          alt=''
                          className='w-14 h-10 object-cover rounded-lg border border-slate-200 shadow-xs'
                        />
                      ) : (
                        <div className='w-14 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 border border-slate-200'>
                          No Image
                        </div>
                      )}
                    </TableCell>

                    {/* Title */}
                    <TableCell>
                      <div className='max-w-md'>
                        <Typography variant='subtitle2' className='font-bold text-slate-800 line-clamp-1'>
                          {post.title}
                        </Typography>
                        <Typography variant='caption' className='text-slate-400'>
                          /blog/{post.slug}
                        </Typography>
                      </div>
                    </TableCell>

                    {/* Category */}
                    <TableCell>
                      <Chip
                        size='small'
                        label={post.category || 'Devotional'}
                        variant='outlined'
                        color='primary'
                        className='font-semibold text-xs'
                      />
                    </TableCell>

                    {/* Author */}
                    <TableCell>
                      <Typography variant='body2' className='text-slate-700 text-xs font-medium'>
                        {post.authorName || 'Mandirsetuu Team'}
                      </Typography>
                    </TableCell>

                    {/* Views */}
                    <TableCell align='center'>
                      <span className='font-semibold text-xs text-slate-700'>
                        {(post.viewsCount || 0).toLocaleString()}
                      </span>
                    </TableCell>

                    {/* Status Toggle */}
                    <TableCell align='center'>
                      <Tooltip title={`Click to ${post.published ? 'unpublish (make draft)' : 'publish'}`}>
                        <Chip
                          size='small'
                          label={post.published ? 'Published' : 'Draft'}
                          color={post.published ? 'success' : 'default'}
                          onClick={() => handleTogglePublish(post)}
                          className='cursor-pointer font-bold'
                        />
                      </Tooltip>
                    </TableCell>

                    {/* Date */}
                    <TableCell>
                      <Typography variant='caption' className='text-slate-500'>
                        {new Date(post.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </Typography>
                    </TableCell>

                    {/* Actions */}
                    <TableCell align='right'>
                      <div className='flex items-center justify-end gap-1'>
                        <Tooltip title='View Live on Website'>
                          <IconButton
                            component='a'
                            href={`/blog/${post.slug}`}
                            target='_blank'
                            rel='noopener noreferrer'
                            size='small'
                            color='info'
                          >
                            <i className='tabler-eye text-lg' />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title='Edit Post'>
                          <IconButton
                            component={Link}
                            href={`/${locale}/apps/mandir-setu/blog/edit/${post.id}`}
                            size='small'
                            color='primary'
                          >
                            <i className='tabler-edit text-lg' />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title='Delete Post'>
                          <IconButton
                            size='small'
                            color='error'
                            onClick={() => handleDelete(post)}
                          >
                            <i className='tabler-trash text-lg' />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </div>
  )
}
