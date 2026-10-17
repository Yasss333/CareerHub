import { useState, useRef, useEffect } from 'react';
import { Check, Palette } from 'lucide-react';

interface ColorPickerProps {
  selectedColor: string;
  onChange: (color: string) => void;
}

export default function ColorPicker({ selectedColor, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const colors = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Teal', value: '#14B8A6' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Gray', value: '#6B7280' },
    { name: 'Black', value: '#1F2937' }
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
        className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-purple-50 to-purple-200 px-3 py-2 text-xs font-semibold text-purple-700 shadow-xs ring-1 ring-purple-300 transition-all hover:ring-2 hover:ring-purple-500 dark:from-purple-950 dark:to-purple-900 dark:text-purple-200 dark:ring-purple-800"
      >
        <Palette className="size-4" />
        <span>Accent</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-40 mt-2 grid w-64 grid-cols-4 gap-3 rounded-xl border border-gray-200 bg-white p-3.5 shadow-xl animate-in fade-in duration-150 dark:border-border dark:bg-card">
          {colors.map((color) => {
            const isSelected = selectedColor.toLowerCase() === color.value.toLowerCase();
            return (
              <div
                key={color.value}
                onClick={() => {
                  onChange(color.value);
                  setIsOpen(false);
                }}
                className="group relative flex cursor-pointer flex-col items-center gap-1"
              >
                <div
                  className="relative flex size-10 items-center justify-center rounded-full border border-transparent shadow-xs transition-transform group-hover:scale-105 group-hover:border-slate-400"
                  style={{ backgroundColor: color.value }}
                >
                  {isSelected && <Check className="size-4 text-white drop-shadow-sm" />}
                </div>
                <p className="text-[10px] font-medium text-slate-600 dark:text-slate-300">{color.name}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
