import React, { useState } from 'react';
import { User } from '../../types';
import { AppIcons } from '../ui/Icons';

interface ProfilePageProps {
    currentUser: User;
    onUpdateProfile: (data: Pick<User, 'name' | 'avatar'>) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ currentUser, onUpdateProfile }) => {
    const [name, setName] = useState(currentUser.name);
    const [avatar, setAvatar] = useState(currentUser.avatar);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateProfile({ name, avatar });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatar(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-on-surface">My Profile</h1>
                <p className="text-subtle mt-1">Manage your personal information.</p>
            </div>
            
            <div className="bg-surface p-8 rounded-lg shadow-lg">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8">
                        <div className="flex-shrink-0">
                            <img src={avatar} alt="Current avatar" className="h-24 w-24 rounded-full object-cover ring-4 ring-muted" />
                        </div>
                        <div className="flex-grow w-full space-y-4">
                             <div>
                                <label htmlFor="avatarUrl" className="block text-sm font-medium text-subtle">Avatar URL</label>
                                <input
                                    id="avatarUrl"
                                    type="url"
                                    value={avatar.startsWith('data:') ? '' : avatar}
                                    onChange={e => setAvatar(e.target.value)}
                                    className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500"
                                    placeholder="https://example.com/image.png"
                                />
                             </div>
                             <div className="relative">
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="w-full border-t border-muted"></div>
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="bg-surface px-2 text-sm text-subtle">OR</span>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="avatarFile" className="block text-sm font-medium text-subtle">Upload from device</label>
                                <input
                                    id="avatarFile"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="mt-1 block w-full text-sm text-subtle file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-muted">
                         <div>
                            <label htmlFor="name" className="block text-sm font-medium text-subtle">Full Name</label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                                className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-subtle">Email Address</label>
                             <input
                                id="email"
                                type="email"
                                value={currentUser.email}
                                readOnly
                                disabled
                                className="mt-1 block w-full bg-muted/50 border border-muted rounded-md shadow-sm py-2 px-3 text-subtle cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="pt-5">
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg flex items-center"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfilePage;



