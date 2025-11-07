import React, { useState } from 'react';
import { User, UserRole, Permission, Team } from '../../types';
import { AppIcons } from '../ui/Icons';
import { USER_ROLES, PERMISSIONS } from '../../constants';
import Modal from '../ui/Modal';
import { useToast } from '../../src/components/ui/Toast';

interface DeleteConfirmationModalProps {
    user: User | null;
    onClose: () => void;
    onConfirm: (userId: number) => void;
    isLoading?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    user,
    onClose,
    onConfirm,
    isLoading = false
}) => {
    if (!user) return null;

    return (
        <Modal isOpen={true} onClose={onClose} title="Delete User">
            <div className="p-6">
                <div className="flex items-center mb-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <AppIcons.Trash className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="ml-4">
                        <h3 className="text-lg font-medium text-on-surface">Delete User</h3>
                        <p className="text-sm text-subtle">This action cannot be undone.</p>
                    </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-red-800">
                        Are you sure you want to delete <strong>{user.name}</strong> ({user.email})?
                        This will permanently remove the user and all associated data.
                    </p>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-subtle bg-muted hover:bg-subtle/80 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => onConfirm(user.id)}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center"
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Deleting...
                            </>
                        ) : (
                            <>
                                <AppIcons.Trash className="w-4 h-4 mr-2" />
                                Delete User
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

const UserFormModal: React.FC<{
    user: Partial<User> | null;
    teams: Team[];
    onClose: () => void;
    onSave: (user: User) => void;
    isLoading?: boolean;
}> = ({ user, teams, onClose, onSave, isLoading = false }) => {
    const [formData, setFormData] = useState<User>(
        (user as User) || {
            id: Date.now(), // Generate temporary ID for new users
            name: '',
            email: '',
            password: '',
            role: UserRole.SALES_REP,
            permissions: [],
            avatar: '',
            phone: '',
            teamId: undefined,
            isTrackingEnabled: false,
            organizationId: ''
        }
    );

    const [errors, setErrors] = useState<Record<string, string>>({});
    const isEditing = user && user.id && user.id > 0;

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Full name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email address is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!isEditing && !formData.password) {
            newErrors.password = 'Password is required for new users';
        } else if (formData.password && formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
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
        if (!validateForm()) return;

        // Remove password from form data if editing (don't update password unless explicitly changed)
        const submitData = { ...formData };
        if (isEditing && !submitData.password) {
            delete submitData.password;
        }

        onSave(submitData);
    };

    const isPermissionsDisabled = formData.role === UserRole.ADMIN;

    return (
        <Modal isOpen={true} onClose={onClose} title={isEditing ? "Edit User & Permissions" : "Add New User"}>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-on-surface border-b border-muted pb-2">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-subtle mb-2">Full Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 bg-background border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.name ? 'border-red-500' : 'border-muted'}`}
                                placeholder="Enter full name"
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-subtle mb-2">Email Address *</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 bg-background border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.email ? 'border-red-500' : 'border-muted'}`}
                                placeholder="Enter email address"
                            />
                            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-subtle mb-2">Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-background border border-muted rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="Enter phone number"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-subtle mb-2">Avatar URL</label>
                            <input
                                type="url"
                                name="avatar"
                                value={formData.avatar || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-background border border-muted rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="https://example.com/avatar.jpg"
                            />
                        </div>
                    </div>
                </div>

                {/* Role and Team */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-on-surface border-b border-muted pb-2">Role & Team Assignment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-subtle mb-2">Role *</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-background border border-muted rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                {USER_ROLES.filter(r => r !== UserRole.SUPER_ADMIN).map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-subtle mb-2">Team</label>
                            <select
                                name="teamId"
                                value={formData.teamId || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-background border border-muted rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="">No Team</option>
                                {teams.map(team => (
                                    <option key={team.id} value={team.id}>{team.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="isTrackingEnabled"
                            name="isTrackingEnabled"
                            checked={formData.isTrackingEnabled || false}
                            onChange={(e) => setFormData({ ...formData, isTrackingEnabled: e.target.checked })}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-muted rounded"
                        />
                        <label htmlFor="isTrackingEnabled" className="ml-2 block text-sm text-subtle">
                            Enable activity tracking for this user
                        </label>
                    </div>
                </div>

                {/* Password Field for New Users */}
                {!isEditing && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-on-surface border-b border-muted pb-2">Account Setup</h3>
                        <div>
                            <label className="block text-sm font-medium text-subtle mb-2">Temporary Password *</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password || ''}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 bg-background border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.password ? 'border-red-500' : 'border-muted'}`}
                                placeholder="Enter temporary password"
                            />
                            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                            <p className="mt-1 text-xs text-subtle">User will be required to change this password on first login</p>
                        </div>
                    </div>
                )}

                {/* Permissions */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-on-surface border-b border-muted pb-2">Permissions</h3>
                    <p className="text-sm text-subtle">Assign granular permissions. Admins have all permissions by default.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                        {PERMISSIONS.map(p => (
                            <label
                                key={p.id}
                                className={`flex items-start p-3 bg-background border rounded-lg transition-all ${isPermissionsDisabled ? 'cursor-not-allowed opacity-60 border-muted' : 'hover:bg-muted/50 cursor-pointer border-muted hover:border-primary-300'}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={isPermissionsDisabled || formData.permissions.includes(p.id)}
                                    onChange={(e) => handlePermissionChange(p.id, e.target.checked)}
                                    className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500 border-muted bg-surface mt-0.5"
                                    disabled={isPermissionsDisabled}
                                />
                                <div className="ml-3 flex-1">
                                    <span className="font-medium text-on-surface text-sm">{p.name}</span>
                                    <p className="text-xs text-subtle mt-1">{p.description}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-muted">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-subtle bg-muted hover:bg-subtle/80 rounded-lg transition-colors disabled:opacity-50 order-2 sm:order-1"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center order-1 sm:order-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                {isEditing ? 'Updating...' : 'Creating...'}
                            </>
                        ) : (
                            <>
                                <AppIcons.Save className="w-4 h-4 mr-2" />
                                {isEditing ? 'Update User' : 'Create User'}
                            </>
                        )}
                    </button>
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



