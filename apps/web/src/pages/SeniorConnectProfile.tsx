import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Save,
  Trash2,
  Calendar,
  Clock,
  X,
  Layers,
  Sparkles,
  UploadCloud,
  FileText,
  Loader2,
  Check,
  User,
  DollarSign,
  ArrowLeft,
  CheckCircle2,
  Camera
} from 'lucide-react'
import pdfToText from 'react-pdftotext'
import BulkAvailabilityModal from '../components/BulkAvailabilityModal'
import { useUnsavedChangesWarning } from '../hooks/useUnsavedChangesWarning'

interface SeniorProfile {
  id: string
  title: string
  company: string
  domain: string
  role: string
  bio: string
  experience: number
  location: string
  expertise: string[]
  achievements: string[]
  rating: number
  reviewCount: number
  sessionCount: number
  availability: string
  hourlyRate?: number
  user: {
    id: string
    name: string
    email: string
    avatar: string
    isAlumniMentor: boolean
    mentorApprovalStatus: string
  }
}

interface AvailabilitySlot {
  id: string
  date: string
  startTime: string
  endTime: string
  isBooked: boolean
}

function TagInput({
  value,
  onChange,
  placeholder
}: {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder: string
}) {
  const [text, setText] = useState(value.join(', '))

  useEffect(() => {
    setText(value.join(', '))
  }, [value])

  const handleBlur = () => {
    const tags = text
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    onChange(tags)
    setText(tags.join(', '))
  }

  return (
    <input
      type="text"
      value={text}
      placeholder={placeholder}
      onChange={(e) => setText(e.target.value)}
      onBlur={handleBlur}
      className="w-full border border-border bg-background text-foreground rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
    />
  )
}

