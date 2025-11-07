
import React, { useState, useMemo } from 'react';
import { Task, User, Lead, Team, UserRole } from '../../types';
import { Link } from 'react-router-dom';
import { AppIcons } from '../ui/Icons';
import Modal from '../ui/Modal';
import LeadDetailModal from '../leads/LeadDetailModal';

interface TasksPageProps {
    tasks: Task[];
    users: User[];
    leads: Lead[];
    teams: Team[];
    currentUser: User;
    updateTask: (task: Task) => void;
    onAddTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'organizationId' | 'isCompleted' | 'assignedToId' | 'createdById'>, assignment: { type: 'user' | 'team' | 'all'; id?: string | number }) => void;
    onDeleteTask: (taskId: string) => void;
    isLoading?: boolean;
}

const AddTaskModal: React.FC<{
    onClose: () => void;
    onAddTask: TasksPageProps['onAddTask'];
    leads: Lead[];
    users: User[];
    teams: Team[];
    isSubmitting?: boolean;
}> = ({ onClose, onAddTask, leads, users, teams, isSubmitting = false }) => {
    const [title, setTitle] = useState('');
    const [leadId, setLeadId] = useState<string>('none');
    const [assignment, setAssignment] = useState<{ type: 'user' | 'team' | 'all'; id?: string | number }>({ type: 'user', id: users[0]?.id });
    const [dueDate, setDueDate] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    });
    const [error, setError] = useState<string | null>(null);

    const assignmentOptions = useMemo(() => {
        const userOptions = users.map(u => ({ value: `user-${u.id}`, label: u.name }));
        const teamOptions = teams.map(t => ({ value: `team-${t.id}`, label: `Team: ${t.name}` }));
        return [{ value: 'all-all', label: 'All Users' }, ...teamOptions, ...userOptions];
    }, [users, teams]);
    
    const handleAssignmentChange = (value: string) => {
        const [type, id] = value.split('-');
        if (type === 'all') {
            setAssignment({ type: 'all' });
        } else if (type === 'team') {
            setAssignment({ type: 'team', id });
        } else {
            setAssignment({ type: 'user', id: Number(id) });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!title || !assignment || !dueDate) {
            setError("Please fill all required fields.");
            return;
        }

        const taskData = {
            title,
            dueDate: new Date(dueDate).toISOString(),
            leadId: leadId === 'none' ? undefined : leadId,
        };

        try {
            await onAddTask(taskData, assignment);
            onClose();
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to create task');
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Add New Task">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-subtle">Task Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500"
                        placeholder="Enter task title..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-subtle">Assign To</label>
                    <select
                        value={`${assignment.type}-${assignment.id || 'all'}`}
                        onChange={(e) => handleAssignmentChange(e.target.value)}
                        required
                        className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500"
                    >
                        <option value="" disabled>Select an option</option>
                        {assignmentOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-subtle">Related Lead (Optional)</label>
                    <select value={leadId} onChange={(e) => setLeadId(e.target.value)} className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500">
                        <option value="none">None (General Task)</option>
                        {leads.map(lead => <option key={lead.id} value={lead.id}>{lead.name}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-subtle">Due Date</label>
                    <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        required
                        className="mt-1 block w-full bg-background border border-muted rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500"
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-muted">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                Creating...
                            </>
                        ) : (
                            'Add Task'
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

const getDueDateInfo = (dueDate: string, isCompleted: boolean): { text: string; className: string } => {
    if (isCompleted) return { text: new Date(dueDate).toLocaleDateString(), className: 'text-green-500' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    // If due date is invalid
    if (isNaN(due.getTime())) {
        return { text: 'Invalid Date', className: 'text-subtle' };
    }
    
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Overdue', className: 'text-red-500 font-semibold' };
    if (diffDays === 0) return { text: 'Due Today', className: 'text-orange-500 font-semibold' };
    if (diffDays === 1) return { text: 'Due Tomorrow', className: 'text-yellow-600' };
    return { text: new Date(dueDate).toLocaleDateString(), className: 'text-subtle' };
};


const TasksPage: React.FC<TasksPageProps> = ({ tasks, users, leads, teams, currentUser, updateTask, onAddTask, onDeleteTask, isLoading = false }) => {
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('pending');
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [view, setView] = useState<'my_tasks' | 'assigned_by_me'>('my_tasks');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [operationError, setOperationError] = useState<string | null>(null);
    
    const canManageTasks = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER;

    const filteredTasks = useMemo(() => {
        console.log('Filtering tasks for user:', currentUser.id, 'Total tasks:', tasks.length);
        const userTasks = tasks.filter(task => {
            const isAssignedToUser = task.assignedToId === currentUser.id;
            console.log('Task:', task.id, 'assignedToId:', task.assignedToId, 'currentUser.id:', currentUser.id, 'matches:', isAssignedToUser);
            return isAssignedToUser;
        });
        console.log('User tasks after filtering:', userTasks.length);

        const filtered = userTasks.filter(task => {
            const statusMatch = statusFilter === 'all' || (statusFilter === 'pending' && !task.isCompleted) || (statusFilter === 'completed' && task.isCompleted);
            return statusMatch;
        }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

        console.log('Final filtered tasks:', filtered.length, 'for status:', statusFilter);
        return filtered;
    }, [tasks, statusFilter, currentUser.id]);

    const assignedByMeTasks = useMemo(() => {
        if (!canManageTasks) return { single: [], batches: [] };

        const myCreatedTasks = tasks.filter(t => t.createdById === currentUser.id);
        const single = myCreatedTasks.filter(t => !t.batchId);
        const batched = myCreatedTasks.filter(t => t.batchId);

        const batches = batched.reduce((acc, task) => {
            if (!task.batchId) return acc;
            if (!acc[task.batchId]) acc[task.batchId] = [];
            acc[task.batchId].push(task);
            return acc;
        }, {} as Record<string, Task[]>);

        return { single, batches: Object.values(batches).sort((a, b) => new Date(a[0].createdAt) > new Date(b[0].createdAt) ? -1 : 1) };
    }, [tasks, currentUser.id, canManageTasks]);


    const getUser = (id: number) => users.find(u => u.id === id);
    const getLead = (id?: string) => id ? leads.find(l => l.id === id) : undefined;

    const handleUpdateTask = async (task: Task) => {
        try {
            setOperationError(null);
            await updateTask(task);
        } catch (error) {
            setOperationError(error instanceof Error ? error.message : 'Failed to update task');
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                setOperationError(null);
                await onDeleteTask(taskId);
            } catch (error) {
                setOperationError(error instanceof Error ? error.message : 'Failed to delete task');
            }
        }
    };

    const handleAddTaskWithLoading = async (taskData: any, assignment: any) => {
        setIsSubmitting(true);
        setOperationError(null);
        try {
            await onAddTask(taskData, assignment);
            setAddModalOpen(false);
        } catch (error) {
            setOperationError(error instanceof Error ? error.message : 'Failed to create task');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full space-y-6">
            {isAddModalOpen && (
                <AddTaskModal
                    onClose={() => setAddModalOpen(false)}
                    onAddTask={onAddTask}
                    leads={leads}
                    users={users}
                    teams={teams}
                    isSubmitting={isSubmitting}
                />
            )}

            {operationError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-800">{operationError}</p>
                        </div>
                        <div className="ml-auto pl-3">
                            <button
                                onClick={() => setOperationError(null)}
                                className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                            >
                                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-on-surface">Tasks</h1>
                    <p className="text-subtle mt-1">Manage your daily workload and assigned tasks.</p>
                </div>
                {canManageTasks && <button onClick={() => setAddModalOpen(true)} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg flex items-center">
                    <AppIcons.Add className="w-5 h-5 mr-2" /> Add Task
                </button>}
            </div>
            
            <div className="flex border-b border-muted">
                <button onClick={() => setView('my_tasks')} className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold -mb-px ${view === 'my_tasks' ? 'border-b-2 border-primary-500 text-on-surface' : 'text-subtle border-b-2 border-transparent hover:border-muted'}`}>
                    My Tasks
                </button>
                {canManageTasks && (
                    <button onClick={() => setView('assigned_by_me')} className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold -mb-px ${view === 'assigned_by_me' ? 'border-b-2 border-primary-500 text-on-surface' : 'text-subtle border-b-2 border-transparent hover:border-muted'}`}>
                        Tasks I've Assigned
                    </button>
                )}
            </div>

            {view === 'my_tasks' && (
                <>
                    <div className="flex p-1 bg-muted rounded-lg w-min">
                        {(['pending', 'completed', 'all'] as const).map(filter => (
                            <button key={filter} onClick={() => setStatusFilter(filter)} className={`capitalize px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${statusFilter === filter ? 'bg-surface shadow text-on-surface' : 'text-subtle hover:bg-surface/50'}`}>
                                {filter}
                            </button>
                        ))}
                    </div>

                    <div className="flex-grow overflow-auto bg-surface rounded-xl shadow-sm border border-muted">
                        {isLoading ? (
                            <div className="flex items-center justify-center p-16">
                                <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                                <span className="ml-3 text-subtle">Loading tasks...</span>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-muted">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 w-10"></th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider">Title</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider">Related To</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider">Due Date</th>
                                        <th scope="col" className="relative px-6 py-3 w-16"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-muted">
                                    {filteredTasks.map(task => {
                                        const lead = getLead(task.leadId);
                                        const dueDateInfo = getDueDateInfo(task.dueDate, task.isCompleted);
                                        return (
                                            <tr key={task.id} className={`group ${task.isCompleted ? 'bg-surface/50 opacity-70' : 'bg-surface'} hover:bg-muted/30 transition-colors duration-150`}>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={task.isCompleted}
                                                        onChange={() => handleUpdateTask({ ...task, isCompleted: !task.isCompleted })}
                                                        className="h-5 w-5 rounded-md text-primary-600 focus:ring-primary-500 border-muted bg-background"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <span className={task.isCompleted ? 'line-through text-subtle' : 'text-on-surface'}>
                                                        {task.title}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {lead ? (
                                                        <Link to={`/leads/${lead.id}`} className="flex items-center gap-2 text-subtle hover:text-primary-500 hover:underline transition-colors">
                                                            <AppIcons.Link className="h-4 w-4"/>
                                                            {lead.name}
                                                        </Link>
                                                    ) : (
                                                        <span className="text-subtle">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <div className={`flex items-center gap-2 ${dueDateInfo.className}`}>
                                                        <AppIcons.Calendar className="h-4 w-4"/>
                                                        <span>{dueDateInfo.text}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => handleDeleteTask(task.id)}
                                                        className="text-subtle opacity-0 group-hover:opacity-100 hover:text-red-500 p-1 rounded-full hover:bg-muted transition-opacity"
                                                        title="Delete task"
                                                    >
                                                        <AppIcons.Delete className="h-5 w-5"/>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredTasks.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="text-center p-16 text-subtle">
                                                <AppIcons.Tasks className="h-12 w-12 mx-auto text-muted"/>
                                                <p className="mt-2 font-semibold">No {statusFilter} tasks</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}

            {view === 'assigned_by_me' && canManageTasks && (
                <div className="space-y-4">
                    {assignedByMeTasks.batches.map(batch => {
                        const completed = batch.filter(t => t.isCompleted).length;
                        const total = batch.length;
                        const firstTask = batch[0];
                        return (
                            <div key={firstTask.batchId} className="bg-surface p-4 rounded-xl shadow-md border border-muted/50 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-lg text-on-surface">{firstTask.title}</h3>
                                        <div className="flex items-center gap-2 text-sm text-subtle mt-1">
                                            <AppIcons.Calendar className="h-4 w-4"/>
                                            <span>Due: {new Date(firstTask.dueDate).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => window.confirm('Delete this entire batch of tasks?') && batch.forEach(t => onDeleteTask(t.id))} className="text-subtle hover:text-red-500 p-1 rounded-full hover:bg-muted"><AppIcons.Delete className="h-5 w-5"/></button>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm font-medium text-subtle mb-1">
                                        <span>Progress</span>
                                        <span>{completed} / {total} Completed</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2.5"><div className="bg-green-500 h-2.5 rounded-full" style={{width: `${(completed/total)*100}%`}}></div></div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-subtle mb-2">Assignees</p>
                                    <div className="flex -space-x-2">
                                        {batch.slice(0, 7).map(task => {
                                            const user = getUser(task.assignedToId);
                                            return user ? <img key={task.id} src={user.avatar} title={user.name} className="h-8 w-8 rounded-full ring-2 ring-surface"/> : null;
                                        })}
                                        {batch.length > 7 && <div className="h-8 w-8 rounded-full ring-2 ring-surface bg-muted flex items-center justify-center text-xs font-semibold">+{batch.length - 7}</div>}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                     {assignedByMeTasks.single.map(task => {
                         const assignee = getUser(task.assignedToId);
                         return (
                            <div key={task.id} className="bg-surface p-4 rounded-xl shadow-md border border-muted/50 flex flex-wrap justify-between items-center gap-4">
                                <div>
                                    <h3 className={`font-semibold text-on-surface ${task.isCompleted ? 'line-through text-subtle' : ''}`}>{task.title}</h3>
                                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-subtle mt-1">
                                        {assignee && <div className="flex items-center gap-2">
                                            <img src={assignee.avatar} className="h-5 w-5 rounded-full" alt={assignee.name}/>
                                            <span>{assignee.name}</span>
                                        </div>}
                                        <div className="flex items-center gap-2">
                                            <AppIcons.Calendar className="h-4 w-4"/>
                                            <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${task.isCompleted ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'}`}>{task.isCompleted ? 'Completed' : 'Pending'}</span>
                                    <button onClick={() => onDeleteTask(task.id)} className="text-subtle hover:text-red-500 p-1 rounded-full hover:bg-muted"><AppIcons.Delete className="h-5 w-5"/></button>
                                </div>
                            </div>
                         );
                     })}
                     {assignedByMeTasks.batches.length === 0 && assignedByMeTasks.single.length === 0 && (
                        <div className="text-center p-16 text-subtle bg-surface rounded-xl border border-muted">
                            <AppIcons.Tasks className="h-12 w-12 mx-auto text-muted"/>
                            <p className="mt-2 font-semibold">You haven't assigned any tasks yet</p>
                        </div>
                     )}
                </div>
            )}
        </div>
    );
};

export default TasksPage;



