import React, { useState } from 'react';
import { Coupon, OfferStrip } from '../../../types';
import { AppIcons } from '../../ui/Icons';
import Modal from '../../ui/Modal';
import { DEFAULT_OFFER_STRIP } from '../../../homepage-content';

const CouponFormModal: React.FC<{ coupon: Partial<Coupon> | null, onClose: () => void, onSave: (coupon: Coupon) => void }> = ({ coupon, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Coupon>>(coupon || { code: '', type: 'percentage', value: 10, isActive: true });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Coupon);
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={coupon?.id ? 'Edit Coupon' : 'Create Coupon'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-subtle">Coupon Code</label>
                    <input type="text" value={formData.code} onChange={e => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))} className="w-full bg-background border border-muted p-2 rounded" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-subtle">Type</label>
                        <select value={formData.type} onChange={e => setFormData(p => ({ ...p, type: e.target.value as 'percentage' | 'fixed' }))} className="w-full bg-background border border-muted p-2 rounded">
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Amount ($)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-subtle">Value</label>
                        <input type="number" value={formData.value} onChange={e => setFormData(p => ({ ...p, value: Number(e.target.value) }))} className="w-full bg-background border border-muted p-2 rounded" required />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-subtle">Expires At (Optional)</label>
                    <input type="date" value={formData.expiresAt ? new Date(formData.expiresAt).toISOString().split('T')[0] : ''} onChange={e => setFormData(p => ({ ...p, expiresAt: e.target.value ? new Date(e.target.value).toISOString() : undefined }))} className="w-full bg-background border border-muted p-2 rounded" />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-muted">
                    <button type="button" onClick={onClose} className="bg-muted hover:bg-subtle/80 text-on-surface font-bold py-2 px-4 rounded-lg">Cancel</button>
                    <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">Save Coupon</button>
                </div>
            </form>
        </Modal>
    );
};


interface CouponsAndOffersTabProps {
    coupons: Coupon[];
    onSaveCoupon: (coupon: Coupon) => void;
    onDeleteCoupon: (couponId: string) => void;
    offerStrip: OfferStrip;
    onUpdateOfferStrip: (strip: OfferStrip) => void;
}

const CouponsAndOffersTab: React.FC<CouponsAndOffersTabProps> = ({ coupons, onSaveCoupon, onDeleteCoupon, offerStrip, onUpdateOfferStrip }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon> | null>(null);
    const [localOfferStrip, setLocalOfferStrip] = useState(offerStrip || DEFAULT_OFFER_STRIP);

    const handleOpenModal = (coupon: Partial<Coupon> | null = null) => {
        setEditingCoupon(coupon);
        setIsModalOpen(true);
    };

    const handleSaveOfferStrip = () => {
        onUpdateOfferStrip(localOfferStrip);
        alert('Offer strip updated!');
    };

    return (
        <div className="space-y-8">
            {isModalOpen && <CouponFormModal coupon={editingCoupon} onClose={() => setIsModalOpen(false)} onSave={onSaveCoupon} />}

            <div className="bg-surface p-6 rounded-xl shadow-lg border border-muted/50">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Discount Coupons</h3>
                    <button onClick={() => handleOpenModal()} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-3 rounded-lg text-sm flex items-center gap-2"><AppIcons.Add className="w-4 h-4"/> New Coupon</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-muted text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-2 text-left font-semibold text-subtle">Code</th>
                                <th className="px-4 py-2 text-left font-semibold text-subtle">Type</th>
                                <th className="px-4 py-2 text-left font-semibold text-subtle">Value</th>
                                <th className="px-4 py-2 text-left font-semibold text-subtle">Status</th>
                                <th className="px-4 py-2 text-left font-semibold text-subtle">Expires</th>
                                <th className="px-4 py-2 text-right font-semibold text-subtle"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-muted">
                            {coupons.map(coupon => (
                                <tr key={coupon.id}>
                                    <td className="px-4 py-2 font-mono font-bold">{coupon.code}</td>
                                    <td className="px-4 py-2 capitalize">{coupon.type}</td>
                                    <td className="px-4 py-2">{coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`}</td>
                                    <td className="px-4 py-2">
                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{coupon.isActive ? 'Active' : 'Inactive'}</span>
                                    </td>
                                    <td className="px-4 py-2 text-subtle">{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'Never'}</td>
                                    <td className="px-4 py-2 text-right">
                                        <button onClick={() => handleOpenModal(coupon)} className="p-1"><AppIcons.Edit className="h-4 w-4"/></button>
                                        <button onClick={() => onDeleteCoupon(coupon.id)} className="p-1"><AppIcons.Delete className="h-4 w-4"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-surface p-6 rounded-xl shadow-lg border border-muted/50">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Promotional Offer Strip</h3>
                    <button onClick={handleSaveOfferStrip} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-3 rounded-lg text-sm">Save</button>
                </div>
                <div className="space-y-4">
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={localOfferStrip.isEnabled} onChange={e => setLocalOfferStrip(p => ({ ...p, isEnabled: e.target.checked }))} /> Enable offer strip</label>
                    <div>
                        <label className="block text-sm font-medium text-subtle">Display Text</label>
                        <input type="text" value={localOfferStrip.text} onChange={e => setLocalOfferStrip(p => ({ ...p, text: e.target.value }))} className="w-full bg-background border border-muted p-2 rounded" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-subtle">CTA Text (Optional)</label>
                            <input type="text" value={localOfferStrip.ctaText} onChange={e => setLocalOfferStrip(p => ({ ...p, ctaText: e.target.value }))} className="w-full bg-background border border-muted p-2 rounded" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-subtle">CTA Link (Optional)</label>
                            <input type="text" value={localOfferStrip.ctaLink} onChange={e => setLocalOfferStrip(p => ({ ...p, ctaLink: e.target.value }))} className="w-full bg-background border border-muted p-2 rounded" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-subtle">Auto-disable At (Optional)</label>
                        <input type="date" value={localOfferStrip.autoDisableAt ? new Date(localOfferStrip.autoDisableAt).toISOString().split('T')[0] : ''} onChange={e => setLocalOfferStrip(p => ({ ...p, autoDisableAt: e.target.value ? new Date(e.target.value).toISOString() : undefined }))} className="w-full bg-background border border-muted p-2 rounded" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CouponsAndOffersTab;


