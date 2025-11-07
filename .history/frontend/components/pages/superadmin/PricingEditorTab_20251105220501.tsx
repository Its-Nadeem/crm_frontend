import React, { useState } from 'react';
import { PricingCategory, PricingFeature } from '../../../types';
import { AppIcons } from '../../ui/Icons';

interface PricingEditorTabProps {
    data: PricingCategory[];
    onSave: (data: PricingCategory[]) => void;
}

const PricingEditorTab: React.FC<PricingEditorTabProps> = ({ data, onSave }) => {
    const [localData, setLocalData] = useState(data);

    const handleSave = () => {
        onSave(localData);
        alert('Pricing page data saved!');
    };

    const handleCategoryChange = (catId: string, value: string) => {
        setLocalData(prev => prev.map(cat => cat.id === catId ? { ...cat, category: value } : cat));
    };

    const addCategory = () => {
        const newCategory: PricingCategory = { id: faker.string.uuid(), category: 'New Category', features: [] };
        setLocalData(prev => [...prev, newCategory]);
    };

    const deleteCategory = (catId: string) => {
        if (window.confirm('Are you sure you want to delete this entire category and all its features?')) {
            setLocalData(prev => prev.filter(cat => cat.id !== catId));
        }
    };

    const handleFeatureChange = (catId: string, featId: string, field: 'name' | 'description', value: string) => {
        setLocalData(prev => prev.map(cat => {
            if (cat.id === catId) {
                return { ...cat, features: cat.features.map(feat => feat.id === featId ? { ...feat, [field]: value } : feat) };
            }
            return cat;
        }));
    };
    
    const handleFeatureValueChange = (catId: string, featId: string, plan: keyof PricingFeature['values'], value: string) => {
         setLocalData(prev => prev.map(cat => {
            if (cat.id === catId) {
                return { ...cat, features: cat.features.map(feat => {
                    if (feat.id === featId) {
                        return { ...feat, values: { ...feat.values, [plan]: value } };
                    }
                    return feat;
                })};
            }
            return cat;
        }));
    }

    const addFeature = (catId: string) => {
        const newFeature: PricingFeature = {
            id: faker.string.uuid(),
            name: 'New Feature',
            description: '',
            values: { free: 'false', basic: 'false', pro: 'false', enterprise: 'false' }
        };
        setLocalData(prev => prev.map(cat => cat.id === catId ? { ...cat, features: [...cat.features, newFeature] } : cat));
    };
    
    const deleteFeature = (catId: string, featId: string) => {
        setLocalData(prev => prev.map(cat => {
            if (cat.id === catId) {
                return { ...cat, features: cat.features.filter(feat => feat.id !== featId) };
            }
            return cat;
        }));
    };

    return (
        <div className="space-y-6 bg-surface p-6 rounded-xl shadow-lg border border-muted/50">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Pricing Page Feature Comparison</h2>
                <button onClick={handleSave} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">
                    Save Changes
                </button>
            </div>
            <p className="text-sm text-subtle">Manage the detailed feature comparison table shown on the public pricing page. For values, you can enter a string like "5 Users" or "Unlimited", or you can type "true" or "false" to show a checkmark or a cross.</p>

            <div className="space-y-8">
                {localData.map((cat) => (
                    <div key={cat.id} className="p-4 border border-muted rounded-lg bg-background">
                        <div className="flex justify-between items-center mb-4">
                            <input
                                type="text"
                                value={cat.category}
                                onChange={e => handleCategoryChange(cat.id, e.target.value)}
                                className="font-bold text-xl bg-transparent border-b-2 border-muted focus:border-primary-500 focus:outline-none w-full"
                            />
                            <button onClick={() => deleteCategory(cat.id)} className="text-red-500 hover:text-red-400 ml-4"><AppIcons.Delete className="h-5 w-5"/></button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-muted text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-semibold text-subtle w-1/4">Feature</th>
                                        <th className="px-3 py-2 text-left font-semibold text-subtle w-1/4">Description (Tooltip)</th>
                                        <th className="px-3 py-2 text-left font-semibold text-subtle w-1/6">Free</th>
                                        <th className="px-3 py-2 text-left font-semibold text-subtle w-1/6">Basic</th>
                                        <th className="px-3 py-2 text-left font-semibold text-subtle w-1/6">Pro</th>
                                        <th className="px-3 py-2 text-left font-semibold text-subtle w-1/6">Enterprise</th>
                                        <th className="px-3 py-2 text-right font-semibold text-subtle"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-muted">
                                    {cat.features.map(feat => (
                                        <tr key={feat.id}>
                                            <td className="px-3 py-2"><input type="text" value={feat.name} onChange={e => handleFeatureChange(cat.id, feat.id, 'name', e.target.value)} className="w-full bg-surface p-1 rounded border border-transparent focus:border-muted"/></td>
                                            <td className="px-3 py-2"><input type="text" value={feat.description} onChange={e => handleFeatureChange(cat.id, feat.id, 'description', e.target.value)} className="w-full bg-surface p-1 rounded border border-transparent focus:border-muted"/></td>
                                            {(['free', 'basic', 'pro', 'enterprise'] as const).map(plan => (
                                                <td key={plan} className="px-3 py-2">
                                                    <input type="text" value={String(feat.values[plan])} onChange={e => handleFeatureValueChange(cat.id, feat.id, plan, e.target.value)} className="w-full bg-surface p-1 rounded border border-transparent focus:border-muted"/>
                                                </td>
                                            ))}
                                            <td className="px-3 py-2 text-right"><button onClick={() => deleteFeature(cat.id, feat.id)} className="text-red-500 hover:text-red-400 p-1"><AppIcons.Delete className="h-4 w-4"/></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                         <button onClick={() => addFeature(cat.id)} className="text-sm font-semibold text-primary-500 mt-3">+ Add Feature</button>
                    </div>
                ))}
            </div>
             <button onClick={addCategory} className="font-semibold text-primary-500 flex items-center gap-2 mt-4"><AppIcons.Add className="w-5 h-5"/> Add Category</button>
        </div>
    );
};
export default PricingEditorTab;


