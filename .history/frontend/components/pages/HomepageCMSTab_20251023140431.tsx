

import React, { useState, useRef } from 'react';
import { HomepageContent, PlanContent } from '../../types';
import { AppIcons } from '../ui/Icons';
import { faker } from '@faker-js/faker';

interface HomepageCMSTabProps {
    content: HomepageContent;
    onSave: (newContent: HomepageContent) => void;
}

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="bg-surface rounded-lg shadow-lg border border-muted">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-4 text-left font-bold text-lg">
                {title}
                <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {isOpen && <div className="p-4 border-t border-muted">{children}</div>}
        </div>
    );
};

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
                {src && <img src={src} alt="Preview" className="w-24 h-24 object-cover rounded-md bg-muted" />}
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

const HomepageCMSTab: React.FC<HomepageCMSTabProps> = ({ content, onSave }) => {
    const [formData, setFormData] = useState<HomepageContent>(content);

    const handleSimpleChange = (section: keyof HomepageContent | `chatbot` | `contactForm` | `growthChart` | `footer` | `finalCta` | `funnel`, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...(prev[section] as any),
                [field]: value,
            },
        }));
    };
    
    const handleArrayItemChange = (section: 'features' | 'testimonials' | 'faq' | 'contactForm' | 'chatbot' | 'growthChart' | 'howItWorks' | 'integrations' | 'trustedBy' | 'footer' | 'funnel', index: number, field: string, value: any, subArray?: 'fields' | 'questions' | 'chartData' | 'items' | 'steps' | 'logos' | 'columns' | 'socialLinks' | 'stages') => {
        const arrayName = subArray || 'items';
        setFormData(prev => {
            const items = [...(prev[section] as any)[arrayName]];
            items[index] = { ...items[index], [field]: value };
            return { ...prev, [section]: { ...(prev[section] as any), [arrayName]: items } };
        });
    };
    
    const handlePricingPlanChange = (cycle: 'monthlyPlans' | 'yearlyPlans', index: number, field: keyof PlanContent, value: any) => {
         setFormData(prev => {
            const plans = [...prev.pricing[cycle]];
            const updatedPlan = { ...plans[index], [field]: value };
            plans[index] = updatedPlan;
            return { ...prev, pricing: { ...prev.pricing, [cycle]: plans } };
        });
    }

    const handleAddItem = (section: 'features' | 'testimonials' | 'faq' | 'contactForm' | 'chatbot' | 'howItWorks' | 'integrations' | 'trustedBy' | 'footer' | 'funnel') => {
         setFormData(prev => {
            const newId = faker.string.uuid();
            let newItem;
            let arrayName: string = 'items';
            if (section === 'features') newItem = { id: newId, title: 'New Feature', description: '', image: { src: '', alt: ''} };
            if (section === 'testimonials') newItem = { id: newId, quote: '', author: '', company: '', avatar: { src: '', alt: ''} };
            if (section === 'faq') newItem = { id: newId, q: 'New Question?', a: '' };
            if (section === 'contactForm') { arrayName = 'fields'; newItem = { id: newId, label: 'New Field', type: 'text', required: false }; }
            if (section === 'chatbot') { arrayName = 'questions'; newItem = { id: newId, question: 'New Question?', crmField: 'name' }; }
            if (section === 'howItWorks') { arrayName = 'steps'; newItem = { id: newId, icon: 'Connect', title: 'New Step', description: '' }; }
            if (section === 'integrations' || section === 'trustedBy') { arrayName = 'logos'; newItem = { src: '', alt: '', name: 'New Logo' }; }
            if (section === 'footer') { arrayName = 'columns'; newItem = { title: 'New Column', links: [] }; }
            if (section === 'funnel') { arrayName = 'stages'; newItem = { name: 'New Stage', value: 0 }; }
            
            const items = [...(prev[section] as any)[arrayName], newItem];
            return { ...prev, [section]: { ...(prev[section] as any), [arrayName]: items } };
        });
    };
    
    const handleRemoveItem = (section: 'features' | 'testimonials' | 'faq' | 'contactForm' | 'chatbot' | 'howItWorks' | 'integrations' | 'trustedBy' | 'footer' | 'funnel', index: number, subArray?: 'fields' | 'questions' | 'steps' | 'logos' | 'columns' | 'stages') => {
        const arrayName = subArray || 'items';
         setFormData(prev => {
            const items = (prev[section] as any)[arrayName].filter((_: any, i: number) => i !== index);
            return { ...prev, [section]: { ...(prev[section] as any), [arrayName]: items } };
        });
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Homepage Content Management</h2>
                <button onClick={() => onSave(formData)} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">
                    Save All Changes
                </button>
            </div>
            
            <CollapsibleSection title="Login Page">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <FormField label="Title"><input type="text" value={formData.loginPage.title} onChange={e => handleSimpleChange('loginPage', 'title', e.target.value)} className="w-full bg-background border border-muted p-2 rounded" /></FormField>
                        <FormField label="Subtitle"><textarea value={formData.loginPage.subtitle} onChange={e => handleSimpleChange('loginPage', 'subtitle', e.target.value)} rows={3} className="w-full bg-background border border-muted p-2 rounded" /></FormField>
                        <FormField label="CTA Text"><input type="text" value={formData.loginPage.cta} onChange={e => handleSimpleChange('loginPage', 'cta', e.target.value)} className="w-full bg-background border border-muted p-2 rounded" /></FormField>
                    </div>
                     <ImageUploader 
                        label="Login Image"
                        src={formData.loginPage.image.src}
                        alt={formData.loginPage.image.alt}
                        onSrcChange={src => setFormData(p => ({...p, loginPage: {...p.loginPage, image: {...p.loginPage.image, src }}}))}
                        onAltChange={alt => setFormData(p => ({...p, loginPage: {...p.loginPage, image: {...p.loginPage.image, alt }}}))}
                        recommendedSize="Recommended: 1024x768px"
                    />
                </div>
            </CollapsibleSection>
            
            <CollapsibleSection title="Hero Section">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Main Title"><input type="text" value={formData.hero.title} onChange={e => handleSimpleChange('hero', 'title', e.target.value)} className="w-full bg-background border border-muted p-2 rounded" /></FormField>
                    <FormField label="Gradient Title"><input type="text" value={formData.hero.gradientTitle} onChange={e => handleSimpleChange('hero', 'gradientTitle', e.target.value)} className="w-full bg-background border border-muted p-2 rounded" /></FormField>
                    <FormField label="CTA Button 1 Text"><input type="text" value={formData.hero.cta1} onChange={e => handleSimpleChange('hero', 'cta1', e.target.value)} className="w-full bg-background border border-muted p-2 rounded" /></FormField>
                    <FormField label="CTA Button 2 Text"><input type="text" value={formData.hero.cta2} onChange={e => handleSimpleChange('hero', 'cta2', e.target.value)} className="w-full bg-background border border-muted p-2 rounded" /></FormField>
                    <div className="md:col-span-2">
                         <FormField label="Subtitle"><textarea value={formData.hero.subtitle} onChange={e => handleSimpleChange('hero', 'subtitle', e.target.value)} rows={3} className="w-full bg-background border border-muted p-2 rounded" /></FormField>
                    </div>
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="Trusted By Logos">
                <div className="space-y-4">
                    <FormField label="Section Title"><input type="text" value={formData.trustedBy.title} onChange={e => handleSimpleChange('trustedBy', 'title', e.target.value)} className="w-full bg-background border border-muted p-2 rounded" /></FormField>
                    {formData.trustedBy.logos.map((logo, index) => (
                        <div key={index} className="p-2 border border-muted rounded-md space-y-2">
                            <div className="flex justify-between items-center"><h4 className="font-semibold">Logo {index + 1}</h4><button type="button" onClick={() => handleRemoveItem('trustedBy', index, 'logos')} className="text-red-500"><AppIcons.Delete className="h-4 w-4"/></button></div>
                            <FormField label="Logo Name"><input type="text" value={logo.name} onChange={e => handleArrayItemChange('trustedBy', index, 'name', e.target.value, 'logos')} className="w-full bg-background border border-muted p-1 rounded" /></FormField>
                            <ImageUploader label="Logo Image" src={logo.src} alt={logo.alt} onSrcChange={src => handleArrayItemChange('trustedBy', index, 'src', src, 'logos')} onAltChange={alt => handleArrayItemChange('trustedBy', index, 'alt', alt, 'logos')} recommendedSize="Recommended: 200x48px"/>
                        </div>
                    ))}
                     <button type="button" onClick={() => handleAddItem('trustedBy')} className="text-sm text-primary-500 font-semibold">+ Add Logo</button>
                </div>
            </CollapsibleSection>
            
            <CollapsibleSection title="How It Works Section">
                 <div className="space-y-4">
                    <FormField label="Section Title"><input type="text" value={formData.howItWorks.title} onChange={e => handleSimpleChange('howItWorks', 'title', e.target.value)} className="w-full bg-background border border-muted p-2 rounded" /></FormField>
                    <FormField label="Section Subtitle"><textarea value={formData.howItWorks.subtitle} onChange={e => handleSimpleChange('howItWorks', 'subtitle', e.target.value)} rows={2} className="w-full bg-background border border-muted p-2 rounded" /></FormField>
                    {formData.howItWorks.steps.map((step, index) => (
                        <div key={step.id} className="p-3 border border-muted rounded-md space-y-2">
                            <div className="flex justify-between items-center"><h4 className="font-semibold">Step {index + 1}</h4><button type="button" onClick={() => handleRemoveItem('howItWorks', index, 'steps')} className="text-red-500"><AppIcons.Delete className="h-4 w-4"/></button></div>
                            <FormField label="Title"><input type="text" value={step.title} onChange={e => handleArrayItemChange('howItWorks', index, 'title', e.target.value, 'steps')} className="w-full bg-background border border-muted p-1 rounded" /></FormField>
                            <FormField label="Description"><textarea value={step.description} onChange={e => handleArrayItemChange('howItWorks', index, 'description', e.target.value, 'steps')} rows={2} className="w-full bg-background border border-muted p-1 rounded" /></FormField>
                            <FormField label="Icon">
                                <select value={step.icon} onChange={e => handleArrayItemChange('howItWorks', index, 'icon', e.target.value, 'steps')} className="w-full bg-background border border-muted p-1 rounded">
                                    <option value="Connect">Connect</option><option value="AutomateSteps">Automate</option><option value="Grow">Grow</option>
                                </select>
                            </FormField>
                        </div>
                    ))}
                    <button type="button" onClick={() => handleAddItem('howItWorks')} className="text-sm text-primary-500 font-semibold">+ Add Step</button>
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="Features Section">
                <div className="space-y-4">
                    <FormField label="Section Title"><input type="text" value={formData.features.title} onChange={e => handleSimpleChange('features', 'title', e.target.value)} className="w-full bg-background border border-muted p-2 rounded" /></FormField>
                    <FormField label="Section Subtitle"><textarea value={formData.features.subtitle} onChange={e => handleSimpleChange('features', 'subtitle', e.target.value)} rows={2} className="w-full bg-background border border-muted p-2 rounded" /></FormField>
                    <h4 className="font-semibold pt-2">Feature Items</h4>
                    {formData.features.items.map((item, index) => (
                        <div key={item.id} className="p-3 border border-muted rounded-md space-y-2">
                            <div className="flex justify-between items-center"><h4 className="font-semibold">Feature {index + 1}</h4><button type="button" onClick={() => handleRemoveItem('features', index)} className="text-red-500"><AppIcons.Delete className="h-4 w-4"/></button></div>
                            <FormField label="Title"><input type="text" value={item.title} onChange={e => handleArrayItemChange('features', index, 'title', e.target.value, 'items')} className="w-full bg-background border border-muted p-2 rounded" /></FormField>
                            <FormField label="Description"><textarea value={item.description} onChange={e => handleArrayItemChange('features', index, 'description', e.target.value, 'items')} rows={2} className="w-full bg-background border border-muted p-2 rounded" /></FormField>
                            <ImageUploader label="Feature Image" src={item.image.src} alt={item.image.alt} onSrcChange={src => handleArrayItemChange('features', index, 'image', { ...item.image, src }, 'items')} onAltChange={alt => handleArrayItemChange('features', index, 'image', { ...item.image, alt }, 'items')} recommendedSize="Recommended: 800x600px" />
                        </div>
                    ))}
                    <button type="button" onClick={() => handleAddItem('features')} className="text-sm text-primary-500 font-semibold">+ Add Feature</button>
                </div>
            </CollapsibleSection>

             <CollapsibleSection title="Integrations Showcase">
                <div className="space-y-4">
                    <FormField label="Section Title"><input type="text" value={formData.integrations.title} onChange={e => handleSimpleChange('integrations', 'title', e.target.value)} className="w-full bg-background border border-muted p-2 rounded" /></FormField>
                    <FormField label="Section Subtitle"><textarea value={formData.integrations.subtitle} onChange={e => handleSimpleChange('integrations', 'subtitle', e.target.value)} rows={2} className="w-full bg-background border border-muted p-2 rounded" /></FormField>
                     {formData.integrations.logos.map((logo, index) => (
                        <div key={index} className="p-2 border border-muted rounded-md space-y-2">
                            <div className="flex justify-between items-center"><h4 className="font-semibold">Logo {index + 1}</h4><button type="button" onClick={() => handleRemoveItem('integrations', index, 'logos')} className="text-red-500"><AppIcons.Delete className="h-4 w-4"/></button></div>
                            <FormField label="Logo Name"><input type="text" value={logo.name} onChange={e => handleArrayItemChange('integrations', index, 'name', e.target.value, 'logos')} className="w-full bg-background border border-muted p-1 rounded" /></FormField>
                            <ImageUploader label="Logo Image" src={logo.src} alt={logo.alt} onSrcChange={src => handleArrayItemChange('integrations', index, 'src', src, 'logos')} onAltChange={alt => handleArrayItemChange('integrations', index, 'alt', alt, 'logos')} recommendedSize="Recommended: 200x48px"/>
                        </div>
                    ))}
                     <button type="button" onClick={() => handleAddItem('integrations')} className="text-sm text-primary-500 font-semibold">+ Add Logo</button>
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="Sales Funnel Section">
                <div className="space-y-4">
                    <FormField label="Section Title">
                        <input 
                            type="text" 
                            value={formData.funnel.title} 
                            onChange={e => handleSimpleChange('funnel', 'title', e.target.value)} 
                            className="w-full bg-background border border-muted p-2 rounded" 
                        />
                    </FormField>
                    <FormField label="Section Subtitle">
                        <textarea 
                            value={formData.funnel.subtitle} 
                            onChange={e => handleSimpleChange('funnel', 'subtitle', e.target.value)} 
                            rows={3} 
                            className="w-full bg-background border border-muted p-2 rounded" 
                        />
                    </FormField>
                    <h4 className="font-semibold pt-2">Funnel Stages</h4>
                    {formData.funnel.stages.map((stage, index) => (
                        <div key={index} className="p-3 border border-muted rounded-md space-y-2">
                            <div className="flex justify-between items-center">
                                <h4 className="font-semibold">Stage {index + 1}</h4>
                                <button 
                                    type="button" 
                                    onClick={() => handleRemoveItem('funnel', index, 'stages')} 
                                    className="text-red-500"
                                >
                                    <AppIcons.Delete className="h-4 w-4"/>
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Stage Name">
                                    <input 
                                        type="text" 
                                        value={stage.name} 
                                        onChange={e => handleArrayItemChange('funnel', index, 'name', e.target.value, 'stages')} 
                                        className="w-full bg-background border border-muted p-1 rounded" 
                                    />
                                </FormField>
                                <FormField label="Value (Number of Leads)">
                                    <input 
                                        type="number" 
                                        value={stage.value} 
                                        onChange={e => handleArrayItemChange('funnel', index, 'value', Number(e.target.value), 'stages')} 
                                        className="w-full bg-background border border-muted p-1 rounded" 
                                    />
                                </FormField>
                            </div>
                        </div>
                    ))}
                    <button 
                        type="button" 
                        onClick={() => handleAddItem('funnel')} 
                        className="text-sm text-primary-500 font-semibold"
                    >
                        + Add Stage
                    </button>
                </div>
            </CollapsibleSection>
            
            <CollapsibleSection title="Testimonials Section">
                <div className="space-y-4">
                    <FormField label="Section Title"><input type="text" value={formData.testimonials.title} onChange={e => handleSimpleChange('testimonials', 'title', e.target.value)} className="w-full bg-background border border-muted p-2 rounded" /></FormField>
                     {formData.testimonials.items.map((item, index) => (
                        <div key={item.id} className="p-3 border border-muted rounded-md space-y-2">
                             <div className="flex justify-between items-center"><h4 className="font-semibold">Testimonial {index + 1}</h4><button type="button" onClick={() => handleRemoveItem('testimonials', index)} className="text-red-500"><AppIcons.Delete className="h-4 w-4"/></button></div>
                            <FormField label="Quote"><textarea value={item.quote} onChange={e => handleArrayItemChange('testimonials', index, 'quote', e.target.value, 'items')} rows={3} className="w-full bg-background border border-muted p-2 rounded" /></FormField>
                            <FormField label="Author"><input type="text" value={item.author} onChange={e => handleArrayItemChange('testimonials', index, 'author', e.target.value, 'items')} className="w-full bg-background border border-muted p-2 rounded" /></FormField>
                            <FormField label="Company"><input type="text" value={item.company} onChange={e => handleArrayItemChange('testimonials', index, 'company', e.target.value, 'items')} className="w-full bg-background border border-muted p-2 rounded" /></FormField>
                            <ImageUploader label="Avatar" src={item.avatar.src} alt={item.avatar.alt} onSrcChange={src => handleArrayItemChange('testimonials', index, 'avatar', {...item.avatar, src}, 'items')} onAltChange={alt => handleArrayItemChange('testimonials', index, 'avatar', {...item.avatar, alt}, 'items')} recommendedSize="Recommended: 128x128px" />
                        </div>
                    ))}
                    <button type="button" onClick={() => handleAddItem('testimonials')} className="text-sm text-primary-500 font-semibold">+ Add Testimonial</button>
                </div>
            </CollapsibleSection>
            <CollapsibleSection title="Contact Form Section">
                <div className="space-y-4">
                    <FormField label="Title"><input type="text" value={formData.contactForm.title} onChange={e => handleSimpleChange('contactForm', 'title', e.target.value)} className="w-full bg-background border border-muted p-2 rounded" /></FormField>
                    <FormField label="Subtitle"><textarea value={formData.contactForm.subtitle} onChange={e => handleSimpleChange('contactForm', 'subtitle', e.target.value)} rows={2} className="w-full bg-background border border-muted p-2 rounded" /></FormField>
                    <FormField label="Webhook URL"><input type="url" value={formData.contactForm.webhookUrl} onChange={e => handleSimpleChange('contactForm', 'webhookUrl', e.target.value)} className="w-full bg-background border border-muted p-2 rounded" /></FormField>
                    <FormField label="Address"><input type="text" value={formData.contactForm.address} onChange={e => handleSimpleChange('contactForm', 'address', e.target.value)} className="w-full bg-background border border-muted p-2 rounded" /></FormField>
                    <FormField label="Email"><input type="email" value={formData.contactForm.email} onChange={e => handleSimpleChange('contactForm', 'email', e.target.value)} className="w-full bg-background border border-muted p-2 rounded" /></FormField>
                    <FormField label="Phone"><input type="tel" value={formData.contactForm.phone} onChange={e => handleSimpleChange('contactForm', 'phone', e.target.value)} className="w-full bg-background border border-muted p-2 rounded" /></FormField>
                    <FormField label="Map Embed URL"><textarea value={formData.contactForm.mapSrc} onChange={e => handleSimpleChange('contactForm', 'mapSrc', e.target.value)} rows={4} className="w-full bg-background border border-muted p-2 rounded font-mono text-xs" /></FormField>
                    <h4 className="font-semibold pt-2">Form Fields</h4>
                    {formData.contactForm.fields.map((field, index) => (
                        <div key={field.id} className="p-2 border border-muted rounded-md space-y-2 bg-background">
                            <div className="flex justify-between items-center"><h5 className="font-semibold text-sm">Field {index + 1}</h5><button type="button" onClick={() => handleRemoveItem('contactForm', index, 'fields')} className="text-red-500"><AppIcons.Delete className="h-4 w-4"/></button></div>
                            <div className="grid grid-cols-2 gap-2">
                                <FormField label="Label"><input type="text" value={field.label} onChange={e => handleArrayItemChange('contactForm', index, 'label', e.target.value, 'fields')} className="w-full bg-surface border-muted p-1 rounded" /></FormField>
                                <FormField label="Type">
                                    <select value={field.type} onChange={e => handleArrayItemChange('contactForm', index, 'type', e.target.value, 'fields')} className="w-full bg-surface border-muted p-1 rounded">
                                        <option value="text">Text</option><option value="email">Email</option><option value="textarea">Textarea</option>
                                    </select>
                                </FormField>
                            </div>
                            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={field.required} onChange={e => handleArrayItemChange('contactForm', index, 'required', e.target.checked, 'fields')} /> Required</label>
                        </div>
                    ))}
                     <button type="button" onClick={() => handleAddItem('contactForm')} className="text-sm text-primary-500 font-semibold">+ Add Field</button>
                </div>
            </CollapsibleSection>
             <CollapsibleSection title="Final CTA Section">
                <div className="space-y-4">
                    <FormField label="Title"><input type="text" value={formData.finalCta.title} onChange={e => handleSimpleChange('finalCta', 'title', e.target.value)} className="w-full bg-background border border-muted p-2 rounded" /></FormField>
                     <FormField label="Subtitle"><input type="text" value={formData.finalCta.subtitle} onChange={e => handleSimpleChange('finalCta', 'subtitle', e.target.value)} className="w-full bg-background border border-muted p-2 rounded" /></FormField>
                    <FormField label="CTA Button Text"><input type="text" value={formData.finalCta.cta} onChange={e => handleSimpleChange('finalCta', 'cta', e.target.value)} className="w-full bg-background border border-muted p-2 rounded" /></FormField>
                </div>
            </CollapsibleSection>
            <CollapsibleSection title="Footer">
                <div className="space-y-4">
                    <FormField label="Company Description"><textarea value={formData.footer.description} onChange={e => handleSimpleChange('footer', 'description', e.target.value)} rows={3} className="w-full bg-background border border-muted p-2 rounded" /></FormField>
                    <FormField label="Company Address"><textarea value={formData.footer.address} onChange={e => handleSimpleChange('footer', 'address', e.target.value)} rows={2} className="w-full bg-background border border-muted p-2 rounded" /></FormField>
                </div>
            </CollapsibleSection>
        </div>
    );
};

export default HomepageCMSTab;


