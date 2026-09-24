export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'

const difficultyClass: Record<Difficulty, string> = {
  EASY: 'bg-green-50 text-green-700 border-green-200',
  MEDIUM: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  HARD: 'bg-red-50 text-red-700 border-red-200',
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${difficultyClass[difficulty] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
      {difficulty}
    </span>
  )
}

const statusClass: Record<string, string> = {
  Accepted: 'bg-green-50 text-green-700 border-green-200',
  'Wrong Answer': 'bg-red-50 text-red-700 border-red-200',
  'Runtime Error': 'bg-orange-50 text-orange-700 border-orange-200',
  'Piston Error': 'bg-purple-50 text-purple-700 border-purple-200',
}

export function SubmissionStatusBadge({ status }: { status: string }) {
  const short = status === 'Accepted' ? 'Accepted' : status || 'Unknown'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusClass[status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
      {short}
    </span>
  )
}

const languageLabels: Record<string, string> = {
  JAVASCRIPT: 'JavaScript',
  PYTHON: 'Python',
  CPP: 'C++',
  JAVA: 'Java',
}

export function languageLabel(key: string): string {
  return languageLabels[key] || key
}