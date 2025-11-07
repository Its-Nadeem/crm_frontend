import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { BlogPost, User } from '../../types';
import { AppIcons } from '../ui/Icons';
import { faker } from '@faker-js/faker';
import { useToast } from '../../src/components/ui/Toast';

const FormField: React.FC<{ label: string; children: React.ReactNode, description?: string }> = ({ label, children, description }) => (
    <div>
        <label className="block text-sm font-medium text-subtle mb-1">{label}</label>
        {children}
        {description && <p className="text-xs text-subtle mt-1">{description}</p>}
    </div>
);

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const ImageUploader: React.FC<{
    label: string;
    src: string;
    alt: string;
    onSrcChange: (src: string) => void;
    onAltChange: (alt: string) => void;
    recommendedSize: string;
}> = ({ label, src, alt, onSrcChange, onAltChange, recommendedSize }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const base64 = await fileToBase64(e.target.files[0]);
            onSrcChange(base64);
        }
    };
    
    return (
        <div className="space-y-2">
             <label className="block text-sm font-medium text-subtle">{label}</label>
             <div className="flex items-center gap-4">
                {src ? <img src={src} alt="Preview" className="w-24 h-16 object-cover rounded-md bg-muted" /> : <div className="w-24 h-16 bg-muted rounded-md"/>}
                <div className="flex-grow">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-muted hover:bg-subtle/20 text-on-surface font-semibold py-2 px-4 rounded-lg text-sm">
                        Upload Image
                    </button>
                    <p className="text-xs text-subtle mt-1">{recommendedSize}</p>
                </div>
            </div>
            <FormField label="Image Alt Text">
                <input type="text" value={alt} onChange={e => onAltChange(e.target.value)} className="w-full bg-background border border-muted p-1 rounded" />
            </FormField>
        </div>
    );
}

const CollapsiblePanel: React.FC<{ title: string, children: React.ReactNode, initiallyOpen?: boolean }> = ({ title, children, initiallyOpen=false }) => (
    <details className="bg-surface rounded-lg border border-muted" open={initiallyOpen}>
        <summary className="font-semibold text-on-surface p-4 cursor-pointer flex justify-between items-center list-none">
            {title}
            <AppIcons.ChevronRight className="h-5 w-5 transform transition-transform details-open:rotate-90" />
        </summary>
        <div className="p-4 border-t border-muted space-y-4">
            {children}
        </div>
    </details>
)

const RichTextEditor: React.FC<{ value: string; onChange: (value: string) => void }> = ({ value, onChange }) => {
    const editorRef = useRef<HTMLDivElement>(null);

    const handleFormat = (command: string, value: string | null = null) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    };
    
    return (
        <div className="bg-surface rounded-lg border border-muted flex flex-col flex-grow min-h-[600px]">
            <div className="p-2 border-b border-muted flex gap-1 flex-wrap flex-shrink-0">
                <button type="button" onClick={() => handleFormat('bold')} className="p-1 rounded hover:bg-muted text-sm font-bold w-8 h-8">B</button>
                <button type="button" onClick={() => handleFormat('italic')} className="p-1 rounded hover:bg-muted text-sm italic w-8 h-8">I</button>
                <button type="button" onClick={() => handleFormat('underline')} className="p-1 rounded hover:bg-muted text-sm underline w-8 h-8">U</button>
                <button type="button" onClick={() => handleFormat('strikeThrough')} className="p-1 rounded hover:bg-muted text-sm line-through w-8 h-8">S</button>
                <div className="w-px bg-muted mx-1"></div>
                <button type="button" onClick={() => handleFormat('formatBlock', '<h1>')} className="p-1 rounded hover:bg-muted text-sm font-bold w-8 h-8">H1</button>
                <button type="button" onClick={() => handleFormat('formatBlock', '<h2>')} className="p-1 rounded hover:bg-muted text-sm font-bold w-8 h-8">H2</button>
                <button type="button" onClick={() => handleFormat('formatBlock', '<h3>')} className="p-1 rounded hover:bg-muted text-sm font-bold w-8 h-8">H3</button>
                <button type="button" onClick={() => handleFormat('formatBlock', '<h4>')} className="p-1 rounded hover:bg-muted text-sm font-bold w-8 h-8">H4</button>
                 <div className="w-px bg-muted mx-1"></div>
                <button type="button" onClick={() => handleFormat('insertUnorderedList')} className="p-1 rounded hover:bg-muted w-8 h-8 flex items-center justify-center"><AppIcons.ListUl className="h-4 w-4"/></button>
                <button type="button" onClick={() => handleFormat('insertOrderedList')} className="p-1 rounded hover:bg-muted w-8 h-8 flex items-center justify-center"><AppIcons.ListOl className="h-4 w-4"/></button>
                <button type="button" onClick={() => handleFormat('formatBlock', '<blockquote>')} className="p-1 rounded hover:bg-muted w-8 h-8 flex items-center justify-center"><AppIcons.Quote className="h-4 w-4"/></button>
                 <div className="w-px bg-muted mx-1"></div>
                <button type="button" onClick={() => handleFormat('createLink', window.prompt('Enter URL:'))} className="p-1 rounded hover:bg-muted w-8 h-8 flex items-center justify-center"><AppIcons.Link className="h-4 w-4"/></button>
            </div>
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={e => onChange((e.currentTarget as HTMLDivElement).innerHTML)}
                className="w-full h-full p-4 bg-transparent focus:outline-none resize-none prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: value }}
            />
        </div>
    );
};


