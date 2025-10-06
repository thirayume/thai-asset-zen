import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface IncomeStreamsProps {
  assetAllocation: Record<string, {
    name: string;
    monthlyIncome: number;
    color: string;
  }>;
}

const IncomeStreams = ({ assetAllocation }: IncomeStreamsProps) => {
  const data = Object.values(assetAllocation)
    .filter(asset => asset.monthlyIncome > 0)
    .map(asset => ({
      name: asset.name,
      income: asset.monthlyIncome,
      color: asset.color
    }))
    .sort((a, b) => b.income - a.income);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="p-6 card-glow bg-gradient-to-br from-card to-card-glow border-border/50">
      <h2 className="text-xl font-bold mb-6">Monthly Income Streams</h2>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
            <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={80} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-semibold">{payload[0].payload.name}</p>
                      <p className="text-profit font-mono">
                        ฿{formatCurrency(payload[0].value as number)}/month
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="income" radius={[0, 8, 8, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Total Monthly Income</span>
          <span className="text-xl font-bold font-mono text-profit">
            ฿{formatCurrency(data.reduce((sum, item) => sum + item.income, 0))}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default IncomeStreams;
