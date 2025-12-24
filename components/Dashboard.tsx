
import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Calendar, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  Settings2,
  MoreVertical,
  Activity,
  Mic
} from 'lucide-react';
import { Reminder, GlucoseLog, Notification, RoutineLabel } from '../types.ts';
import RoutineSettings from './RoutineSettings.tsx';
import StatsOverview from './StatsOverview.tsx';
import LiveVoiceOverlay from './LiveVoiceOverlay.tsx';

interface DashboardProps {
  reminders: Reminder[];
  logs: GlucoseLog[];
  notifications: Notification[];
  onAddLog: (value: number, label: RoutineLabel) => void;
  onSnooze: (id: string) => void;
  onUpdateReminders: (reminders: Reminder[]) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  reminders, 
  logs, 
  notifications, 
  onAddLog, 
  onSnooze,
  onUpdateReminders
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showLive, setShowLive] = useState(false);
  const [tempValue, setTempValue] = useState<string>("100");
  const [selectedLabel, setSelectedLabel] = useState<RoutineLabel>(RoutineLabel.FASTING);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8 pb-24">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">GlucoTrack</h1>
          <p className="text-slate-500 font-medium">Monitoring your wellness journey</p>
        </div>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-full hover:bg-slate-200 transition-colors bg-white shadow-sm border border-slate-200"
        >
          <Settings2 className="w-6 h-6 text-slate-600" />
        </button>
      </header>

      {/* Main Stats */}
      <StatsOverview logs={logs} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Alerts / Activity Center */}
        <div className="md:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Activity</h2>
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-semibold">
              {notifications.length} Alerts
            </span>
          </div>
          
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center">
                <p className="text-slate-400 text-sm">All systems normal. No pending alerts.</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm relative overflow-hidden group">
                  {notif.type === 'tactical' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400" />}
                  {notif.type === 'strategic' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400" />}
                  
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-slate-800 text-sm">{notif.title}</h3>
                    <span className="text-[10px] text-slate-400">{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs text-slate-600 mb-3 leading-relaxed">{notif.message}</p>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setSelectedLabel(notif.reminderId ? reminders.find(r => r.id === notif.reminderId)?.label || RoutineLabel.FASTING : RoutineLabel.FASTING);
                        setShowLogModal(true);
                      }}
                      className="text-[11px] font-bold bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      Log Now
                    </button>
                    {notif.type === 'tactical' && (
                      <button 
                        onClick={() => onSnooze(notif.id)}
                        className="text-[11px] font-bold border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        Snooze 15m
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Routine & Schedule */}
        <div className="md:col-span-2 space-y-6">
           <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
               <h2 className="font-bold text-slate-800 flex items-center gap-2">
                 <Clock className="w-5 h-5 text-blue-500" />
                 Your Daily Routine
               </h2>
               <button onClick={() => setShowSettings(true)} className="text-xs font-bold text-blue-600">Adjust</button>
             </div>
             
             <div className="divide-y divide-slate-50">
               {reminders.map((reminder) => {
                 const hasLoggedToday = logs.some(l => l.label === reminder.label && new Date(l.timestamp).toDateString() === new Date().toDateString());
                 return (
                   <div key={reminder.id} className="p-4 flex items-center justify-between group">
                     <div className="flex items-center gap-4">
                       <div className={`p-2 rounded-lg ${hasLoggedToday ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-400'}`}>
                         {hasLoggedToday ? <CheckCircle2 className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                       </div>
                       <div>
                         <p className={`text-sm font-semibold ${hasLoggedToday ? 'text-slate-400' : 'text-slate-800'}`}>{reminder.label}</p>
                         <p className="text-xs text-slate-400 font-medium">{reminder.time}</p>
                       </div>
                     </div>
                     <button 
                       disabled={hasLoggedToday}
                       onClick={() => { setSelectedLabel(reminder.label); setShowLogModal(true); }}
                       className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${hasLoggedToday ? 'text-emerald-600' : 'bg-slate-100 text-slate-900 opacity-0 group-hover:opacity-100'}`}
                     >
                       {hasLoggedToday ? 'Logged' : 'Log'}
                     </button>
                   </div>
                 );
               })}
             </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
             <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-lg cursor-pointer hover:bg-blue-700 transition-all">
               <BarChart3 className="w-8 h-8 mb-4 opacity-80" />
               <h3 className="font-bold text-lg">Weekly Review</h3>
               <p className="text-blue-100 text-xs mt-1">Check progress</p>
             </div>
             <div className="bg-white p-4 rounded-2xl border border-slate-200 cursor-pointer hover:border-blue-400 transition-all group">
               <Calendar className="w-8 h-8 mb-4 text-blue-500 group-hover:scale-110 transition-transform" />
               <h3 className="font-bold text-lg">Monthly Report</h3>
               <p className="text-slate-500 text-xs mt-1">Export PDF</p>
             </div>
           </div>
        </div>
      </div>

      {/* Floating Live Button */}
      <button 
        onClick={() => setShowLive(true)}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-8 py-4 rounded-full shadow-2xl shadow-blue-400/50 flex items-center gap-3 hover:bg-blue-700 hover:-translate-y-1 transition-all z-40 group"
      >
        <div className="w-2 h-2 bg-white rounded-full animate-ping group-hover:hidden" />
        <Mic className="w-5 h-5" />
        <span className="font-black text-sm tracking-tight">VOICE MODE</span>
      </button>

      {showLive && (
        <LiveVoiceOverlay 
          onClose={() => setShowLive(false)}
          onAddLog={onAddLog}
          onSnooze={(label) => {
            const notif = notifications.find(n => reminders.find(r => r.id === n.reminderId)?.label === label);
            if(notif) onSnooze(notif.id);
          }}
        />
      )}

      {/* Modals */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <RoutineSettings 
              reminders={reminders} 
              onSave={(updated) => { onUpdateReminders(updated); setShowSettings(false); }}
              onClose={() => setShowSettings(false)}
            />
          </div>
        </div>
      )}

      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6">
            <h3 className="text-xl font-bold mb-4">Log Glucose</h3>
            <p className="text-slate-500 text-sm mb-6">Recording for: <strong>{selectedLabel}</strong></p>
            <input 
              type="number" 
              autoFocus
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className="w-full text-4xl font-bold p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-3 pt-6">
              <button onClick={() => setShowLogModal(false)} className="flex-1 py-3 font-bold text-slate-500">Cancel</button>
              <button 
                onClick={() => { onAddLog(parseInt(tempValue), selectedLabel); setShowLogModal(false); }}
                className="flex-2 bg-blue-600 text-white py-3 px-8 font-bold rounded-xl"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
