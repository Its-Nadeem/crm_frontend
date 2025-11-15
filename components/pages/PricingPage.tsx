

import React, { useState } from 'react';
import { HomepageContent, PlanContent, PricingCategory } from '../../types';
import { AppIcons } from '../ui/Icons';
import PaymentModal from '../ui/PaymentModal';

const PlanHeaderCard: React.FC<{ plan: PlanContent; onCtaClick: () => void; }> = ({ plan, onCtaClick }) => {
    const ctaText = plan.price === '$0' ? 'Get Started' : (plan.name === 'Enterprise' ? 'Contact Us' : 'Start 14-Day Trial');

    return (
        <div className="p-6 h-full flex flex-col items-center text-center">
            {plan.isPopular && <span className="mb-4 px-3 py-1 text-sm font-semibold text-white bg-primary-500 rounded-full">Most Popular</span>}
            <h3 className="text-2xl font-bold">{plan.name}</h3>
            <p className="mt-4 text-5xl font-bold">{plan.price}<span className="text-base font-normal text-subtle">/mo</span></p>
            <p className="mt-2 text-subtle text-center flex-grow h-12">{plan.description}</p>
            <button onClick={onCtaClick} className={`mt-8 w-full px-6 py-3 text-sm font-semibold rounded-lg transition-colors ${plan.isPopular ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-muted text-on-surface hover:bg-primary-500/10'}`}>
                {ctaText}
            </button>
        </div>
    );
}

const renderFeatureValue = (value: string | boolean) => {
    if (typeof value === 'boolean') {
        return value 
            ? <AppIcons.CheckCircle className="h-6 w-6 text-green-500 mx-auto" /> 
            : <AppIcons.XCircle className="h-6 w-6 text-subtle/50 mx-auto" />;
    }
    return <span className="text-sm font-medium">{value}</span>;
}


const PricingPage: React.FC<{ content: HomepageContent['pricing']; comparisonData: PricingCategory[] }> = ({ content, comparisonData }) => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<PlanContent | null>(null);

    const plans = billingCycle === 'monthly' ? content.monthlyPlans : content.yearlyPlans;

    const handleCtaClick = (plan: PlanContent) => {
        if (plan.name === 'Free') {
            window.location.hash = '/login';
        } else if (plan.name === 'Enterprise') {
            // The contact form is on the homepage.
            window.location.hash = '/#contact';
        } else {
            setSelectedPlan(plan);
            setIsPaymentModalOpen(true);
        }
    };
    
    return (
        <>
            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                plan={selectedPlan}
            />
            <div className="py-12 sm:py-16 bg-background">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center max-w-3xl mx-auto">
                        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Flexible pricing for teams of all sizes</h1>
                        <p className="mt-6 text-lg text-subtle">Choose the plan that's right for you. No hidden fees, and you can change your plan at any time.</p>
                    </div>

                    {/* Toggle */}
                    <div className="flex justify-center items-center gap-4 my-12">
                        <span className={`font-medium ${billingCycle === 'monthly' ? 'text-primary-500' : 'text-subtle'}`}>Monthly</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={billingCycle === 'yearly'} onChange={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')} className="sr-only peer" />
                            <div className="w-14 h-8 bg-muted rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                        <span className={`font-medium ${billingCycle === 'yearly' ? 'text-primary-500' : 'text-subtle'}`}>Yearly</span>
                        <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full dark:bg-green-900 dark:text-green-300">Save 20%</span>
                    </div>

                    {/* Table */}
                    <div className="w-full overflow-x-auto relative border border-muted rounded-2xl shadow-xl shadow-slate-900/5">
                        <table className="w-full border-collapse min-w-[1200px] text-on-surface">
                            <thead className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg">
                                <tr>
                                    <th className="text-left p-6 w-[32%] sticky left-0 bg-background/80 backdrop-blur-lg z-30">
                                        <h2 className="text-2xl font-bold">Compare features</h2>
                                    </th>
                                    {plans.map(plan => (
                                        <th key={plan.name} className={`p-0 w-[17%] border-l border-muted ${plan.isPopular ? 'bg-primary-500/5' : ''}`}>
                                            <PlanHeaderCard plan={plan} onCtaClick={() => handleCtaClick(plan)} />
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonData.map(category => (
                                    <React.Fragment key={category.id}>
                                        <tr className="bg-muted/50">
                                            <th colSpan={5} className="text-left p-3 font-bold text-on-surface sticky left-0 bg-muted/50 z-10">
                                                {category.category}
                                            </th>
                                        </tr>
                                        {category.features.map(feature => (
                                            <tr key={feature.id} className="border-b border-muted last:border-b-0 hover:bg-muted/30">
                                                <td title={feature.description} className="p-4 text-sm font-semibold sticky left-0 bg-background z-10">{feature.name}</td>
                                                <td className="p-4 text-center border-l border-muted">{renderFeatureValue(feature.values.free)}</td>
                                                <td className="p-4 text-center border-l border-muted">{renderFeatureValue(feature.values.basic)}</td>
                                                <td className={`p-4 text-center border-l border-muted ${plans[2].isPopular ? 'bg-primary-500/5' : ''}`}>{renderFeatureValue(feature.values.pro)}</td>
                                                <td className="p-4 text-center border-l border-muted">{renderFeatureValue(feature.values.enterprise)}</td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PricingPage;


