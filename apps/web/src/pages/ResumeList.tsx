import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Copy, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Resume {
  id: string
  title: string
  template: string
  public: boolean
  createdAt: string
}

export default function ResumeList() {
  const navigate = useNavigate()
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchResumes()
  }, [])

  const fetchResumes = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Please login to view your resumes')
        setLoading(false)
        return
      }

      const response = await fetch('/api/resume', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch resumes')
      }

      const data = await response.json()
      setResumes(data)
    } catch (error) {
      console.error('Failed to fetch resumes:', error)
      setError('Failed to load resumes. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateResume = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: 'Untitled-resume',
          template: 'modern',
          accentColor: '#9333EA',
          professionSummary: '',
          skills: [],
          personalInfo: {},
          experience: [],
          projects: [],
          education: [],
          profile: '',
          public: false
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create resume')
      }

      const newResume = await response.json()
      navigate(`/resume-builder/${newResume.id}`)
    } catch (error) {
      console.error('Failed to create resume:', error)
      setError('Failed to create resume. Please try again.')
    }
  }

  const handleEditResume = (id: string) => {
    navigate(`/resume-builder/${id}`)
  }

  const handleDeleteResume = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/resume/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete resume')
      }

      setResumes(resumes.filter(resume => resume.id !== id))
    } catch (error) {
      console.error('Failed to delete resume:', error)
      setError('Failed to delete resume. Please try again.')
    }
  }

  const handleDuplicateResume = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/resume/${id}/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to duplicate resume')
      }

      const duplicatedResume = await response.json()
      setResumes([duplicatedResume, ...resumes])
    } catch (error) {
      console.error('Failed to duplicate resume:', error)
      setError('Failed to duplicate resume. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading your resumes…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-4 text-destructive">
        <p>{error}</p>
        <button onClick={() => { setError(''); setLoading(true); void fetchResumes(); }} className="mt-3 rounded-lg border border-current/20 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-destructive/10">
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">YOUR CAREER TOOLKIT</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">Resume Builder</h1>
          <p className="mt-2 text-muted-foreground">Create tailored resumes, review your drafts, and keep every version in one place.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
        >
          <Plus className="w-5 h-5" />
          <span>Create Resume</span>
        </button>
      </div>

      {resumes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-primary/30 bg-card px-6 py-14 text-center shadow-sm sm:px-12">
          <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><FileText className="size-7" /></span>
          <h3 className="text-xl font-semibold text-foreground">Start with your first resume</h3>
          <p className="mx-auto mb-6 mt-2 max-w-md text-muted-foreground">Choose a template, add your experience, and preview your resume as you build it.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-primary px-6 py-2.5 font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Create Your First Resume
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map((resume) => (
            <div key={resume.id} className="group rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md sm:p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{resume.title || 'Untitled resume'}</h3>
                  <p className="mt-1 text-sm capitalize text-muted-foreground">
                    {resume.template} template · {resume.public ? 'Public' : 'Private'}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditResume(resume.id)}
                    aria-label={`Edit ${resume.title || 'resume'}`}
                    title="Edit resume"
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicateResume(resume.id)}
                    aria-label={`Duplicate ${resume.title || 'resume'}`}
                    title="Duplicate resume"
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteResume(resume.id)}
                    aria-label={`Delete ${resume.title || 'resume'}`}
                    title="Delete resume"
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="mt-6 border-t border-border pt-3 text-xs text-muted-foreground">
                Created {new Date(resume.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div role="dialog" aria-modal="true" aria-labelledby="create-resume-title" className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xl">
            <h2 id="create-resume-title" className="mb-2 text-xl font-semibold text-foreground">Create a new resume?</h2>
            <p className="mb-6 text-muted-foreground">We’ll open a fresh draft with a live preview. You can tailor the content and template as you go.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg px-4 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateResume}
                className="rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-opacity hover:opacity-90"
              >
                Create Resume
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