export default function SeniorConnectProfile() {
  const navigate = useNavigate()
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  const [profile, setProfile] = useState<SeniorProfile | null>(null)
  const canManageAvailability = currentUser.role === 'ADMIN' || (profile?.user?.isAlumniMentor === true && profile.user.mentorApprovalStatus === 'APPROVED')
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [hasProfile, setHasProfile] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showBulkModal, setShowBulkModal] = useState(false)

  // AI Resume Auto-Fill State
  const [resumeMode, setResumeMode] = useState<'upload' | 'paste'>('upload')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeText, setResumeText] = useState('')
  const [parsingResume, setParsingResume] = useState(false)
  const [parseNotice, setParseNotice] = useState('')

  // Form State
  const [form, setForm] = useState({
    name: currentUser.name || '',
    avatar: currentUser.avatar || '',
    title: '',
    company: '',
    domain: 'Fullstack',
    role: '',
    bio: '',
    experience: 0,
    location: '',
    expertise: [] as string[],
    achievements: [] as string[],
    availability: 'available',
    hourlyRate: 0
  })

  const [isFree, setIsFree] = useState(true)

  const savedFormSnapshot = useRef(JSON.stringify(form))
  const hasUnsavedChanges = JSON.stringify(form) !== savedFormSnapshot.current
  useUnsavedChangesWarning(hasUnsavedChanges)

  const [newSlot, setNewSlot] = useState({ date: '', startTime: '', endTime: '' })
  const [addingSlot, setAddingSlot] = useState(false)

  // Profile Photo Upload State & Handler
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoMessage, setPhotoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handlePhotoUpload = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setPhotoMessage({ type: 'error', text: 'Please choose an image file (JPG, PNG, WebP).' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoMessage({ type: 'error', text: 'Image size must be under 5 MB.' })
      return
    }

    setPhotoMessage(null)
    setUploadingPhoto(true)

    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('photo', file)

      const response = await fetch('/api/auth/me/photo', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload photo')
      }

      const newAvatarUrl = data.photoUrl || data.user?.avatar || data.user?.image
      if (newAvatarUrl) {
        setForm((prev) => ({ ...prev, avatar: newAvatarUrl }))
        const userObj = JSON.parse(localStorage.getItem('user') || '{}')
        userObj.avatar = newAvatarUrl
        userObj.image = newAvatarUrl
        localStorage.setItem('user', JSON.stringify(userObj))
        setPhotoMessage({ type: 'success', text: 'Profile photo uploaded successfully!' })
      }
    } catch (err: any) {
      console.error('Photo upload error:', err)
      setPhotoMessage({ type: 'error', text: err.message || 'Could not upload photo' })
    } finally {
      setUploadingPhoto(false)
    }
  }

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/connect/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.status === 404) {
        setHasProfile(false)
        setProfile(null)
        return
      }
      if (!response.ok) throw new Error('Failed to fetch profile')

      const data = await response.json()
      setProfile(data)
      setHasProfile(true)
      const rate = data.hourlyRate || 0
      setIsFree(rate === 0)
      const loadedForm = {
        name: data.user?.name || currentUser.name || '',
        avatar: data.user?.avatar || currentUser.avatar || '',
        title: data.title || '',
        company: data.company || '',
        domain: data.domain || 'Fullstack',
        role: data.role || '',
        bio: data.bio || '',
        experience: data.experience || 0,
        location: data.location || '',
        expertise: data.expertise || [],
        achievements: data.achievements || [],
        availability: data.availability || 'available',
        hourlyRate: rate
      }
      setForm(loadedForm)
      savedFormSnapshot.current = JSON.stringify(loadedForm)
    } catch (err) {
      console.error(err)
      setError('Failed to load your mentor profile.')
    } finally {
      setLoadingProfile(false)
    }
  }

  const fetchSlots = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/connect/availability', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) return
      const data = await response.json()
      setSlots(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchProfile()
    fetchSlots()
  }, [])

  // Auto-fill from resume parser
  const handleAutoFillFromResume = async () => {
    setError('')
    setParseNotice('')
    setParsingResume(true)

    try {
      let extracted = resumeText

      if (resumeMode === 'upload') {
        if (!resumeFile) {
          throw new Error('Please select a PDF resume file.')
        }
        extracted = await pdfToText(resumeFile)
      }

      if (!extracted || extracted.trim().length < 20) {
        throw new Error('Could not extract text from the resume. Try pasting text directly.')
      }

      const token = localStorage.getItem('token')
      const res = await fetch('/api/connect/parse-senior-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ resumeText: extracted })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to analyze resume')
      }

      const { profile: parsed } = await res.json()
      if (!parsed) throw new Error('No profile data could be extracted.')

      setForm((prev) => ({
        ...prev,
        name: parsed.name || prev.name,
        title: parsed.title || prev.title,
        company: parsed.company || prev.company,
        domain: parsed.domain || prev.domain,
        role: parsed.role || prev.role,
        bio: parsed.bio || prev.bio,
        experience: Number(parsed.experience) || prev.experience,
        location: parsed.location || prev.location,
        expertise: Array.isArray(parsed.expertise) && parsed.expertise.length ? parsed.expertise : prev.expertise,
        achievements: Array.isArray(parsed.achievements) && parsed.achievements.length ? parsed.achievements : prev.achievements,
        hourlyRate: parsed.hourlyRate || 0
      }))

      setIsFree((parsed.hourlyRate || 0) === 0)
      setParseNotice('✨ Profile successfully auto-filled from your resume! Review and click Save below.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse resume.')
    } finally {
      setParsingResume(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/connect/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...form,
          experience: Number(form.experience) || 0,
          hourlyRate: isFree ? 0 : Number(form.hourlyRate) || 0,
          name: form.name || undefined
        })
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(result?.error || 'Failed to save profile')
      }

      // Update user role in localStorage to MENTOR if updated
      if (result?.user) {
        localStorage.setItem('user', JSON.stringify(result.user))
      }

      setSuccess('Mentor profile saved successfully! Your profile is live and accepting bookings.')
      savedFormSnapshot.current = JSON.stringify(form)
      await fetchProfile()
      await fetchSlots()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  // Quick preset availability slot adder
  const addPresetSlot = async (daysFromNow: number, start: string, end: string) => {
    const d = new Date()
    d.setDate(d.getDate() + daysFromNow)
    const dateStr = d.toISOString().split('T')[0]

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/connect/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          date: dateStr,
          startTime: start,
          endTime: end
        })
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to add slot')
      }
      setSuccess(`Added slot: ${dateStr} from ${start} to ${end}`)
      fetchSlots()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add preset slot')
    }
  }

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSlot.date || !newSlot.startTime || !newSlot.endTime) {
      setError('Please choose a date, start time, and end time.')
      return
    }
    setAddingSlot(true)
    setError('')
    setSuccess('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/connect/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newSlot)
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to add slot')
      }
      setNewSlot({ date: '', startTime: '', endTime: '' })
      setSuccess('Availability slot added!')
      await fetchSlots()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add slot')
    } finally {
      setAddingSlot(false)
    }
  }

  const handleDeleteSlot = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/connect/availability/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to delete slot')
      }
      setSlots((prev) => prev.filter((s) => s.id !== id))
      setSuccess('Slot removed')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete slot')
    }
  }

  const handleBulkAdd = async (bulkSlots: Array<{ date: string; startTime: string; endTime: string; timezone: string }>) => {
    const token = localStorage.getItem('token')
    const response = await fetch('/api/connect/availability', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ slots: bulkSlots })
    })
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      throw new Error(data?.error || 'Failed to add slots')
    }
    setSuccess(`${bulkSlots.length} availability slots added!`)
    await fetchSlots()
  }

  const backLink = currentUser.role === 'MENTOR' ? '/mentor' : '/connect'

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div role="status" aria-live="polite" className="text-muted-foreground flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          Loading your mentor profile…
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Back button */}
      <div>
        <Link
          to={backLink}
          onClick={(event) => {
            if (hasUnsavedChanges && !window.confirm('Leave this page? Your unsaved profile changes will be lost.')) {
              event.preventDefault()
            }
          }}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {currentUser.role === 'MENTOR' ? 'Back to Mentor Sessions' : 'Back to Mentors'}
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {hasProfile ? 'Mentor Profile & Availability' : 'Create Mentor Profile'}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Set up your credentials, mentorship domains, and schedule slots for junior candidates.
          </p>
        </div>

        {hasProfile && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground bg-card rounded-xl border border-border px-4 py-2.5 shadow-xs">
            <div>
              <span className="font-semibold text-foreground text-sm">{profile?.rating?.toFixed(1) ?? '0.0'}</span> ⭐ rating
            </div>
            <div className="w-px h-4 bg-border" />
            <div>
              <span className="font-semibold text-foreground text-sm">{profile?.reviewCount ?? 0}</span> reviews
            </div>
            <div className="w-px h-4 bg-border" />
            <div>
              <span className="font-semibold text-foreground text-sm">{profile?.sessionCount ?? 0}</span> sessions
            </div>
          </div>
        )}
      </div>

      {profile?.user?.mentorApprovalStatus === 'PENDING' && <div role="status" className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">Your mentor application is pending administrator review. You can update your profile here. Availability and mentoring become available after approval; until then, sign in as a User.</div>}

      {/* Notifications */}
      {error && (
        <div role="alert" className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-xl flex items-center justify-between text-sm">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="text-destructive/70 hover:text-destructive">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div role="status" className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-4 py-3 rounded-xl flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {success}
          </span>
          <button type="button" onClick={() => setSuccess('')} className="text-emerald-600/70 hover:text-emerald-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {parseNotice && (
        <div role="status" className="bg-primary/10 border border-primary/30 text-primary px-4 py-3 rounded-xl flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            {parseNotice}
          </span>
          <button type="button" onClick={() => setParseNotice('')} className="text-primary/70 hover:text-primary">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* AUTO-FILL FROM RESUME CARD */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-primary/40 bg-gradient-to-br from-primary/5 via-background to-purple-500/5 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                Auto-Fill Profile from Senior Resume
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                  AI Powered
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Upload your resume (PDF) or paste its text. AI will automatically extract your title, company, experience, bio, and skills.
              </p>
            </div>
          </div>

          <div className="flex items-center bg-muted/60 p-1 rounded-lg border border-border self-start">
            <button
              type="button"
              onClick={() => setResumeMode('upload')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                resumeMode === 'upload' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'
              }`}
            >
              Upload PDF
            </button>
            <button
              type="button"
              onClick={() => setResumeMode('paste')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                resumeMode === 'paste' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'
              }`}
            >
              Paste Text
            </button>
          </div>
        </div>

        {resumeMode === 'upload' ? (
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <label className="flex-1 w-full flex items-center justify-center gap-2 px-4 py-3 border border-border rounded-xl bg-card hover:bg-muted/40 cursor-pointer text-sm transition-colors text-muted-foreground hover:text-foreground">
              <UploadCloud className="w-5 h-5 text-primary shrink-0" />
              <span className="truncate">
                {resumeFile ? resumeFile.name : 'Choose senior resume (PDF)...'}
              </span>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  if (e.target.files && e.target.files[0]) {
                    setResumeFile(e.target.files[0])
                  }
                }}
              />
            </label>
            <button
              type="button"
              disabled={!resumeFile || parsingResume}
              onClick={handleAutoFillFromResume}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shrink-0 shadow-sm"
            >
              {parsingResume ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing Resume...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Extract & Auto-Fill
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              rows={3}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your senior resume content or LinkedIn summary here..."
              className="w-full border border-border bg-card text-foreground rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex justify-end">
              <button
                type="button"
                disabled={!resumeText.trim() || parsingResume}
                onClick={handleAutoFillFromResume}
                className="px-5 py-2.5 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
              >
                {parsingResume ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Extract & Auto-Fill
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PROFILE DETAILS FORM */}
      <form onSubmit={handleSaveProfile} className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">1. Professional Details</h2>
            <p className="text-xs text-muted-foreground">Your verified credentials visible to junior mentees</p>
          </div>
        </div>

        {/* Profile Photo Uploader Component */}
        <div className="bg-muted/30 border border-border rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-5">
          <div className="relative group shrink-0">
            <img
              src={form.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(form.name || 'Mentor')}&backgroundColor=4f46e5`}
              alt="Mentor avatar"
              onError={(e) => {
                e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(form.name || 'Mentor')}&backgroundColor=4f46e5`
              }}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-primary/30 shadow-md ring-4 ring-primary/5"
            />
            <button
              type="button"
              disabled={uploadingPhoto}
              onClick={() => photoInputRef.current?.click()}
              className="absolute inset-0 bg-black/55 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px] cursor-pointer"
              title="Upload new profile photo"
            >
              <Camera className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-semibold">Change</span>
            </button>
            {uploadingPhoto && (
              <div className="absolute inset-0 bg-black/70 text-white rounded-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left min-w-0 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Profile Picture</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Upload a clear portrait to showcase on mentor cards and during video meetings.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handlePhotoUpload(file)
                  e.target.value = ''
                }}
              />
              <button
                type="button"
                disabled={uploadingPhoto}
                onClick={() => photoInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {uploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                {uploadingPhoto ? 'Uploading Photo...' : 'Upload Photo'}
              </button>

              <button
                type="button"
                onClick={() => {
                  const newSeed = Date.now().toString(36)
                  setForm({ ...form, avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(form.name || 'Mentor')}-${newSeed}&backgroundColor=4f46e5,06b6d4,10b981` })
                  setPhotoMessage({ type: 'success', text: 'Generated avatar applied.' })
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium rounded-lg transition-colors cursor-pointer"
                title="Generate an illustrated avatar"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Random Avatar
              </button>
            </div>

            {photoMessage && (
              <p className={`text-xs mt-2 font-medium ${photoMessage.type === 'success' ? 'text-emerald-500' : 'text-destructive'}`}>
                {photoMessage.text}
              </p>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-border bg-background text-foreground rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. Alex Johnson"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Custom Image URL (Optional)
            </label>
            <input
              type="text"
              value={form.avatar}
              onChange={(e) => setForm({ ...form, avatar: e.target.value })}
              placeholder="https://..."
              className="w-full border border-border bg-background text-foreground rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Current Job Title *
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Senior Software Engineer"
              className="w-full border border-border bg-background text-foreground rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Company / Organization *
            </label>
            <input
              type="text"
              required
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="e.g. Google, Microsoft, Startup"
              className="w-full border border-border bg-background text-foreground rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Domain / Specialization
            </label>
            <select
              value={form.domain}
              onChange={(e) => setForm({ ...form, domain: e.target.value })}
              className="w-full border border-border bg-background text-foreground rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Fullstack">Fullstack Development</option>
              <option value="Backend">Backend & Distributed Systems</option>
              <option value="Frontend">Frontend & Web Architecture</option>
              <option value="AI/ML">AI / Machine Learning / Data</option>
              <option value="DevOps">DevOps & Cloud Infrastructure</option>
              <option value="Mobile">Mobile (iOS / Android)</option>
              <option value="Management">Engineering Management</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Specific Tech Role
            </label>
            <input
              type="text"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              placeholder="e.g. Staff Architect, Backend Lead"
              className="w-full border border-border bg-background text-foreground rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Years of Experience
            </label>
            <input
              type="number"
              min={0}
              value={form.experience}
              onChange={(e) => setForm({ ...form, experience: parseInt(e.target.value, 10) || 0 })}
              className="w-full border border-border bg-background text-foreground rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Location
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. Bengaluru, India or Remote"
              className="w-full border border-border bg-background text-foreground rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Pricing & Free Option */}
        <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              Session Fee
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Mentors can provide sessions freely or define an hourly rate.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={isFree}
                onChange={(e) => {
                  setIsFree(e.target.checked)
                  if (e.target.checked) setForm({ ...form, hourlyRate: 0 })
                }}
                className="w-4 h-4 rounded text-primary focus:ring-primary"
              />
              <span className="font-medium text-foreground">Free Mentorship</span>
            </label>

            {!isFree && (
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-muted-foreground">₹</span>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={form.hourlyRate}
                  onChange={(e) => setForm({ ...form, hourlyRate: parseInt(e.target.value, 10) || 0 })}
                  className="w-24 border border-border bg-background text-foreground rounded-lg px-3 py-1.5 text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="500"
                />
                <span className="text-xs text-muted-foreground">/ session</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
            About Me / Mentorship Bio
          </label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={3}
            placeholder="Tell candidates about your background, what topics you enjoy mentoring on (e.g. resume reviews, mock interviews, career transitions), and how you can guide them..."
            className="w-full border border-border bg-background text-foreground rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Core Expertise & Skills (comma separated)
            </label>
            <TagInput
              value={form.expertise}
              onChange={(tags) => setForm({ ...form, expertise: tags })}
              placeholder="e.g. System Design, React, Microservices, LeetCode"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
              Achievements & Highlights (comma separated)
            </label>
            <TagInput
              value={form.achievements}
              onChange={(tags) => setForm({ ...form, achievements: tags })}
              placeholder="e.g. Ex-Amazon, 10M+ Users, Conference Speaker"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {canManageAvailability ? 'Mentor access approved' : 'Administrator approval is required before mentoring'}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : canManageAvailability ? 'Save & Update Profile' : 'Submit for review'}
          </button>
        </div>
      </form>

      {/* AVAILABILITY SLOTS MANAGER */}
      {canManageAvailability && (
      <div className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              2. Slot Availability
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Set the dates and time slots when candidates can book 1:1 sessions with you
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-medium rounded-lg transition-colors border border-border"
          >
            <Layers className="w-4 h-4 text-primary" />
            Bulk Schedule
          </button>
        </div>

        {/* Quick Presets */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            ⚡ Quick 1-Click Slot Presets
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => addPresetSlot(0, '18:00', '19:00')}
              className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-primary/5 hover:border-primary text-xs font-medium text-foreground transition-all"
            >
              + Today 6:00 PM – 7:00 PM
            </button>
            <button
              type="button"
              onClick={() => addPresetSlot(1, '18:00', '19:00')}
              className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-primary/5 hover:border-primary text-xs font-medium text-foreground transition-all"
            >
              + Tomorrow 6:00 PM – 7:00 PM
            </button>
            <button
              type="button"
              onClick={() => addPresetSlot(1, '19:00', '20:00')}
              className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-primary/5 hover:border-primary text-xs font-medium text-foreground transition-all"
            >
              + Tomorrow 7:00 PM – 8:00 PM
            </button>
            <button
              type="button"
              onClick={() => addPresetSlot(2, '11:00', '12:00')}
              className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-primary/5 hover:border-primary text-xs font-medium text-foreground transition-all"
            >
              + Weekend 11:00 AM – 12:00 PM
            </button>
          </div>
        </div>

        {/* Custom Slot Form */}
        <form onSubmit={handleAddSlot} className="p-4 rounded-xl border border-border bg-muted/20">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Date</label>
              <input
                type="date"
                required
                value={newSlot.date}
                onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                className="w-full border border-border bg-background text-foreground rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Start Time</label>
              <input
                type="time"
                required
                value={newSlot.startTime}
                onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                className="w-full border border-border bg-background text-foreground rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">End Time</label>
              <input
                type="time"
                required
                value={newSlot.endTime}
                onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                className="w-full border border-border bg-background text-foreground rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              disabled={addingSlot}
              className="w-full px-4 py-2 bg-foreground text-background font-medium text-xs rounded-lg hover:bg-foreground/90 disabled:opacity-50 transition-colors"
            >
              {addingSlot ? 'Adding...' : 'Add Slot'}
            </button>
          </div>
        </form>

        {/* Existing Slots List */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Active Availability Slots ({slots.length})
          </h3>

          {slots.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-border rounded-xl text-muted-foreground text-xs">
              No availability slots set up yet. Use the presets above or pick a custom date and time to let students book sessions.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {slots.map((slot) => {
                const dateObj = new Date(slot.date)
                const formattedDate = dateObj.toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })

                return (
                  <div
                    key={slot.id}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      slot.isBooked
                        ? 'border-amber-500/30 bg-amber-500/5'
                        : 'border-border bg-card hover:border-primary/40'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        {slot.startTime} – {slot.endTime}
                      </div>
                      <div className="text-muted-foreground mt-0.5">{formattedDate}</div>
                      <div className="mt-1">
                        {slot.isBooked ? (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            Booked
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            Available
                          </span>
                        )}
                      </div>
                    </div>

                    {!slot.isBooked && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-muted transition-colors"
                        title="Delete Slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      )}

      {showBulkModal && (
        <BulkAvailabilityModal
          isOpen={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          onAdd={handleBulkAdd}
        />
      )}
    </div>
  )
}
