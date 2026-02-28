import React, { useEffect, useState } from 'react';
import {
    AlertTriangle,
    TrendingUp,
    Users,
    RefreshCcw,
    CheckCircle,
    Info,
    ArrowUpRight,
    ArrowDownRight,
    ShieldCheck,
    Zap
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Cell,
    PieChart,
    Pie
} from 'recharts';
import { getMetrics, getAlerts, DashboardMetrics, UserRisk, generateDemoData } from '../api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const Dashboard: React.FC = () => {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [alerts, setAlerts] = useState<UserRisk[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [mRes, aRes] = await Promise.all([getMetrics(), getAlerts()]);
            setMetrics(mRes.data);
            setAlerts(aRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleGenerateData = async () => {
        setLoading(true);
        await generateDemoData(10);
        await fetchData();
    };

    if (loading && !metrics) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    const chartData = [
        { name: 'Mon', returns: 12 },
        { name: 'Tue', returns: 19 },
        { name: 'Wed', returns: 15 },
        { name: 'Thu', returns: metrics?.high_risk_count || 8 },
        { name: 'Fri', returns: 22 },
        { name: 'Sat', returns: 30 },
        { name: 'Sun', returns: 25 },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                        FraudGuard AI
                    </h1>
                    <p className="text-slate-400 text-sm">Explainable Returns Intelligence Console</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchData}
                        className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
                    >
                        <RefreshCcw size={16} />
                        Refresh
                    </button>
                    <button
                        onClick={handleGenerateData}
                        className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                    >
                        <Zap size={16} />
                        Generate Demo Data
                    </button>
                </div>
            </div>

            {/* Real-time Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Total Transactions"
                    value={metrics?.total_transactions.toLocaleString() || '0'}
                    icon={<ArrowUpRight className="text-emerald-400" />}
                    subValue="+12% from last week"
                    trend="up"
                />
                <MetricCard
                    title="Return Rate"
                    value={`${((metrics?.return_rate || 0) * 100).toFixed(1)}%`}
                    icon={<RefreshCcw className="text-indigo-400" />}
                    subValue="Industry average: 21%"
                    trend="neutral"
                />
                <MetricCard
                    title="High Risk Alerts"
                    value={metrics?.high_risk_count.toString() || '0'}
                    icon={<AlertTriangle className="text-rose-400" />}
                    subValue="Action required"
                    trend="down"
                    isUrgent={metrics?.high_risk_count! > 5}
                />
                <MetricCard
                    title="Avg Risk Score"
                    value={(metrics?.average_risk_score || 0).toFixed(1)}
                    icon={<ShieldCheck className="text-cyan-400" />}
                    subValue="Platform reliability index"
                    trend="up"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Alerts Panel */}
                <div className="lg:col-span-1 bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl">
                    <div className="p-5 border-b border-slate-800 flex justify-between items-center">
                        <h2 className="font-semibold flex items-center gap-2">
                            <AlertTriangle className="text-rose-400" size={18} />
                            Recent High Risk Alerts
                        </h2>
                    </div>
                    <div className="divide-y divide-slate-800/50 max-h-[500px] overflow-y-auto custom-scrollbar">
                        {alerts.length > 0 ? alerts.map((alert) => (
                            <AlertItem key={alert.user_id} alert={alert} />
                        )) : (
                            <div className="p-8 text-center text-slate-500">
                                <CheckCircle className="mx-auto mb-2 opacity-20" size={32} />
                                No high risk users detected
                            </div>
                        )}
                    </div>
                </div>

                {/* Analytics Visuals */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl">
                        <h2 className="font-semibold mb-6 flex items-center gap-2">
                            <TrendingUp className="text-indigo-400" size={18} />
                            Fraud Rate Trends
                        </h2>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} />
                                    <YAxis stroke="#64748b" axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                        itemStyle={{ color: '#818cf8' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="returns"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl">
                            <h2 className="font-semibold mb-4 text-sm uppercase tracking-wider text-slate-500">Risk Distribution</h2>
                            <div className="h-[200px] flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Low', value: 70, color: '#10b981' },
                                                { name: 'Med', value: 20, color: '#f59e0b' },
                                                { name: 'High', value: 10, color: '#f43f5e' },
                                            ]}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {[0, 1, 2].map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={['#10b981', '#f59e0b', '#f43f5e'][index]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl">
                            <h2 className="font-semibold mb-4 text-sm uppercase tracking-wider text-slate-500">System Efficiency</h2>
                            <div className="space-y-4">
                                <EfficiencyBar label="Auto-Blocked" progress={85} color="emerald" />
                                <EfficiencyBar label="Manual Review" progress={42} color="indigo" />
                                <EfficiencyBar label="Fraud Averted" progress={68} color="cyan" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricCard: React.FC<{
    title: string;
    value: string;
    icon: React.ReactNode;
    subValue: string;
    trend: 'up' | 'down' | 'neutral';
    isUrgent?: boolean;
}> = ({ title, value, icon, subValue, trend, isUrgent }) => (
    <div className={cn(
        "p-6 rounded-2xl border transition-all duration-300",
        isUrgent ? "bg-rose-950/20 border-rose-500/50" : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
    )}>
        <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-slate-800/50 rounded-lg">{icon}</div>
            <div className={cn(
                "text-xs font-medium px-2 py-1 rounded-full",
                trend === 'up' ? "text-emerald-400 bg-emerald-400/10" :
                    trend === 'down' ? "text-rose-400 bg-rose-400/10" : "text-slate-400 bg-slate-400/10"
            )}>
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
            </div>
        </div>
        <div className="space-y-1">
            <p className="text-slate-500 text-sm font-medium">{title}</p>
            <h3 className="text-2xl font-bold">{value}</h3>
            <p className="text-slate-400 text-xs mt-2">{subValue}</p>
        </div>
    </div>
);

const AlertItem: React.FC<{ alert: UserRisk }> = ({ alert }) => (
    <div className="p-4 hover:bg-slate-800/30 transition-colors group">
        <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs">
                    {alert.user_id.slice(-2)}
                </div>
                <div>
                    <p className="font-medium text-sm">{alert.user_id}</p>
                    <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-rose-400 tracking-wider">
                        <ShieldCheck size={10} />
                        Score: {alert.score.toFixed(0)}
                    </div>
                </div>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
                JUST NOW
            </div>
        </div>
        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed whitespace-pre-line bg-slate-950/50 p-3 rounded-lg border border-slate-800/50 group-hover:border-slate-700 transition-colors">
            {alert.explanation}
        </p>
    </div>
);

const EfficiencyBar: React.FC<{ label: string; progress: number; color: string }> = ({ label, progress, color }) => {
    const colorMap: any = {
        emerald: 'bg-emerald-500 shadow-emerald-500/20',
        indigo: 'bg-indigo-500 shadow-indigo-500/20',
        cyan: 'bg-cyan-500 shadow-cyan-500/20',
    };
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-xs">
                <span className="text-slate-400">{label}</span>
                <span className="font-mono">{progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                    className={cn("h-full rounded-full transition-all duration-1000 shadow-lg", colorMap[color])}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};

export default Dashboard;
