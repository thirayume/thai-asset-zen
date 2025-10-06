import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface AssetAllocationProps {
  assetAllocation: Record<string, {
    value: number;
    percentage: number;
    name: string;
    color: string;
  }>;
}

const AssetAllocation = ({ assetAllocation }: AssetAllocationProps) => {
  const data = Object.values(assetAllocation).map(asset => ({
    name: asset.name,
    value: asset.percentage,
    amount: asset.value,
    color: asset.color
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="p-6 card-glow bg-gradient-to-br from-card to-card-glow border-border/50">
      <h2 className="text-xl font-bold mb-6">Asset Allocation</h2>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name} ${value}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-semibold">{payload[0].payload.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ฿{formatCurrency(payload[0].payload.amount)}
                      </p>
                      <p className="text-sm font-mono">{payload[0].value}%</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-4">
        {data.map((asset, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div 
              className="h-3 w-3 rounded-full" 
              style={{ backgroundColor: asset.color }}
            />
            <span className="text-sm text-muted-foreground">{asset.name}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default AssetAllocation;
