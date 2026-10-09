import { useState } from 'react';
import { Calendar, Clock, Plus, X, Save } from 'lucide-react';

interface BulkAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (slots: Array<{ date: string; startTime: string; endTime: string; timezone: string }>) => Promise<void>;
}

const BulkAvailabilityModal = ({ isOpen, onClose, onAdd }: BulkAvailabilityModalProps) => {
  const [slots, setSlots] = useState<Array<{ date: string; startTime: string; endTime: string; timezone: string }>>([
    { date: '', startTime: '', endTime: '', timezone: 'UTC' }
  ]);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const commonTimezones = [
    'UTC',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Kolkata',
    'Asia/Tokyo',
    'Australia/Sydney'
  ];

  const addSlotRow = () => {
    setSlots([...slots, { date: '', startTime: '', endTime: '', timezone: slots[0]?.timezone || 'UTC' }]);
  };

  const removeSlotRow = (index: number) => {
    if (slots.length > 1) {
      setSlots(slots.filter((_, i) => i !== index));
    }
  };

  const updateSlot = (index: number, field: string, value: string) => {
    const newSlots = [...slots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setSlots(newSlots);
  };

  const generateRecurring = () => {
    const startDate = slots[0]?.date;
    if (!startDate) {
      setError('Please set a start date first');
      return;
    }

    const daysToAdd = 7; // Weekly recurrence
    const occurrences = 4; // 4 weeks

    const newSlots = [...slots];
    for (let i = 1; i < occurrences; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + (daysToAdd * i));
      newSlots.push({
        date: date.toISOString().split('T')[0],
        startTime: slots[0].startTime,
        endTime: slots[0].endTime,
        timezone: slots[0].timezone
      });
    }

    setSlots(newSlots);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setError('');

    // Validate all slots
    const invalidSlots = slots.filter(s => !s.date || !s.startTime || !s.endTime);
    if (invalidSlots.length > 0) {
      setError('Please fill in all date and time fields');
      setAdding(false);
      return;
    }

    try {
      await onAdd(slots);
      setSlots([{ date: '', startTime: '', endTime: '', timezone: 'UTC' }]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add slots');
    } finally {
      setAdding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Bulk Add Availability</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <label className="text-sm font-medium text-gray-700">Default Timezone:</label>
              <select
                value={slots[0]?.timezone || 'UTC'}
                onChange={(e) => {
                  const newSlots = slots.map(s => ({ ...s, timezone: e.target.value }));
                  setSlots(newSlots);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {commonTimezones.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              {slots.map((slot, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={slot.date}
                      onChange={(e) => updateSlot(index, 'date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Start</label>
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateSlot(index, 'startTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-xs font-medium text-gray-700 mb-1">End</label>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateSlot(index, 'endTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {slots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSlotRow(index)}
                      className="mt-5 text-red-400 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={addSlotRow}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Another Slot
              </button>
              <button
                type="button"
                onClick={generateRecurring}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Generate Weekly (4 weeks)
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={adding}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {adding ? 'Adding...' : `Add ${slots.length} Slot${slots.length > 1 ? 's' : ''}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BulkAvailabilityModal;