interface BlogEditorPageProps {
    post: Partial<BlogPost> | null;
    users: User[];
    onSave: (post: BlogPost) => void;
    onClose: () => void;
}

const BlogEditorPage: React.FC<BlogEditorPageProps> = ({ post, users, onSave, onClose }) => {
    const [formData, setFormData] = useState<Partial<BlogPost>>(
        post || { 
            title: '', slug: '', excerpt: '', content: '', tags: [], authorId: users.find(u => u.role !== 'Super Admin')?.id,
            featuredImage: { src: '', alt: '' }, seo: { title: '', description: ''}, focusKeyword: ''
        }
    );
    const [autosaveStatus, setAutosaveStatus] = useState('Saved');

    const handleSimpleChange = (field: keyof Omit<BlogPost, 'featuredImage'|'seo'|'tags'|'authorId'|'content'>, value: string) => {
        let newSlug = formData.slug;
        if (field === 'title' && !post && !formData.slug) {
            newSlug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        }
        setFormData(prev => ({ ...prev, [field]: value, slug: newSlug, seo: { ...prev.seo, title: field === 'title' ? value : prev.seo?.title } }));
    };
    
    const handleContentChange = (value: string) => {
        setFormData(prev => ({...prev, content: value}));
    }

    const handleSeoChange = (field: 'title' | 'description', value: string) => {
        setFormData(prev => ({...prev, seo: {...prev.seo, [field]: value}}))
    }

    const handleSave = () => {
        setAutosaveStatus('Saving...');
        const finalData = {
            ...formData,
            id: formData.id || faker.string.uuid(),
            publishedAt: formData.publishedAt || new Date().toISOString(),
        } as BlogPost;
        onSave(finalData);
        setTimeout(() => setAutosaveStatus('Saved'), 500);
    };

    useEffect(() => {
        setAutosaveStatus('Unsaved changes');
        const handler = setTimeout(() => {
            // handleSave(); // This would be the real autosave logic
        }, 2000);
        return () => clearTimeout(handler);
    }, [formData]);

    return (
        <div className="bg-background text-on-surface h-full flex flex-col">
            <header className="flex-shrink-0 bg-surface border-b border-muted p-4 flex justify-between items-center">
                <button onClick={onClose} className="flex items-center gap-2 text-sm font-semibold text-subtle hover:text-on-surface">
                    <AppIcons.ChevronRight className="h-5 w-5 rotate-180"/> Back to Blog List
                </button>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-subtle italic">{autosaveStatus}</span>
                    <button onClick={handleSave} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg text-sm">Publish</button>
                </div>
            </header>
            <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 p-6 overflow-hidden">
                {/* Left: Main Content Editor */}
                <div className="flex flex-col gap-6 overflow-y-auto pr-2">
                    <FormField label="Post Title">
                        <input type="text" value={formData.title} onChange={e => handleSimpleChange('title', e.target.value)} required className="w-full bg-surface border border-muted p-3 rounded-lg text-lg font-semibold"/>
                    </FormField>
                    <RichTextEditor value={formData.content || ''} onChange={handleContentChange} />
                </div>
                
                {/* Right: Sidebar */}
                <aside className="space-y-4 overflow-y-auto pr-2">
                    <CollapsiblePanel title="Publish" initiallyOpen={true}>
                         <FormField label="Status">
                            <select className="w-full bg-background border border-muted p-2 rounded"><option>Draft</option><option>Published</option></select>
                         </FormField>
                         <FormField label="Publish Date">
                            <input type="datetime-local" className="w-full bg-background border border-muted p-2 rounded"/>
                         </FormField>
                         <p className="text-xs text-subtle hover:underline cursor-pointer">Revisions (3)</p>
                    </CollapsiblePanel>

                    <CollapsiblePanel title="Featured Image">
                        <ImageUploader label="" src={formData.featuredImage?.src || ''} alt={formData.featuredImage?.alt || ''} onSrcChange={src => setFormData(p => ({...p, featuredImage: {...p.featuredImage!, src }}))} onAltChange={alt => setFormData(p => ({...p, featuredImage: {...p.featuredImage!, alt }}))} recommendedSize="1200x630px for social"/>
                    </CollapsiblePanel>
                    
                     <CollapsiblePanel title="Tags & Excerpt">
                        <FormField label="Tags">
                             <input type="text" value={Array.isArray(formData.tags) ? formData.tags.join(', ') : ''} onChange={e => setFormData({...formData, tags: e.target.value.split(',').map(t => t.trim())})} className="w-full bg-background border border-muted p-2 rounded" placeholder="sales, crm, growth"/>
                        </FormField>
                        <FormField label="Excerpt">
                            <textarea value={formData.excerpt} onChange={e => handleSimpleChange('excerpt', e.target.value)} rows={4} className="w-full bg-background border border-muted p-2 rounded"/>
                        </FormField>
                    </CollapsiblePanel>
                </aside>
            </main>
        </div>
    );
};

export default BlogEditorPage;


