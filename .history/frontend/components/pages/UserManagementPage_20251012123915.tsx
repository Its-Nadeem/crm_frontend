import React, { useState } from 'react';
import { User, UserRole, Permission, Team } from '../../types';
import { AppIcons } from '../ui/Icons';
import { USER_ROLES, PERMISSIONS } from '../../constants';
import Modal from '../ui/Modal';
import { useToast } from '../../src/components/ui/Toast';

const UserFormModal: React.FC<{
    user: Partial<User> | null;
    teams: Team[];
    onClose: () => void;
    onSave: (user: User) => void;
}> = ({ user, teams, onClose, onSave }) => {
    const [formData, setFormData] = useState<User>(
        (user as User) || {
            id: 0, name: '', email: '', role: UserRole.SALES_REP, permissions: [], avatar: '', teamId: undefined, isTrackingEnabled: false, organizationId: ''
        }
    );
    
    const isEditing = user && user.id;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handlePermissionChange = (permission: Permission, checked: boolean) => {
        const currentPermissions = formData.permissions || [];
        const newPermissions = checked
            ? [...currentPermissions, permission]
            : currentPermissions.filter(p => p !== permission);
        setFormData({ ...formData, permissions: newPermissions });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    const isPermissionsDisabled = formData.role === UserRole.ADMIN;

    return (
        <Modal isOpen={true} onClose={onClose} title={isEditing ? "Edit User & Permissions" : "Add New User"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-subtle">Full Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-subtle">Email Address</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-subtle">Role</label>
                        <select name="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500">
                            {USER_ROLES.filter(r => r !== UserRole.SUPER_ADMIN).map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-subtle">Team</label>
                        <select name="teamId" value={formData.teamId || ''} onChange={handleChange} className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500">
                            <option value="">No Team</option>
                            {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                        </select>
                    </div>
                </div>
                
                <div className="pt-4">
                    <h3 className="text-lg font-semibold text-on-surface">Permissions</h3>
                    <p className="text-sm text-subtle mb-4">Assign granular permissions. Admins have all permissions by default.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {PERMISSIONS.map(p => (
                            <label key={p.id} className={`flex items-start p-3 bg-background rounded-lg transition-colors ${isPermissionsDisabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-muted/50 cursor-pointer'}`}>
                                <input 
                                    type="checkbox" 
                                    checked={isPermissionsDisabled || formData.permissions.includes(p.id)} 
                                    onChange={(e) => handlePermissionChange(p.id, e.target.checked)}
                                    className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500 border-muted bg-surface mt-1"
                                    disabled={isPermissionsDisabled}
                                />
                                <div className="ml-3">
                                    <span className="font-medium text-on-surface">{p.name}</span>
                                    <p className="text-xs text-subtle">{p.description}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg">Cancel</button>
                    <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Save User</button>
                </div>
            </form>
        </Modal>
    );
};


interface UserManagementPageProps {
    users: User[];
    teams: Team[];
    onSaveUser: (user: User) => void;
    onDeleteUser: (userId: number) => void;
}

const UserManagementPage: React.FC<UserManagementPageProps> = ({ users, teams, onSaveUser, onDeleteUser }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const handleOpenModal = (user: User | null = null) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingUser(null);
        setIsModalOpen(false);
    };
    
    return (
        <div className="flex flex-col h-full space-y-6">
            {isModalOpen && <UserFormModal user={editingUser} teams={teams} onClose={handleCloseModal} onSave={onSaveUser} />}
             <div className="flex flex-wrap gap-4 justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-on-surface">Users & Permissions</h2>
                    <p className="text-subtle mt-1">Manage your team members and their access levels.</p>
                </div>
                <button onClick={() => handleOpenModal()} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg flex items-center">
                    <AppIcons.Add className="w-5 h-5 mr-2" /> Add User
                </button>
            </div>
            
            <div className="flex-grow overflow-auto bg-surface rounded-xl shadow-sm border border-muted">
                 <table className="min-w-full divide-y divide-muted">
                    <thead className="bg-muted/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider">User</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider">Role</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider">Team</th>
                             <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                     <tbody className="divide-y divide-muted">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-muted/30">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <img className="h-10 w-10 rounded-full" src={user.avatar} alt={user.name} />
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-on-surface">{user.name}</div>
                                            <div className="text-sm text-subtle">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-subtle">
                                    {teams.find(t => t.id === user.teamId)?.name || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button onClick={() => handleOpenModal(user)} className="text-primary-600 hover:text-primary-900">Edit</button>
                                    <button onClick={() => onDeleteUser(user.id)} className="ml-4 text-red-600 hover:text-red-900">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagementPage;



