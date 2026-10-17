import { useCallback, useEffect, useState } from 'react'
import { Check, RefreshCw, ShieldCheck, X } from 'lucide-react'

interface MentorApplication {
  id: string
  name: string | null
  email: string
  mentorApprovalStatus: string
  seniorProfile: {
    title: string
    company: string
    domain: string
    role: string
    bio: string
    experience: number
    location: string
    expertise: string[]
    achievements: string[]
    createdAt: string
  } | null
}

export default function AdminMentorApplications() {
  const [applications, setApplications] = useState<MentorApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewingId, setReviewingId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadApplications = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/connect/admin/mentor-applications', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.error || 'Unable to load mentor applications.')
      if (!Array.isArray(result)) throw new Error('The server returned an invalid applications list.')
      setApplications(result)
    } catch (loadError) {
      console.error('Failed to load mentor applications:', loadError)
      setError(loadError instanceof Error ? loadError.message : 'Unable to load mentor applications.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadApplications()
  }, [loadApplications])

  const reviewApplication = async (application: MentorApplication, decision: 'approve' | 'reject') => {
    setReviewingId(application.id)
    setError('')
    setNotice('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/connect/admin/mentor-applications/${application.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ decision }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.error || 'Unable to review this application.')
      setApplications((current) => current.filter((item) => item.id !== application.id))
      setNotice(`${application.name || application.email} was ${decision === 'approve' ? 'approved' : 'rejected'}.`)
    } catch (reviewError) {
      console.error('Failed to review mentor application:', reviewError)
      setError(reviewError instanceof Error ? reviewError.message : 'Unable to review this application.')
    } finally {
      setReviewingId('')
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-primary">
            <ShieldCheck className="size-4" aria-hidden="true" />
            Administrator tools
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Mentor applications</h1>
          <p className="mt-2 text-muted-foreground">Review profiles before they appear in mentor discovery.</p>
        </div>
        <button
          type="button"
          onClick={() => void loadApplications()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Refresh
        </button>
      </header>

      {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">{notice}</p>}

      {loading ? (
        <p className="py-12 text-center text-muted-foreground">Loading applications...</p>
      ) : applications.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <ShieldCheck className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-3 font-semibold">No pending applications</h2>
          <p className="mt-1 text-sm text-muted-foreground">New mentor requests will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <article key={application.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold">{application.name || application.email}</h2>
                  <p className="text-sm text-muted-foreground">{application.email}</p>
                  {application.seniorProfile && (
                    <>
                      <p className="mt-3 font-medium">
                        {application.seniorProfile.title} at {application.seniorProfile.company}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {[application.seniorProfile.domain, application.seniorProfile.location, `${application.seniorProfile.experience} years experience`]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                      {application.seniorProfile.bio && <p className="mt-3 whitespace-pre-wrap text-sm">{application.seniorProfile.bio}</p>}
                      {application.seniorProfile.expertise.length > 0 && (
                        <p className="mt-3 text-sm"><span className="font-medium">Expertise:</span> {application.seniorProfile.expertise.join(', ')}</p>
                      )}
                      {application.seniorProfile.achievements.length > 0 && (
                        <p className="mt-1 text-sm"><span className="font-medium">Achievements:</span> {application.seniorProfile.achievements.join(', ')}</p>
                      )}
                    </>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => void reviewApplication(application, 'reject')}
                    disabled={Boolean(reviewingId)}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                  >
                    <X className="size-4" aria-hidden="true" />
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => void reviewApplication(application, 'approve')}
                    disabled={Boolean(reviewingId)}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Check className="size-4" aria-hidden="true" />
                    {reviewingId === application.id ? 'Reviewing...' : 'Approve'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
