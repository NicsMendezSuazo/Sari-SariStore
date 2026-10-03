import { useState } from 'react';
import { useReports, useOutstandingUtang } from '@/hooks/useSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/format';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { cn } from '@/lib/utils';

const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export function Reports() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const { data: sales, isLoading } = useReports(period);
  const { data: utangCustomers } = useOutstandingUtang();

  const validSales = sales || [];

  // Aggregate by date
  const grouped = new Map<string, number>();
  for (const s of validSales as any[]) {
    let key: string;
    const d = new Date(s.created_at);
    if (period === 'daily') key = d.toISOString().slice(0, 10);
    else if (period === 'weekly') {
      const monday = new Date(d);
      monday.setDate(d.getDate() - d.getDay());
      key = monday.toISOString().slice(0, 10);
    } else {
      key = d.toISOString().slice(0, 7);
    }
    grouped.set(key, (grouped.get(key) || 0) + Number(s.total_amount));
  }

  const chartData = Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, total]) => ({
      date: period === 'monthly' ? new Date(date).toLocaleDateString('en-PH', { month: 'short', year: '2-digit' }) : new Date(date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
      total,
    }));

  // Payment method breakdown
  const methodTotals = new Map<string, number>();
  for (const s of validSales as any[]) {
    methodTotals.set(s.payment_method, (methodTotals.get(s.payment_method) || 0) + Number(s.total_amount));
  }
  const pieData = Array.from(methodTotals.entries()).map(([name, value]) => ({ name, value }));

  const totalRevenue = validSales.reduce((s: number, r: any) => s + Number(r.total_amount), 0);
  const totalTransactions = validSales.length;
  const avgSale = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  return (
    <div className="p-6 space-y-4 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">Sales analysis and insights</p>
        </div>
        <div className="flex gap-1 p-1 bg-secondary rounded-lg">
          {[
            { key: 'daily', label: 'Daily' },
            { key: 'weekly', label: 'Weekly' },
            { key: 'monthly', label: 'Monthly' },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key as any)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                period === p.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Total Revenue</div>
            <div className="text-2xl font-bold tabular-nums">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Transactions</div>
            <div className="text-2xl font-bold tabular-nums">{totalTransactions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Avg Sale</div>
            <div className="text-2xl font-bold tabular-nums">{formatCurrency(avgSale)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Sales chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sales Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">Loading...</div>
          ) : chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">No data for this period</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  formatter={(value: any) => formatCurrency(value)}
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Bar dataKey="total" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Payment breakdown */}
      {pieData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e: any) => `${e.name}: ${formatCurrency(e.value)}`}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Outstanding utang */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Outstanding Utang</CardTitle>
        </CardHeader>
        <CardContent>
          {(utangCustomers || []).length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">No outstanding balances.</div>
          ) : (
            <div className="space-y-2">
              {(utangCustomers || []).map((c: any) => (
                <div key={c.id} className="flex justify-between items-center p-2 rounded-lg border border-border">
                  <span className="text-sm font-medium">{c.name}</span>
                  <span className="text-sm font-bold text-warning tabular-nums">{formatCurrency(c.balance)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
