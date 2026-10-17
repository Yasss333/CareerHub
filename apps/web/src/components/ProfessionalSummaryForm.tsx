import { useState } from 'react';
import { Sparkles, X, Loader2 } from 'lucide-react';

interface ProfessionalSummaryFormProps {
  value: string;
  onChange: (value: string) => void;
}

const ProfessionalSummaryForm = ({ value, onChange }: ProfessionalSummaryFormProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const generateSummary = async () => {
    if (!value.trim()) {
      alert('Please enter some text to enhance');
      return;
    }

    setIsGenerating(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/enhance-pro-sum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userContent: value })
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || result?.error || 'AI enhancement failed. Please try again.');
      if (typeof result?.enhancedSolution !== 'string' || !result.enhancedSolution.trim()) {
        throw new Error('AI returned an empty summary. Please try again.');
      }
      onChange(result.enhancedSolution.trim());
    } catch (error) {
      console.error('AI generation error:', error);
      setError(error instanceof Error ? error.message : 'AI enhancement failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700">Professional Summary</h3>
        <button
          onClick={generateSummary}
          disabled={isGenerating || !value.trim()}
          className="flex bg-gradient-to-br from-primary/10 to-primary/20 text-primary hover:bg-primary/15 transition-colors disabled:opacity-50 text-sm rounded-lg px-3 py-1 border-transparent hover:border-primary"
        >
          {isGenerating ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-4 h-4 ml-2 mt-0.5" />
              AI Enhance
            </>
          )}
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        rows={4}
        placeholder="Write a brief professional summary..."
      />
    </div>
  );
};

export default ProfessionalSummaryForm;