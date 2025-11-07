import React, { useState } from 'react';
import { Team, User, UserRole } from '../../types';
import { AppIcons } from '../ui/Icons';
import Modal from '../ui/Modal';
import DeleteTeamModal from '../../src/components/ui/DeleteTeamModal';
import { faker } from '@faker-js/faker';

const TeamFormModal: React.FC<{
    team: Partial<Team> | null;
    users: User[];
    onClose: () => void;
    onSave: (team: Team) => void;
}> = ({ team, users, onClose, onSave }) => {
    const [formData, setFormData] = useState<Team>(
        (team as Team) || { id: faker.string.uuid(), name: '', leadId: 0, memberIds: [], organizationId: '' }
    );
    
    const isEditing = !!team?.id;
    const managers = users.filter(u => u.role === UserRole.MANAGER || u.role === UserRole.ADMIN);
    const availableReps = users.filter(u => u.role === UserRole.SALES_REP && (!u.teamId || u.teamId === formData.id));
    
    const handleMemberToggle = (repId: number) => {
        setFormData(prev => {
            const newMemberIds = prev.memberIds.includes(repId)
                ? prev.memberIds.filter(id => id !== repId)
                : [...prev.memberIds, repId];
            return { ...prev, memberIds: newMemberIds };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.leadId) {
            alert('Team Name and Team Lead are required.');
            return;
        }
        onSave(formData);
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={isEditing ? "Edit Team" : "Create New Team"}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-subtle">Team Name</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-subtle">Team Lead (Manager)</label>
                    <select value={formData.leadId} onChange={e => setFormData({...formData, leadId: Number(e.target.value)})} required className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500">
                        <option value={0} disabled>Select a manager</option>
                        {managers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </div>
                <div>
                    <h4 className="text-sm font-medium text-subtle">Team Members (Sales Reps)</h4>
                    <div className="mt-2 grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-background rounded-md">
                        {availableReps.map(rep => (
                            <label key={rep.id} className="flex items-center p-2 hover:bg-muted/50 rounded-md cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={formData.memberIds.includes(rep.id)} 
                                    onChange={() => handleMemberToggle(rep.id)}
                                    className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500"
                                />
                                <span className="ml-2 text-sm text-on-surface">{rep.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
                 <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg">Cancel</button>
                    <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Save Team</button>
                </div>
            </form>
        </Modal>
    );
};

interface TeamsPageProps {
    teams: Team[];
    users: User[];
    onSaveTeam: (team: Team) => void;
    onDeleteTeam: (teamId: string) => void;
}

const TeamsPage: React.FC<TeamsPageProps> = ({ teams, users, onSaveTeam, onDeleteTeam }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);

    const handleOpenModal = (team: Team | null = null) => {
        setEditingTeam(team);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-8">
            {isModalOpen && <TeamFormModal team={editingTeam} users={users} onClose={() => setIsModalOpen(false)} onSave={onSaveTeam} />}
            <div className="flex flex-wrap gap-4 justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-on-surface">Teams</h2>
                    <p className="text-subtle mt-1">Organize your sales reps and managers into teams.</p>
                </div>
                <button onClick={() => handleOpenModal()} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg flex items-center">
                    <AppIcons.Add className="w-5 h-5 mr-2" /> New Team
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {teams.map(team => {
                    const lead = users.find(u => u.id === team.leadId);
                    const members = users.filter(u => team.memberIds.includes(u.id));
                    return (
                        <div key={team.id} className="bg-surface rounded-lg shadow-lg p-6">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-xl text-on-surface">{team.name}</h3>
                                <div className="flex items-center gap-2">
                                     <button onClick={() => handleOpenModal(team)} className="text-primary-400 hover:text-primary-300"><AppIcons.Edit className="h-4 w-4"/></button>
                                     <button onClick={() => window.confirm(`Delete team "${team.name}"?`) && onDeleteTeam(team.id)} className="text-red-400 hover:text-red-300"><AppIcons.Delete className="h-4 w-4"/></button>
                                </div>
                            </div>
                            <div className="mt-4">
                                <p className="text-sm font-semibold text-subtle">Team Lead</p>
                                {lead && <div className="flex items-center mt-2"><img src={lead.avatar} className="h-8 w-8 rounded-full" /> <span className="ml-2 text-on-surface">{lead.name}</span></div>}
                            </div>
                            <div className="mt-4">
                                <p className="text-sm font-semibold text-subtle">Members ({members.length})</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {members.map(member => (
                                        <div key={member.id} className="flex items-center bg-background px-2 py-1 rounded-full">
                                             <img src={member.avatar} className="h-5 w-5 rounded-full" /> <span className="ml-2 text-xs text-on-surface">{member.name}</span>
                                        </div>
                                    ))}
                                    {members.length === 0 && <p className="text-xs text-subtle">No members in this team.</p>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TeamsPage;


