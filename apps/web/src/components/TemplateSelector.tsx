import { useState, useRef, useEffect } from 'react';
import { Check, Layout } from 'lucide-react';

interface TemplateSelectorProps {
  selectedTemplate: string;
  onChange: (template: string) => void;
}

export default function TemplateSelector({ selectedTemplate, onChange }: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const templates = [
    {
      id: 'classic',
      name: 'classic',
      preview: 'A Classic Template with clear sections and Typographies'
    },
    {
      id: 'modern',
      name: 'modern',
      preview: 'A Modern Template with Futuristic and Typographies'
    },
    {
      id: 'minimal-image',
      name: 'minimal-image',
      preview: 'Minimal design with simple image'
    },
    {
      id: 'minimal',
      name: 'minimal',
      preview: 'Ultra-clean design that puts your content front and center'
    }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 px-3 py-2 text-xs font-semibold text-blue-700 shadow-xs ring-1 ring-blue-300 transition-all hover:ring-2 hover:ring-blue-500 dark:from-blue-950 dark:to-blue-900 dark:text-blue-200 dark:ring-blue-800"
      >
        <Layout className="size-4" />
        <span>Template</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-40 mt-2 w-64 space-y-2.5 rounded-xl border border-gray-200 bg-white p-3 shadow-xl animate-in fade-in duration-150 dark:border-border dark:bg-card">
          {templates.map((temp) => {
            const isSelected = selectedTemplate === temp.id;
            return (
              <div
                key={temp.id}
                onClick={() => {
                  onChange(temp.id);
                  setIsOpen(false);
                }}
                className={`relative cursor-pointer rounded-lg border p-3 transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500 text-white shadow-sm'
                    : 'border-blue-200 bg-white text-slate-800 hover:border-blue-500 hover:bg-blue-50/50 dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-muted'
                }`}
              >
                {isSelected && (
                  <div className="absolute right-2 top-2">
                    <div className="flex size-5 items-center justify-center rounded-full bg-blue-400">
                      <Check className="size-3 text-white" />
                    </div>
                  </div>
                )}

                <div>
                  <h4 className={`text-sm font-semibold capitalize ${isSelected ? 'text-white' : 'text-slate-900 dark:text-foreground'}`}>
                    {temp.name}
                  </h4>
                  <div
                    className={`mt-2 rounded-md p-2 text-xs italic ${
                      isSelected
                        ? 'bg-blue-600/60 text-blue-50'
                        : 'bg-blue-50 text-slate-600 dark:bg-muted dark:text-muted-foreground'
                    }`}
                  >
                    {temp.preview}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
