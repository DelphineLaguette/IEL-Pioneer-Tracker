import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { PRINCIPLES } from '../data/principles';
import type { StartingPoint, PrincipleKey } from '../types';

// IBL Energy brand colors
const IBL_CYAN = '#00D0DA';

interface Props {
  startingPoint: StartingPoint;
}

export default function PrincipleRadar({ startingPoint }: Props) {
  const data = PRINCIPLES.map(p => ({
    label: `P${p.number}`,
    fullTitle: p.shortTitle,
    rating: startingPoint[p.id as PrincipleKey]?.rating ?? 0,
    fullMark: 5,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 600 }}
        />
        <Radar
          name="Self-Rating"
          dataKey="rating"
          stroke={IBL_CYAN}
          fill={IBL_CYAN}
          fillOpacity={0.2}
          strokeWidth={2}
          dot={{ r: 4, fill: IBL_CYAN }}
        />
        <Tooltip
          formatter={(value: number) => [`${value} / 5`, 'Self-Rating']}
          labelFormatter={(label: string) => {
            const item = data.find(d => d.label === label);
            return item ? item.fullTitle : label;
          }}
          contentStyle={{ fontSize: 12 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
