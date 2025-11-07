

import React, { useMemo, useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { apiService } from '../../src/services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Funnel, FunnelChart, LabelList } from 'recharts';

const Filter: React.FC<{ label: string, value: string, onChange: (value: string) => void, options: {value: string, label: string}[] }> = ({ label, value, onChange, options }) => (
    <div>
        <label className="text-sm font-medium text-subtle">{label}</label>
        <select value={value} onChange={e => onChange(e.target.value)} className="w-full mt-1 bg-surface border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500">
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

// Error Boundary Component
interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="text-red-500 text-lg mb-2">Something went wrong</div>
                        <button
                            onClick={() => this.setState({ hasError: false, error: undefined })}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Custom label component for the funnel chart
const FunnelLabel = (props: any) => {
    const { x, y, width, height, value, name } = props;
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // Calculate font sizes based on available space and funnel width
    const nameFontSize = Math.min(16, Math.max(10, width * 0.12, height * 0.35));
    const valueFontSize = Math.min(14, Math.max(8, width * 0.1, height * 0.25));

    // If not much space, just show the value in center
    if (height < 30 || width < 50) {
        return (
            <text
                x={centerX}
                y={centerY}
                fill="#ffffff"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={valueFontSize}
                fontWeight="bold"
                style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
            >
                {value}
            </text>
        );
    }

    // For larger sections, show both name and value centered
    const lineHeight = nameFontSize + 3;
    const totalTextHeight = lineHeight + valueFontSize + 2;
    const startY = centerY - totalTextHeight / 2;

    return (
        <g>
            <text
                x={centerX}
                y={startY + nameFontSize / 2}
                fill="#ffffff"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={nameFontSize}
                fontWeight="bold"
                style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
            >
                {name}
            </text>
            <text
                x={centerX}
                y={startY + nameFontSize + 2 + valueFontSize / 2}
                fill="#ffffff"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={valueFontSize}
                fontWeight="600"
                style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
            >
                ({value})
            </text>
        </g>
    );
};


interface ReportsData {
    salesFunnelData: Array<{
        name: string;
        value: number;
        fill: string;
        stageId: string;
    }>;
    leadSourceData: Array<{
        name: string;
        value: number;
    }>;
    salesRepData: Array<{
        name: string;
        leads: number;
        won: number;
        value: number;
        conversionRate: number;
    }>;
    teamPerformanceData: Array<{
        name: string;
        leads: number;
        members: number;
        avgLeadsPerMember: number;
    }>;
    conversionData: Array<{
        fromStage: string;
        toStage: string;
        conversionRate: number;
        currentStageLeads: number;
        nextStageLeads: number;
    }>;
    leadTrendData: Array<{
        date: string;
        leads: number;
    }>;
    summary: {
        totalLeads: number;
        totalUsers: number;
        totalStages: number;
        totalTeams: number;
        avgLeadsPerRep: number;
    };
}

const ReportsPage: React.FC = () => {
    const [reportsData, setReportsData] = useState<ReportsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateFilter, setDateFilter] = useState('all');
    const [teamFilter, setTeamFilter] = useState('all');
    const [userFilter, setUserFilter] = useState('all');

    useEffect(() => {
        const fetchReportsData = async () => {
            try {
                setLoading(true);
                console.log('Fetching reports data...');
                const data = await apiService.getReportsData();
                console.log('Reports data received:', data);
                setReportsData(data);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch reports data:', err);
                setError(`Failed to load reports data: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchReportsData();
    }, []);

    // Apply filters to the data
    const filteredData = useMemo(() => {
        if (!reportsData) {
            console.log('No reports data available');
            return {
                salesFunnelData: [],
                leadSourceData: [],
                salesRepData: [],
                teamPerformanceData: [],
                conversionData: [],
                leadTrendData: [],
                summary: {
                    totalLeads: 0,
                    totalUsers: 0,
                    totalStages: 0,
                    totalTeams: 0,
                    avgLeadsPerRep: 0,
                }
            };
        }

        console.log('Processing reports data:', reportsData);

        // For now, we'll use the unfiltered data since the backend provides comprehensive data
        // In a more advanced implementation, we could add filter parameters to the API call
        return reportsData;
    }, [reportsData]);

    if (loading) {
        return (
            <div className="space-y-8">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                    <span className="ml-3 text-lg">Loading reports data...</span>
                </div>
            </div>
        );
    }

    if (error || !filteredData) {
        return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-on-surface">Reports & Analytics</h1>
                    <p className="text-subtle mt-1">Analyze performance and gain insights into your sales pipeline.</p>
                </div>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="text-red-500 text-lg mb-2">{error || 'No data available'}</div>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Extract data with fallbacks - ensure consistent structure
    const {
        salesFunnelData = [],
        leadSourceData = [],
        salesRepData = [],
        teamPerformanceData = []
    } = filteredData || {};

    // Show sample data if no real data is available (for demonstration)
    const hasNoData = !salesFunnelData || salesFunnelData.length === 0;

    // Sort funnel data by value (highest to lowest) for proper funnel shape
    const sortedFunnelData = useMemo(() => {
        if (!salesFunnelData || !Array.isArray(salesFunnelData)) {
            console.log('No salesFunnelData available:', salesFunnelData);
            return [];
        }
        const sorted = [...salesFunnelData].sort((a, b) => (b.value || 0) - (a.value || 0));
        console.log('Sorted funnel data:', sorted);
        return sorted;
    }, [salesFunnelData]);

    // Generate colors dynamically for pie chart based on data
    const COLORS = [
        '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF',
        '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'
    ];
    
    // Custom label for Pie chart to show percentage inside slices
    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central">
            {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };


    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-on-surface">Reports & Analytics</h1>
                <p className="text-subtle mt-1">Analyze performance and gain insights into your sales pipeline.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-surface rounded-lg">
                <Filter label="Date Range" value={dateFilter} onChange={setDateFilter} options={[
                    { value: 'all', label: 'All Time' }, { value: '7d', label: 'Last 7 Days' }, { value: '30d', label: 'Last 30 Days' }
                ]} />
                <Filter label="Team" value={teamFilter} onChange={setTeamFilter} options={[
                    { value: 'all', label: 'All Teams' }, ...(teamPerformanceData?.map(t => ({ value: t.name, label: t.name })) || [])
                ]} />
                  <Filter label="Sales Rep" value={userFilter} onChange={setUserFilter} options={[
                    { value: 'all', label: 'All Reps' }, ...(salesRepData?.map(u => ({ value: u.name, label: u.name })) || [])
                ]} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-surface p-6 rounded-lg shadow-lg">
                    <h2 className="text-lg font-semibold mb-4 text-on-surface">Sales Funnel</h2>
                    <div className="flex justify-center">
                        {sortedFunnelData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={400} className="max-w-lg">
                                <FunnelChart>
                                    <Tooltip
                                        formatter={(value, name) => [value, name]}
                                        labelFormatter={(label) => `Stage: ${label}`}
                                        contentStyle={{
                                            backgroundColor: '#1f2937',
                                            border: '1px solid #374151',
                                            borderRadius: '8px',
                                            color: '#fff'
                                        }}
                                    />
                                    <Funnel
                                        dataKey="value"
                                        data={sortedFunnelData}
                                        isAnimationActive
                                        animationBegin={200}
                                        animationDuration={1200}
                                        cx="50%"
                                        cy="50%"
                                    >
                                        <LabelList
                                            position="center"
                                            fill="#fff"
                                            stroke="none"
                                            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                                            content={<FunnelLabel />}
                                        />
                                    </Funnel>
                                </FunnelChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-64 text-subtle">
                                No funnel data available
                            </div>
                        )}
                    </div>
                </div>
                <div className="bg-surface p-6 rounded-lg shadow-lg">
                    <h2 className="text-lg font-semibold mb-4 text-on-surface">Lead Source Performance</h2>
                    {leadSourceData && leadSourceData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={leadSourceData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                >
                                    {leadSourceData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-48 text-subtle">
                            No lead source data available
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-surface p-6 rounded-lg shadow-lg">
                <h2 className="text-lg font-semibold mb-4 text-on-surface">Sales Rep Leaderboard</h2>
                <div className="overflow-x-auto">
                    {salesRepData && salesRepData.length > 0 ? (
                        <table className="min-w-full divide-y divide-muted">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Rep</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Leads Assigned</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Deals Won</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase">Total Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-muted">
                                {salesRepData.map(rep => (
                                    <tr key={rep.name}>
                                        <td className="px-6 py-4 font-medium text-on-surface">{rep.name}</td>
                                        <td className="px-6 py-4 text-subtle">{rep.leads}</td>
                                        <td className="px-6 py-4 text-subtle">{rep.won}</td>
                                        <td className="px-6 py-4 text-subtle">${rep.value.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="flex items-center justify-center h-32 text-subtle">
                            No sales rep data available
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;


