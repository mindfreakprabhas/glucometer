
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { GlucoseLog } from '../types.ts';

interface StatsOverviewProps {
  logs: GlucoseLog[];
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ logs }) => {
  const chartData = logs.slice(-7).map(log => ({
    time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: log.value,
    fullDate: new Date(log.timestamp).toLocaleString()
  }));

  const lastReading = logs.length > 0 ? logs[logs.length - 1] : null;
  
  // Calculate Time in Range (70-140 mg/dL)
  const inRangeCount = logs.filter(l => l.value >= 70 && l.value <= 140).length;
  const timeInRange = logs.length > 0 ? Math.round((inRangeCount / logs.length) * 100) : 0;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
              <span className="text-xl">🩸</span>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Latest Reading</p>
              <p className="text-3xl font-black text-slate-800">
                {lastReading ? lastReading.value : '--'} <span className="text-sm font-medium text-slate-400">mg/dL</span>
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-2xl">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Time in Range</p>
              <div className="flex items-end gap-1">
                <span className="text-xl font-bold text-emerald-600">{timeInRange}%</span>
                <span className="text-[10px] text-slate-400 mb-1">Target: &gt;70%</span>
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Avg reading</p>
              <div className="flex items-end gap-1">
                <span className="text-xl font-bold text-slate-700">
                  {logs.length > 0 ? Math.round(logs.reduce((a, b) => a + b.value, 0) / logs.length) : '--'}
                </span>
                <span className="text-[10px] text-slate-400 mb-1">mg/dL</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-[2] h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
              <YAxis hide domain={[40, 200]} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ fontWeight: 'bold' }}
              />
              <ReferenceLine y={140} stroke="#cbd5e1" strokeDasharray="3 3" label={{ value: 'Target Max', position: 'right', fontSize: 10, fill: '#94a3b8' }} />
              <ReferenceLine y={70} stroke="#cbd5e1" strokeDasharray="3 3" label={{ value: 'Target Min', position: 'right', fontSize: 10, fill: '#94a3b8' }} />
              <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;
