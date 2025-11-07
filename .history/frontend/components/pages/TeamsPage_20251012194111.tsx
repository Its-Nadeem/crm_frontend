import React, { useState, useEffect } from 'react';
import { Team, User, UserRole } from '../../types';
import { AppIcons } from '../ui/Icons';
import Modal from '../ui/Modal';
import DeleteTeamModal from '../../src/components/ui/DeleteTeamModal';
import { faker } from '@faker-js/faker';

const TeamFormModal: React.FC<{
    team: Partial<Team> | null;
    users: User[];
    onClose: () => void;
    onSave: (team: Partial<Team>) => void;
    isSubmitting?: boolean;
}> = ({ team, users, onClose, onSave, isSubmitting = false }) => {
    const [formData, setFormData] = useState<Partial<Team>>(() => {
        if (team) {
            return { ...team };
        }
        return { name: '', leadId: 0, memberIds: [] };
    });

    const isEditing = !!team?.id;

    // Reset form data when team prop changes
    useEffect(() => {
        if (team) {
            setFormData({ ...team });
        } else {
            setFormData({ name: '', leadId: 0, memberIds: [] });
            console.log('Reset form data for new team:', { name: '', leadId: 0, memberIds: [] });
        }
    }, [team]);
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

        // For new teams, don't include id field to let backend generate it
        const teamToSave = { ...formData };
        if (!isEditing) {
            // Remove id field for new teams to let backend auto-generate
            delete (teamToSave as any).id;
            console.log('Creating new team, cleaned data:', teamToSave);
        } else {
            console.log('Updating existing team:', teamToSave);
        }

        onSave(teamToSave);
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={isEditing ? "Edit Team" : "Create New Team"}>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Team Name Field */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface">
                        Team Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        required
                        placeholder="Enter team name"
                        className="w-full bg-background border border-muted rounded-lg shadow-sm py-3 px-4 text-on-surface placeholder-subtle focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                        disabled={isSubmitting}
                    />
                </div>

                {/* Team Lead Field */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface">
                        Team Lead (Manager) <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={formData.leadId}
                        onChange={e => setFormData({...formData, leadId: Number(e.target.value)})}
                        required
                        className="w-full bg-background border border-muted rounded-lg shadow-sm py-3 px-4 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 disabled:opacity-50"
                        disabled={isSubmitting}
                    >
                        <option value={0} disabled>Select a manager</option>
                        {managers.map(u => (
                            <option key={u.id} value={u.id}>{u.name} {u.role === UserRole.ADMIN && '(Admin)'}</option>
                        ))}
                    </select>
                </div>

                {/* Team Members Field */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-on-surface">
                            Team Members (Sales Reps)
                        </label>
                        <span className="text-xs text-subtle">
                            {formData.memberIds.length} selected
                        </span>
                    </div>
                    <div className="max-h-48 overflow-y-auto p-3 bg-background rounded-lg border border-muted">
                        {availableReps.length === 0 ? (
                            <div className="text-center py-4">
                                <p className="text-sm text-subtle">No sales representatives available</p>
                                <p className="text-xs text-subtle mt-1">Add sales reps in the Users section first</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {availableReps.map(rep => (
                                    <label
                                        key={rep.id}
                                        className="flex items-center p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors duration-200"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.memberIds.includes(rep.id)}
                                            onChange={() => handleMemberToggle(rep.id)}
                                            className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500 border-muted"
                                            disabled={isSubmitting}
                                        />
                                        <div className="ml-3 flex items-center gap-2 min-w-0">
                                            <img src={rep.avatar} alt={rep.name} className="h-6 w-6 rounded-full flex-shrink-0" />
                                            <span className="text-sm text-on-surface truncate">{rep.name}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-muted">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 text-sm font-medium text-subtle bg-background border border-muted rounded-lg hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 order-2 sm:order-1"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2.5 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 order-1 sm:order-2"
                        disabled={isSubmitting}
                    >
                        {isSubmitting && (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        )}
                        {isSubmitting ? 'Saving...' : (isEditing ? 'Update Team' : 'Create Team')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

interface TeamsPageProps {
    teams: Team[];
    users: User[];
    onSaveTeam: (team: Partial<Team>) => void;
    onDeleteTeam: (teamId: string) => void;
}

const TeamsPage: React.FC<TeamsPageProps> = ({ teams, users, onSaveTeam, onDeleteTeam }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleOpenModal = (team: Team | null = null) => {
        setEditingTeam(team);
        setIsModalOpen(true);
    };

    const handleOpenDeleteModal = (team: Team) => {
        setTeamToDelete(team);
        setDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setDeleteModalOpen(false);
        setTeamToDelete(null);
    };

    const handleSaveTeam = async (team: Partial<Team>) => {
        setIsSubmitting(true);
        try {
            await onSaveTeam(team);
            setIsModalOpen(false);
            setEditingTeam(null);
        } catch (error) {
            console.error('Failed to save team:', error);
            // Error handling is managed by the parent component
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTeam = async () => {
        if (!teamToDelete) return;

        setIsDeleting(true);
        try {
            await onDeleteTeam(teamToDelete.id);
            handleCloseDeleteModal();
        } catch (error) {
            console.error('Failed to delete team:', error);
            // Error handling is managed by the parent component
        } finally {
            setIsDeleting(false);
        }
    };

    const getTeamStats = (team: Team) => {
        const members = users.filter(u => team.memberIds.includes(u.id));
        return {
            memberCount: members.length,
            leadCount: 0 // This would need to be calculated from leads data if available
        };
    };

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="space-y-1">
                    <h2 className="text-2xl sm:text-3xl font-bold text-on-surface">Teams</h2>
                    <p className="text-sm sm:text-base text-subtle">
                        Organize your sales reps and managers into teams for better collaboration.
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center gap-2 transition-colors duration-200 shadow-sm hover:shadow-md w-full sm:w-auto justify-center"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <AppIcons.Add className="w-4 h-4" />
                    )}
                    New Team
                </button>
            </div>

            {/* Teams Grid */}
            {teams.length === 0 ? (
                <div className="text-center py-12 px-4">
                    <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AppIcons.Team className="w-8 h-8 text-subtle" />
                    </div>
                    <h3 className="text-lg font-medium text-on-surface mb-2">No teams yet</h3>
                    <p className="text-subtle mb-6 max-w-sm mx-auto">
                        Get started by creating your first team to organize your sales team members.
                    </p>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 px-4 rounded-lg inline-flex items-center gap-2 transition-colors duration-200"
                        disabled={isSubmitting}
                    >
                        <AppIcons.Add className="w-4 h-4" />
                        Create Your First Team
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    {teams.map(team => {
                        const lead = users.find(u => u.id === team.leadId);
                        const members = users.filter(u => team.memberIds.includes(u.id));
                        const { memberCount, leadCount } = getTeamStats(team);

                        return (
                            <div key={team.id} className="bg-surface rounded-xl shadow-sm hover:shadow-md border border-muted/50 p-6 transition-all duration-200 group">
                                {/* Header with Actions */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="w-3 h-3 rounded-full bg-primary-500 flex-shrink-0"></div>
                                        <h3 className="font-bold text-lg text-on-surface truncate">{team.name}</h3>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <button
                                            onClick={() => handleOpenModal(team)}
                                            className="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                                            title="Edit team"
                                            disabled={isSubmitting}
                                        >
                                            <AppIcons.Edit className="h-4 w-4"/>
                                        </button>
                                        <button
                                            onClick={() => handleOpenDeleteModal(team)}
                                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                            title="Delete team"
                                            disabled={isSubmitting}
                                        >
                                            <AppIcons.Delete className="h-4 w-4"/>
                                        </button>
                                    </div>
                                </div>

                                {/* Team Lead Section */}
                                <div className="mb-4">
                                    <p className="text-xs font-semibold text-subtle uppercase tracking-wide mb-2">Team Lead</p>
                                    {lead ? (
                                        <div className="flex items-center gap-3 p-2 bg-background rounded-lg">
                                            <img src={lead.avatar} alt={lead.name} className="h-8 w-8 rounded-full" />
                                            <span className="text-sm font-medium text-on-surface">{lead.name}</span>
                                        </div>
                                    ) : (
                                        <div className="p-2 bg-muted/50 rounded-lg">
                                            <span className="text-sm text-subtle">No team lead assigned</span>
                                        </div>
                                    )}
                                </div>

                                {/* Members Section */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-semibold text-subtle uppercase tracking-wide">
                                            Members ({memberCount})
                                        </p>
                                    </div>
                                    {members.length > 0 ? (
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap gap-2">
                                                {members.slice(0, 3).map(member => (
                                                    <div key={member.id} className="flex items-center gap-2 bg-background px-2 py-1 rounded-full">
                                                        <img src={member.avatar} alt={member.name} className="h-5 w-5 rounded-full" />
                                                        <span className="text-xs text-on-surface font-medium">{member.name}</span>
                                                    </div>
                                                ))}
                                                {members.length > 3 && (
                                                    <div className="flex items-center gap-2 bg-muted px-2 py-1 rounded-full">
                                                        <span className="text-xs text-subtle font-medium">+{members.length - 3} more</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-muted/30 rounded-lg text-center">
                                            <span className="text-sm text-subtle">No members in this team</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modals */}
            {isModalOpen && (
                <TeamFormModal
                    team={editingTeam}
                    users={users}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingTeam(null);
                    }}
                    onSave={handleSaveTeam}
                    isSubmitting={isSubmitting}
                />
            )}

            {deleteModalOpen && teamToDelete && (
                <DeleteTeamModal
                    isOpen={deleteModalOpen}
                    onClose={handleCloseDeleteModal}
                    onConfirm={handleDeleteTeam}
                    teamName={teamToDelete.name}
                    isLoading={isDeleting}
                    memberCount={getTeamStats(teamToDelete).memberCount}
                    leadCount={getTeamStats(teamToDelete).leadCount}
                />
            )}
        </div>
    );
};

export default TeamsPage;


