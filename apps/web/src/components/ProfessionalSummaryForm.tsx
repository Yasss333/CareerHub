import { useState } from 'react';
import { Sparkles, X, Loader2 } from 'lucide-react';

interface ProfessionalSummaryFormProps {
  value: string;
  onChange: (value: string) => void;
}

const ProfessionalSummaryForm = ({ value, onChange }: ProfessionalSummaryFormProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSummary = async () => {
    if (!value.trim()) {
      alert('Please enter some text to enhance');
      return;
    }

    setIsGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/ai/enhance-pro-sum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userContent: value })
      });

      if (response.ok) {
        const result = await response.json();
        onChange(result.enhancedSolution);
      } else {
        alert('Failed to generate AI summary');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      alert('Error generating AI summary');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700">Professional Summary</h3>
        <button
          onClick={generateSummary}
          disabled={isGenerating || !value.trim()}
          className="flex bg-gradient-to-br from-purple-50 to-purple-400 text-purple-700 hover:bg-purple-200 transition-colors disabled:opacity-50 text-sm rounded-lg px-3 py-1 border-transparent hover:border-purple-950"
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
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={4}
        placeholder="Write a brief professional summary..."
      />
    </div>
  );
};

export default ProfessionalSummaryForm;