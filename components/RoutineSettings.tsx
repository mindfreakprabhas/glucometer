
import React, { useState } from 'react';
import { Reminder, RoutineLabel } from '../types';
import { X, Save, Clock } from 'lucide-react';

interface RoutineSettingsProps {
  reminders: Reminder[];
  onSave: (updated: Reminder[]) => void;
  onClose: () => void;
}

const RoutineSettings: React.FC<RoutineSettingsProps> = ({ reminders, onSave, onClose }) => {
  const [localReminders, setLocalReminders] = useState<Reminder[]>([...reminders]);

  const toggleReminder = (id: string) => {
    setLocalReminders(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const updateTime = (id: string, time: string) => {
    setLocalReminders(prev => prev.map(r => r.id === id ? { ...r, time } : r));
  };

  return (
    <div className="flex flex-col h-full max-h-[90vh]">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Notification Schedule</h2>
          <p className="text-sm text-slate-500">Set times based on your daily routine</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {localReminders.map(reminder => (
          <div key={reminder.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${reminder.enabled ? 'border-blue-100 bg-blue-50/30' : 'border-slate-100 bg-white opacity-60'}`}>
            <div className="flex items-center gap-4">
              <input 
                type="checkbox" 
                checked={reminder.enabled} 
                onChange={() => toggleReminder(reminder.id)}
                className="w-5 h-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p className="font-bold text-slate-800 text-sm">{reminder.label}</p>
                <div className="flex items-center gap-1 text-slate-500 text-xs">
                  <Clock className="w-3 h-3" />
                  <span>Daily</span>
                </div>
              </div>
            </div>
            
            <input 
              type="time" 
              value={reminder.time}
              disabled={!reminder.enabled}
              onChange={(e) => updateTime(reminder.id, e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>
        ))}
      </div>

      <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
        <button 
          onClick={onClose}
          className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors"
        >
          Discard
        </button>
        <button 
          onClick={() => onSave(localReminders)}
          className="flex-2 bg-slate-900 text-white py-3 px-8 font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          Update Schedule
        </button>
      </div>
    </div>
  );
};

export default RoutineSettings;
