import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CATEGORICAL, OTHER_COLOR } from "../palette";
import { formatHoursMinutes } from "../format";

const MAX_SLICES = 6;

export function CategoryPieChart({ data }: { data: { category: string; seconds: number }[] }) {
  const sorted = [...data].filter((d) => d.seconds > 0).sort((a, b) => b.seconds - a.seconds);

  const top = sorted.slice(0, MAX_SLICES);
  const rest = sorted.slice(MAX_SLICES);
  const restTotal = rest.reduce((sum, d) => sum + d.seconds, 0);

  const slices = restTotal > 0 ? [...top, { category: "other", seconds: restTotal }] : top;
  const total = slices.reduce((sum, d) => sum + d.seconds, 0);

  if (slices.length === 0) {
    return <div className="empty-note">no time logged this week yet.</div>;
  }

  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={slices}
            dataKey="seconds"
            nameKey="category"
            innerRadius={56}
            outerRadius={92}
            paddingAngle={2}
            stroke="var(--bg-panel)"
            strokeWidth={2}
            label={({ category, seconds }) =>
              `${category} ${Math.round((seconds / total) * 100)}%`
            }
            labelLine={false}
          >
            {slices.map((entry, i) => (
              <Cell
                key={entry.category}
                fill={entry.category === "other" ? OTHER_COLOR : CATEGORICAL[i % CATEGORICAL.length]}
              />
            ))}
          </Pie>
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ fontSize: 12, color: "var(--text-dim)" }}
          />
          <Tooltip
            formatter={(value: number, name: string) => [formatHoursMinutes(value), name]}
            contentStyle={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              fontSize: 12,
              color: "var(--text)",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
