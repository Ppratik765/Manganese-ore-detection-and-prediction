'use client';

import React from 'react';
import { OperationsTelemetryResponse, ProductionHistoryRecord } from '@/lib/api';
import { 
  BarChart, 
  Bar, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  ComposedChart 
} from 'recharts';
import { BarChart3, TrendingUp, AlertOctagon, Activity, Calendar } from 'lucide-react';

interface ProductionChartProps {
  operationsData?: OperationsTelemetryResponse | null;
  isLoading?: boolean;
}

export const ProductionChart: React.FC<ProductionChartProps> = ({
  operationsData,
  isLoading = false,
}) => {
  const history = operationsData?.production_history_7days || [];

  // Calculate weekly metrics
  const totalTarget = history.reduce((acc, h) => acc + h.target_tonnage, 0);
  const totalActual = history.reduce((acc, h) => acc + h.actual_tonnage, 0);
  const totalShortfall = history.reduce((acc, h) => acc + h.shortfall_tonnage, 0);
  const overallEfficiency = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 94.2;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: ProductionHistoryRecord = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700 rounded-xl p-3.5 shadow-2xl backdrop-blur-md text-xs font-mono min-w-[210px] space-y-1.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1 font-bold text-slate-200">
            <span>{data.date} ({data.day_name})</span>
            {data.is_current && (
              <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-1.5 py-0.5 rounded">
                LIVE SHIFT
              </span>
            )}
          </div>
          <div className="space-y-1 pt-1">
            <div className="flex justify-between items-center text-emerald-400">
              <span>Actual Mined:</span>
              <span className="font-bold">{data.actual_tonnage.toLocaleString()} T</span>
            </div>
            <div className="flex justify-between items-center text-cyan-400">
              <span>Target Baseline:</span>
              <span>{data.target_tonnage.toLocaleString()} T</span>
            </div>
            <div className="flex justify-between items-center text-amber-400">
              <span>AI Predicted:</span>
              <span>{data.predicted_tonnage.toLocaleString()} T</span>
            </div>
            {data.shortfall_tonnage > 0 && (
              <div className="flex justify-between items-center text-rose-400 border-t border-slate-800 pt-1 font-bold">
                <span>Shortfall Deficit:</span>
                <span>-{data.shortfall_tonnage.toLocaleString()} T</span>
              </div>
            )}
            <div className="flex justify-between items-center text-slate-400 text-[10px] pt-0.5">
              <span>Rain / Friction:</span>
              <span>{data.rainfall_mm}mm / {data.road_friction}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col w-full border border-slate-800 shadow-2xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100 tracking-tight">Production vs Target Analytics</h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-800/50 px-1.5 py-0.5 rounded">
                Rolling 7-Day Trend
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Multi-shift extraction tonnage comparison & XGBoost shortfall variance
            </p>
          </div>
        </div>

        {/* Quick Weekly Stats */}
        <div className="flex items-center gap-3 font-mono text-xs text-slate-300">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800">
            <span className="text-slate-500">Avg Efficiency:</span>
            <span className="text-emerald-400 font-bold">{overallEfficiency.toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800">
            <span className="text-slate-500">Deficit:</span>
            <span className={totalShortfall > 0 ? 'text-rose-400 font-bold' : 'text-slate-400 font-bold'}>
              {totalShortfall > 0 ? `-${totalShortfall.toLocaleString()} T` : '0 T'}
            </span>
          </div>
        </div>
      </div>

      {/* Recharts Chart Container */}
      <div className="w-full h-[280px] lg:h-[310px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={history} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.9} />
                <stop offset="95%" stopColor="#065f46" stopOpacity={0.4} />
              </linearGradient>
              <linearGradient id="shortfallGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="day_name" 
              stroke="#64748b" 
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
            />
            <YAxis 
              stroke="#64748b" 
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              domain={[0, 'dataMax + 400']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono', paddingTop: '10px' }} 
              iconType="circle"
            />
            
            {/* Bars: Actual Mined Tonnage */}
            <Bar 
              dataKey="actual_tonnage" 
              name="Actual Mined (T)" 
              fill="url(#actualGradient)" 
              radius={[4, 4, 0, 0]} 
              barSize={28}
            />

            {/* Line: Target Tonnage Baseline */}
            <Line 
              type="monotone" 
              dataKey="target_tonnage" 
              name="Target Baseline (T)" 
              stroke="#06b6d4" 
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 3, fill: '#06b6d4' }}
            />

            {/* Line: AI Predicted Production */}
            <Line 
              type="monotone" 
              dataKey="predicted_tonnage" 
              name="AI Predicted (T)" 
              stroke="#f59e0b" 
              strokeWidth={2}
              dot={{ r: 3, fill: '#f59e0b' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};
