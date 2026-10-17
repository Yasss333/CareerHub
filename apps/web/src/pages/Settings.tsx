import { FormEvent, useEffect, useRef, useState } from 'react'
import { Camera, LoaderCircle, Save, UserRound } from 'lucide-react'

interface AccountUser {
  id: string
  name: string
  email: string
  role: string
  image?: string | null
  avatar?: string | null
  createdAt?: string
  [key: string]: unknown
}

export default function Settings() {
  const [user, setUser] = useState<AccountUser | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [originalEmail, setOriginalEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const token = localStorage.getItem('token')

  const applyUser = (updatedUser: AccountUser) => {
    setUser(updatedUser)
    setName(updatedUser.name || '')
    setEmail(updatedUser.email || '')
    setOriginalEmail(updatedUser.email || '')
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }

  useEffect(() => {
    let active = true
    const loadProfile = async () => {
      try {
        const response = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Could not load your profile')
        if (active) applyUser(data)
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load your profile')
      } finally {
        if (active) setLoading(false)
      }
    }
    loadProfile()
    return () => { active = false }
  }, [])

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)
    try {
      const response = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, currentPassword })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not save your profile')
      applyUser(data.user)
      setCurrentPassword('')
      setSuccess('Your profile has been updated.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save your profile')
    } finally {
      setSaving(false)
    }
  }

  const uploadPhoto = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file to upload.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Choose an image smaller than 5 MB.')
      return
    }
    setError('')
    setSuccess('')
    setPreviewUrl(URL.createObjectURL(file))
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('photo', file)
      const response = await fetch('/api/auth/me/photo', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not upload your photo')
      applyUser(data.user)
      setPreviewUrl('')
      setSuccess('Your profile photo has been updated.')
    } catch (uploadError) {
      setPreviewUrl('')
      setError(uploadError instanceof Error ? uploadError.message : 'Could not upload your photo')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const photoUrl = previewUrl || user?.image || user?.avatar

  if (loading) {
    return <div className="mx-auto max-w-4xl py-16 text-center text-muted-foreground">Loading your settings…</div>
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Account</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-2 text-muted-foreground">Manage your profile details and the information shown across CareerHub.</p>
      </header>

      {(error || success) && (
        <div role={error ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300'}`}>
          {error || success}
        </div>
      )}

      <section className="rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 border-b border-border pb-7 sm:flex-row sm:items-center">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-border bg-primary/10">
            {photoUrl
              ? <img src={photoUrl} alt="Your profile" className="h-full w-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center text-primary"><UserRound className="h-10 w-10" /></div>}
            {uploading && <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white"><LoaderCircle className="h-6 w-6 animate-spin" /></div>}
          </div>
          <div>
            <h2 className="text-lg font-semibold">Profile photo</h2>
            <p className="mt-1 text-sm text-muted-foreground">Use a JPG, PNG, WEBP, or GIF image up to 5 MB.</p>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(event) => uploadPhoto(event.target.files?.[0])} />
            <button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary disabled:opacity-60">
              {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {uploading ? 'Uploading…' : 'Upload photo'}
            </button>
          </div>
        </div>

        <form onSubmit={saveProfile} className="space-y-5 pt-7">
          <div>
            <h2 className="text-lg font-semibold">Personal details</h2>
            <p className="mt-1 text-sm text-muted-foreground">Your name and email are used across your account.</p>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Full name</span>
            <input required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Email address</span>
            <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </label>
          {email.trim().toLowerCase() !== originalEmail.trim().toLowerCase() && (
            <label className="block space-y-2">
              <span className="text-sm font-medium">Current password</span>
              <input required type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
              <span className="block text-xs text-muted-foreground">Confirm your password to update your sign-in email.</span>
            </label>
          )}
          {user?.createdAt && <p className="text-xs text-muted-foreground">Member since {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>}
          <div className="flex justify-end border-t border-border pt-5">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
