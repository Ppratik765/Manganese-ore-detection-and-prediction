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
        <div className="bg-surface-card/95 border border-border-subtle rounded-xl p-3.5 shadow-2xl backdrop-blur-md text-xs font-mono min-w-[210px] space-y-1.5">
          <div className="flex items-center justify-between border-b border-border-subtle pb-1 font-bold text-text-primary">
            <span>{data.date} ({data.day_name})</span>
            {data.is_current && (
              <span className="text-[10px] bg-canvas-dark text-brand-caramel border border-brand-caramel/50 px-1.5 py-0.5 rounded font-semibold">
                LIVE SHIFT
              </span>
            )}
          </div>
          <div className="space-y-1 pt-1">
            <div className="flex justify-between items-center text-brand-cornsilk font-bold">
              <span>Actual Mined:</span>
              <span>{data.actual_tonnage.toLocaleString()} T</span>
            </div>
            <div className="flex justify-between items-center text-text-secondary">
              <span>Target Baseline:</span>
              <span>{data.target_tonnage.toLocaleString()} T</span>
            </div>
            <div className="flex justify-between items-center text-brand-caramel">
              <span>AI Predicted:</span>
              <span>{data.predicted_tonnage.toLocaleString()} T</span>
            </div>
            {data.shortfall_tonnage > 0 && (
              <div className="flex justify-between items-center text-brand-copper border-t border-border-subtle pt-1 font-bold">
                <span>Shortfall Deficit:</span>
                <span>-{data.shortfall_tonnage.toLocaleString()} T</span>
              </div>
            )}
            <div className="flex justify-between items-center text-text-secondary text-[10px] pt-0.5">
              <span>Precip / Friction:</span>
              <span>{data.rainfall_mm}mm / {data.road_friction}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col w-full border border-border-subtle shadow-2xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-surface-hover/50 border border-border-subtle flex items-center justify-center text-brand-caramel">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-text-primary tracking-tight">Production vs Target Analytics</h3>
              <span className="text-[10px] font-mono text-brand-caramel bg-canvas-dark border border-brand-caramel/40 px-2 py-0.5 rounded font-semibold">
                Rolling 7-Day Trend
              </span>
            </div>
            <p className="text-[11px] text-text-secondary">
              Multi-shift extraction tonnage comparison & XGBoost shortfall variance
            </p>
          </div>
        </div>

        {/* Quick Weekly Stats */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 font-mono text-xs text-text-primary">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-card border border-border-subtle">
            <span className="text-text-secondary">Avg Efficiency:</span>
            <span className="text-brand-caramel font-bold">{overallEfficiency.toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-card border border-border-subtle">
            <span className="text-text-secondary">Deficit:</span>
            <span className={totalShortfall > 0 ? 'text-brand-copper font-bold' : 'text-text-secondary font-bold'}>
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
                <stop offset="5%" stopColor="#bc6c25" stopOpacity={0.9} />
                <stop offset="95%" stopColor="#283618" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#606c38" vertical={false} />
            <XAxis 
              dataKey="day_name" 
              stroke="#dda15e" 
              tick={{ fill: '#dda15e', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
            />
            <YAxis 
              stroke="#dda15e" 
              tick={{ fill: '#dda15e', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              domain={[0, 'dataMax + 400']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono', paddingTop: '10px' }} 
              iconType="circle"
            />
            
            {/* Bars: Actual Mined Tonnage (Gradient #283618 to #bc6c25) */}
            <Bar 
              dataKey="actual_tonnage" 
              name="Actual Mined (T)" 
              fill="url(#actualGradient)" 
              radius={[4, 4, 0, 0]} 
              barSize={28}
            />

            {/* Line: Target Tonnage Baseline (#dda15e dashed) */}
            <Line 
              type="monotone" 
              dataKey="target_tonnage" 
              name="Target Baseline (T)" 
              stroke="#dda15e" 
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 3, fill: '#dda15e' }}
            />

            {/* Line: AI Predicted Production (#dda15e brand-caramel) */}
            <Line 
              type="monotone" 
              dataKey="predicted_tonnage" 
              name="AI Predicted (T)" 
              stroke="#dda15e" 
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: '#dda15e' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};
