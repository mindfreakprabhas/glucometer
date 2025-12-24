
import React, { useState, useEffect, useCallback } from 'react';
import Dashboard from './components/Dashboard.tsx';
import { Reminder, GlucoseLog, Notification, RoutineLabel } from './types.ts';
import { getSupportiveCopy } from './services/geminiService.ts';

const DEFAULT_REMINDERS: Reminder[] = [
  { id: '1', label: RoutineLabel.FASTING, time: '07:00', enabled: true },
  { id: '2', label: RoutineLabel.POST_BREAKFAST, time: '09:30', enabled: true },
  { id: '3', label: RoutineLabel.POST_LUNCH, time: '13:30', enabled: true },
  { id: '4', label: RoutineLabel.POST_DINNER, time: '20:30', enabled: true },
  { id: '5', label: RoutineLabel.BEFORE_BED, time: '22:30', enabled: true },
];

const App: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('gluco_reminders');
    return saved ? JSON.parse(saved) : DEFAULT_REMINDERS;
  });

  const [logs, setLogs] = useState<GlucoseLog[]>(() => {
    const saved = localStorage.getItem('gluco_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Persist data
  useEffect(() => {
    localStorage.setItem('gluco_reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem('gluco_logs', JSON.stringify(logs));
  }, [logs]);

  /**
   * TACTICAL LOGIC: 
   * Trigger notification if user hasn't logged within 30 minutes of scheduled time.
   */
  const checkTacticalReminders = useCallback(async () => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const reminder of reminders) {
      if (!reminder.enabled) continue;

      // Check if snoozed
      if (reminder.snoozedUntil && reminder.snoozedUntil > Date.now()) continue;

      const [hours, mins] = reminder.time.split(':').map(Number);
      const scheduledMinutes = hours * 60 + mins;

      // 30 minute window condition
      const isPastDue = currentMinutes >= scheduledMinutes && currentMinutes <= scheduledMinutes + 30;
      
      if (isPastDue) {
        // Check if already logged today for this routine
        const alreadyLogged = logs.some(l => 
          l.label === reminder.label && 
          new Date(l.timestamp).toDateString() === now.toDateString()
        );

        // Check if notification already exists for this reminder in the last 30 mins
        const alertExists = notifications.some(n => 
          n.reminderId === reminder.id && 
          (Date.now() - n.timestamp) < 30 * 60 * 1000
        );

        if (!alreadyLogged && !alertExists) {
          const messages = await getSupportiveCopy(reminder.label);
          const randomMsg = messages[Math.floor(Math.random() * messages.length)];
          
          const newNotif: Notification = {
            id: `alert-${reminder.id}-${Date.now()}`,
            title: `${reminder.label} Check-in`,
            message: randomMsg,
            type: 'tactical',
            timestamp: Date.now(),
            reminderId: reminder.id
          };
          setNotifications(prev => [newNotif, ...prev]);
        }
      }
    }
  }, [reminders, logs, notifications]);

  /**
   * STRATEGIC LOGIC:
   * Weekly Review on Sunday, Monthly Health Report on 1st of month.
   */
  const checkStrategicPrompts = useCallback(() => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday
    const date = now.getDate();

    // Weekly Review (Sunday)
    if (day === 0) {
      const exists = notifications.some(n => n.type === 'strategic' && n.title === 'Weekly Review' && new Date(n.timestamp).toDateString() === now.toDateString());
      if (!exists) {
        setNotifications(prev => [{
          id: `weekly-${Date.now()}`,
          title: 'Weekly Review',
          message: "It's Sunday! Take a look at your 'Time in Range' summary for the week.",
          type: 'strategic',
          timestamp: Date.now()
        }, ...prev]);
      }
    }

    // Monthly Report (1st of month)
    if (date === 1) {
      const exists = notifications.some(n => n.type === 'strategic' && n.title === 'Monthly Health Report');
      if (!exists) {
        setNotifications(prev => [{
          id: `monthly-${Date.now()}`,
          title: 'Monthly Health Report',
          message: "Your 30-day health summary is ready. Export the PDF for your next doctor visit.",
          type: 'strategic',
          timestamp: Date.now()
        }, ...prev]);
      }
    }
  }, [notifications]);

  // Run checker every minute (simulating background worker)
  useEffect(() => {
    const interval = setInterval(() => {
      checkTacticalReminders();
      checkStrategicPrompts();
    }, 60000); // 1 minute
    
    // Initial check
    checkTacticalReminders();
    checkStrategicPrompts();

    return () => clearInterval(interval);
  }, [checkTacticalReminders, checkStrategicPrompts]);

  const handleAddLog = (value: number, label: RoutineLabel) => {
    const newLog: GlucoseLog = {
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      value,
      label
    };
    setLogs(prev => [...prev, newLog]);
    
    // Clear notifications for this label
    setNotifications(prev => prev.filter(n => {
       const reminder = reminders.find(r => r.id === n.reminderId);
       return reminder?.label !== label;
    }));
  };

  const handleSnooze = (notifId: string) => {
    const notification = notifications.find(n => n.id === notifId);
    if (notification && notification.reminderId) {
      setReminders(prev => prev.map(r => 
        r.id === notification.reminderId 
          ? { ...r, snoozedUntil: Date.now() + 15 * 60 * 1000 } 
          : r
      ));
      setNotifications(prev => prev.filter(n => n.id !== notifId));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <Dashboard 
        reminders={reminders}
        logs={logs}
        notifications={notifications}
        onAddLog={handleAddLog}
        onSnooze={handleSnooze}
        onUpdateReminders={setReminders}
      />
      
      {/* Simulation/Manual Trigger Box for Reviewers */}
      <div className="fixed bottom-6 right-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-200 w-64">
        <h4 className="text-[10px] font-bold uppercase text-slate-400 mb-3 tracking-widest">Dev Simulator</h4>
        <div className="space-y-2">
          <button 
            onClick={() => setNotifications(prev => [{
              id: 'test-1',
              title: 'Routine Check-in',
              message: "Time for your post-lunch check. Let's see how your body is feeling.",
              type: 'tactical',
              timestamp: Date.now(),
              reminderId: '3'
            }, ...prev])}
            className="w-full text-left px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
          >
            Trigger Tactical Alert
          </button>
          <button 
             onClick={() => setNotifications(prev => [{
              id: 'test-2',
              title: 'Weekly Review',
              message: "It's Sunday! Take a look at your 'Time in Range' summary for the week.",
              type: 'strategic',
              timestamp: Date.now()
            }, ...prev])}
            className="w-full text-left px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
          >
            Trigger Strategic Alert
          </button>
          <button 
            onClick={() => setNotifications([])}
            className="w-full text-left px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg text-xs font-semibold transition-colors"
          >
            Clear All Alerts
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
