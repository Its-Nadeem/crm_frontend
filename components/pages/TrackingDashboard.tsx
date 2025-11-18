

import React, { useMemo, useState } from 'react';
import { User, UserSessionLog, UserRole, Team } from '../../types';
import { StatCard } from '../ui/StatCard';
import { AppIcons } from '../ui/Icons';

const formatDuration = (ms: number | null): string => {
    if (ms === null || ms < 0) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [
        h > 0 ? `${h}h` : '',
        m > 0 ? `${m}m` : '',
        s > 0 ? `${s}s` : '',
    ].filter(Boolean).join(' ') || '0s';
};

const UserTrackingManager: React.FC<{ users: User[], onToggleTracking: (userId: number) => void }> = ({ users, onToggleTracking }) => (
    <div className="bg-surface rounded-lg shadow-lg">
        <div className="p-4 border-b border-muted">
            <h3 className="font-semibold text-on-surface">Manage User Tracking</h3>
            <p className="text-sm text-subtle">Enable or disable activity tracking for individual users.</p>
        </div>
        <div className="max-h-72 overflow-y-auto">
            {users.filter(u => u.role !== UserRole.ADMIN && u.role !== UserRole.SUPER_ADMIN).map(user => (
                <div key={user.id} className="flex items-center justify-between p-4 border-b border-muted last:border-b-0">
                    <div className="flex items-center">
                        <img src={user.avatar} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
                        <div className="ml-3">
                            <p className="font-medium text-on-surface">{user.name}</p>
                            <p className="text-sm text-subtle">{user.role}</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={user.isTrackingEnabled} onChange={() => onToggleTracking(user.id)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                </div>
            ))}
        </div>
    </div>
);

interface TrackingDashboardProps {
    users: User[];
    sessionLogs: UserSessionLog[];
    teams: Team[];
    onToggleTracking: (userId: number) => void;
    currentUser: User;
}

const TrackingDashboard: React.FC<TrackingDashboardProps> = ({ users, sessionLogs, teams, onToggleTracking, currentUser }) => {
    const [dateFilter, setDateFilter] = useState('all');
    const [teamFilter, setTeamFilter] = useState('all');
    const [employeeFilter, setEmployeeFilter] = useState('all');

    const filteredLogs = useMemo(() => {
        let logs = sessionLogs;

        // Date Filter
        const now = new Date();
        if (dateFilter !== 'all') {
            let startDate = new Date();
            if (dateFilter === 'today') {
                startDate.setHours(0, 0, 0, 0);
            } else if (dateFilter === '7d') {
                startDate.setDate(now.getDate() - 7);
            } else if (dateFilter === 'this_month') {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            } else if (dateFilter === 'last_month') {
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                now.setDate(0); // End of last month
            }
             logs = logs.filter(log => {
                const loginTime = new Date(log.loginTime);
                return loginTime >= startDate && loginTime <= now;
            });
        }
        
        // Team & Employee Filter
        const userIdsToTrack = new Set(users.filter(u => u.isTrackingEnabled).map(u => u.id));
        let userIdsInScope = new Set(userIdsToTrack);

        if (teamFilter !== 'all') {
            const team = teams.find(t => t.id === teamFilter);
            if(team) {
                const teamMemberIds = new Set([...team.memberIds, team.leadId]);
                userIdsInScope = new Set([...userIdsInScope].filter(id => teamMemberIds.has(id)));
            } else {
                 userIdsInScope = new Set();
            }
        }
        
        if (employeeFilter !== 'all') {
            const empId = parseInt(employeeFilter, 10);
            if (userIdsInScope.has(empId)) {
                userIdsInScope = new Set([empId]);
            } else {
                userIdsInScope = new Set();
            }
        }

        return logs.filter(log => userIdsInScope.has(log.userId))
            .sort((a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime());
    }, [sessionLogs, users, teams, dateFilter, teamFilter, employeeFilter]);
    
    const stats = useMemo(() => {
        const totalHours = filteredLogs.reduce((acc, log) => acc + (log.durationMs || 0), 0) / (1000 * 60 * 60);
        const logsWithDuration = filteredLogs.filter(l => l.durationMs);
        const avgSessionDuration = logsWithDuration.length > 0
            ? logsWithDuration.reduce((acc, log) => acc + (log.durationMs || 0), 0) / logsWithDuration.length
            : 0;
        const trackedUsers = new Set(filteredLogs.map(l => l.userId));
        return { totalHours, avgSessionDuration, trackedUsersCount: trackedUsers.size };
    }, [filteredLogs]);


    const availableEmployeesForFilter = useMemo(() => {
        if (teamFilter === 'all') return users.filter(u => u.isTrackingEnabled);
        const team = teams.find(t => t.id === teamFilter);
        if(!team) return [];
        const memberIds = new Set([...team.memberIds, team.leadId]);
        return users.filter(u => memberIds.has(u.id) && u.isTrackingEnabled);
    }, [users, teams, teamFilter]);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-on-surface">Tracking Dashboard</h1>
                <p className="text-subtle mt-1">Monitor employee activity and productivity.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 p-4 bg-surface rounded-lg">
                <div>
                    <label className="text-sm font-medium text-subtle">Date Range</label>
                    <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-full mt-1 bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="this_month">This Month</option>
                        <option value="last_month">Last Month</option>
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium text-subtle">Team</label>
                    <select value={teamFilter} onChange={e => {setTeamFilter(e.target.value); setEmployeeFilter('all');}} className="w-full mt-1 bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option value="all">All Teams</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="text-sm font-medium text-subtle">Employee</label>
                    <select value={employeeFilter} onChange={e => setEmployeeFilter(e.target.value)} className="w-full mt-1 bg-background border border-muted rounded-lg py-2 px-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option value="all">All Employees</option>
                         {availableEmployeesForFilter.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Active Employees" value={stats.trackedUsersCount.toString()} subtext="Based on filters" icon={<AppIcons.Team className="h-6 w-6 text-blue-400"/>} />
                <StatCard title="Total Hours Logged" value={`${stats.totalHours.toFixed(2)}h`} subtext="Based on filters" icon={<AppIcons.Activity className="h-6 w-6 text-purple-400"/>} />
                <StatCard title="Avg. Session Duration" value={formatDuration(stats.avgSessionDuration)} subtext="Based on filters" icon={<AppIcons.Tasks className="h-6 w-6 text-green-400"/>} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1">
                    <UserTrackingManager users={users} onToggleTracking={onToggleTracking} />
                </div>
                <div className="lg:col-span-2 bg-surface rounded-lg shadow-lg">
                    <div className="p-4 border-b border-muted">
                        <h3 className="font-semibold text-on-surface">Recent Sessions</h3>
                    </div>
                     <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-muted">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider">Login Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider">Logout Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider">Duration</th>
                                </tr>
                            </thead>
                             <tbody className="divide-y divide-muted">
                                {filteredLogs.map(log => {
                                    const user = users.find(u => u.id === log.userId);
                                    if (!user) return null;
                                    return (
                                        <tr key={log.id} className="hover:bg-muted/30">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full" />
                                                    <span className="ml-3 text-sm font-medium text-on-surface">{user.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-subtle">{new Date(log.loginTime).toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-subtle">{log.logoutTime ? new Date(log.logoutTime).toLocaleString() : <span className="text-green-400 font-semibold">Online</span>}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-on-surface">{formatDuration(log.durationMs)}</td>
                                        </tr>
                                    );
                                })}
                                {filteredLogs.length === 0 && (
                                     <tr><td colSpan={4} className="text-center p-8 text-subtle">No session data matches the current filters.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrackingDashboard;


