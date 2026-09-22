import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Copy, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Resume {
  id: string
  title: string
  template: string
  public: boolean
  createdAt: string
  skills: string[]
  personalInfo: any
  experience: any[]
  projects: any[]
  education: any[]
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

      const response = await fetch('http://localhost:5000/api/resume', {
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
      const response = await fetch('http://localhost:5000/api/resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: 'Untitled-resume',
          template: 'modern',
          accentColor: '#3B82F6',
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
      const response = await fetch(`http://localhost:5000/api/resume/${id}`, {
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
      const response = await fetch(`http://localhost:5000/api/resume/${id}/duplicate`, {
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
        <div className="text-gray-600">Loading resumes...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
        {error}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Resume Builder</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create Resume</span>
        </button>
      </div>

      {resumes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No resumes yet</h3>
          <p className="text-gray-600 mb-6">Create your first resume to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Resume
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map((resume) => (
            <div key={resume.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{resume.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {resume.template} template • {resume.public ? 'Public' : 'Private'}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditResume(resume.id)}
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicateResume(resume.id)}
                    className="text-gray-600 hover:text-green-600 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteResume(resume.id)}
                    className="text-gray-600 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Created {new Date(resume.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Resume</h2>
            <p className="text-gray-600 mb-6">A new resume will be created with default settings. You can customize it after creation.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateResume}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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