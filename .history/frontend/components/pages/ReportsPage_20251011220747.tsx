

import React, { useMemo, useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Funnel, FunnelChart, LabelList } from 'recharts';

const Filter: React.FC<{ label: string, value: string, onChange: (value: string) => void, options: {value: string, label: string}[] }> = ({ label, value, onChange, options }) => (
    <div>
        <label className="text-sm font-medium text-subtle">{label}</label>
        <select value={value} onChange={e => onChange(e.target.value)} className="w-full mt-1 bg-surface border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500">
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

// Custom label component for the funnel chart
const FunnelLabel = (props: any) => {
    const { x, y, width, height, value, name } = props;
    const textY = y + height / 2;

    // A simple check to see if there's enough space for two lines
    if (height < 30) {
        // If not much space, just show the value
        return (
            <text x={x + width / 2} y={textY} fill="#fff" textAnchor="middle" dominantBaseline="middle" fontSize="12">
                {value}
            </text>
        );
    }
    
    // Otherwise, show name and value on two lines
    return (
        <g>
            <text x={x + width / 2} y={textY - 8} fill="#fff" textAnchor="middle" dominantBaseline="middle" fontWeight="bold">
                {name}
            </text>
            <text x={x + width / 2} y={textY + 10} fill="#fff" textAnchor="middle" dominantBaseline="middle" fontSize="12">
                ({value})
            </text>
        </g>
    );
};


const ReportsPage: React.FC<{ leads: Lead[], users: User[], pipelineStages: Stage[], teams: Team[] }> = ({ leads, users, pipelineStages, teams }) => {
    const [dateFilter, setDateFilter] = useState('all');
    const [teamFilter, setTeamFilter] = useState('all');
    const [userFilter, setUserFilter] = useState('all');

    const filteredLeads = useMemo(() => {
        let tempLeads = leads;
        // Date filter
        if (dateFilter !== 'all') {
            const now = new Date();
            const daysToSubtract = dateFilter === '7d' ? 7 : 30;
            const cutoff = new Date(new Date().setDate(now.getDate() - daysToSubtract));
            tempLeads = tempLeads.filter(l => new Date(l.createdAt) >= cutoff);
        }
        
        // Team filter
        if (teamFilter !== 'all') {
            const team = teams.find(t => t.id === teamFilter);
            if (team) {
                const memberIds = [...team.memberIds, team.leadId];
                tempLeads = tempLeads.filter(l => memberIds.includes(l.assignedToId));
            }
        }

        // User filter
        if (userFilter !== 'all') {
            tempLeads = tempLeads.filter(l => l.assignedToId === parseInt(userFilter));
        }

        return tempLeads;
    }, [leads, dateFilter, teamFilter, userFilter, teams]);

    const salesFunnelData = useMemo(() => {
        const stageCounts = pipelineStages.map(stage => ({
            name: stage.name,
            value: filteredLeads.filter(l => l.stage === stage.id).length,
            fill: stage.color,
        })).filter(s => s.value > 0);
        // A funnel should ideally be sorted by some logical flow, but for now, we'll just use the stage order.
        // A better implementation would have an order property on stages.
        return stageCounts;
    }, [filteredLeads, pipelineStages]);

    const leadSourceData = useMemo(() => {
        const counts = filteredLeads.reduce((acc, lead) => {
            acc[lead.source] = (acc[lead.source] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [filteredLeads]);

    const salesRepData = useMemo(() => {
        const repStats = users
            .filter(u => u.role === 'Sales Rep')
            .map(user => {
                const userLeads = filteredLeads.filter(l => l.assignedToId === user.id);
                const wonLeads = userLeads.filter(l => pipelineStages.find(s => s.id === l.stage)?.name === 'Closed-Won').length;
                const totalValue = userLeads.reduce((sum, l) => sum + l.dealValue, 0);
                return {
                    name: user.name,
                    leads: userLeads.length,
                    won: wonLeads,
                    value: totalValue,
                };
            })
            .sort((a, b) => b.won - a.won);
        return repStats;
    }, [filteredLeads, users, pipelineStages]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];
    
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
                    { value: 'all', label: 'All Teams' }, ...teams.map(t => ({ value: t.id, label: t.name }))
                ]} />
                 <Filter label="Sales Rep" value={userFilter} onChange={setUserFilter} options={[
                    { value: 'all', label: 'All Reps' }, ...users.filter(u => u.role === 'Sales Rep').map(u => ({ value: u.id.toString(), label: u.name }))
                ]} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-surface p-6 rounded-lg shadow-lg">
                    <h2 className="text-lg font-semibold mb-4 text-on-surface">Sales Funnel</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <FunnelChart>
                            <Tooltip />
                            <Funnel dataKey="value" data={salesFunnelData} isAnimationActive>
                                <LabelList 
                                    content={<FunnelLabel />}
                                />
                            </Funnel>
                        </FunnelChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-surface p-6 rounded-lg shadow-lg">
                    <h2 className="text-lg font-semibold mb-4 text-on-surface">Lead Source Performance</h2>
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
                </div>
            </div>

            <div className="bg-surface p-6 rounded-lg shadow-lg">
                <h2 className="text-lg font-semibold mb-4 text-on-surface">Sales Rep Leaderboard</h2>
                <div className="overflow-x-auto">
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
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;


