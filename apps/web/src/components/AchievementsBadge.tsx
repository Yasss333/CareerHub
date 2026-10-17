import { useState, useEffect } from 'react'
import { Award, Trophy, Star, Target } from 'lucide-react'

interface Achievement {
  id: string
  type: string
  title: string
  description: string
  icon: string | null
  unlockedAt: string
}

interface AchievementsBadgeProps {
  userId?: string
  compact?: boolean
}

export default function AchievementsBadge({ userId, compact = false }: AchievementsBadgeProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadAchievements()
  }, [])

  const loadAchievements = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/achievements', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setAchievements(data.achievements || [])
    } catch (error) {
      console.error('Failed to load achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  const triggerAchievementCheck = async (type: string) => {
    try {
      const token = localStorage.getItem('token')
      await fetch('/api/achievements/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type })
      })
      loadAchievements()
    } catch (error) {
      console.error('Failed to check achievements:', error)
    }
  }

  if (loading) {
    return compact ? (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Award className="w-4 h-4" />
        Loading...
      </div>
    ) : null
  }

  if (compact) {
    return (
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
      >
        <Award className="w-4 h-4" />
        <span className="text-sm font-medium">{achievements.length}</span>
      </button>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
      >
        <Award className="w-5 h-5" />
        <span className="font-medium">Achievements</span>
        <span className="bg-yellow-200 text-yellow-800 text-xs px-2 py-0.5 rounded-full">
          {achievements.length}
        </span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  <h2 className="text-xl font-semibold text-gray-900">Achievements</h2>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {achievements.length === 0 ? (
                <div className="text-center py-12">
                  <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No achievements yet. Start exploring!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{achievement.icon || '🏆'}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{achievement.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500 text-center">
                Complete tasks across CareerHub to unlock achievements!
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
