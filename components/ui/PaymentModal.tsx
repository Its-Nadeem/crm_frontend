
import React, { useState, useEffect } from 'react';
import { PlanContent, PaymentGatewayProvider } from '../../types';
import Modal from './Modal';
import { AppIcons } from './Icons';
import { Link } from 'react-router-dom';
import { apiService } from '../../src/services/api';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    plan: PlanContent | null;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, plan }) => {
    const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
    const [selectedGateway, setSelectedGateway] = useState<PaymentGatewayProvider | null>(null);
    const [enabledGateways, setEnabledGateways] = useState<PaymentGatewayProvider[]>([]);
    const [cardDetails, setCardDetails] = useState({
        name: '',
        number: '',
        expiry: '',
        cvc: '',
    });

    useEffect(() => {
        if (isOpen) {
            setStep('form');
            // Fetch enabled payment gateways
            fetchEnabledGateways();
        }
    }, [isOpen]);

    const fetchEnabledGateways = async () => {
        try {
            const response: any = await apiService.requestWithRetry('/api/public/enabled-payment-gateways', {
                method: 'GET'
            });
            setEnabledGateways(response.gateways || []);
            // Auto-select first available gateway
            if (response.gateways && response.gateways.length > 0) {
                setSelectedGateway(response.gateways[0]);
            }
        } catch (error) {
            console.error('Failed to fetch enabled gateways:', error);
            // Fallback to default gateways if API fails
            setEnabledGateways(['stripe', 'paypal']);
            setSelectedGateway('stripe');
        }
    };

    if (!isOpen || !plan) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'number') {
            const formatted = value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim();
            setCardDetails(prev => ({ ...prev, [name]: formatted.slice(0, 19) }));
        } else if (name === 'expiry') {
            const formatted = value.replace(/\D/g, '').replace(/(\d{2})/, '$1/').trim();
            setCardDetails(prev => ({ ...prev, [name]: formatted.slice(0, 5) }));
        } else if (name === 'cvc') {
            setCardDetails(prev => ({ ...prev, [name]: value.replace(/\D/g, '').slice(0, 4) }));
        } else {
            setCardDetails(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep('processing');
        setTimeout(() => {
            setStep('success');
        }, 2000);
    };

    const renderContent = () => {
        switch (step) {
            case 'processing':
                return (
                    <div className="text-center p-8 h-80 flex flex-col justify-center">
                        <svg className="animate-spin h-12 w-12 text-primary-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <h3 className="mt-4 text-lg font-semibold">Processing your request...</h3>
                        <p className="text-sm text-subtle">This will only take a moment.</p>
                    </div>
                );
            case 'success':
                return (
                    <div className="text-center p-8 h-80 flex flex-col justify-center">
                        <AppIcons.CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                        <h3 className="mt-4 text-2xl font-bold">Success! Your Trial has Started</h3>
                        <p className="text-subtle mt-2 max-w-sm mx-auto">
                            Your card will not be charged until your 14-day free trial ends. You can cancel anytime.
                            You can now log in to get started with Clienn CRM.
                        </p>
                        <Link to="/login" onClick={onClose} className="mt-6 inline-block bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-lg">
                            Go to Login
                        </Link>
                    </div>
                );
            case 'form':
            default:
                const gatewayLogos: Record<PaymentGatewayProvider, string> = {
                    stripe: 'https://cdn.worldvectorlogo.com/logos/stripe-4.svg',
                    razorpay: 'https://cdn.worldvectorlogo.com/logos/razorpay.svg',
                    paypal: 'https://cdn.worldvectorlogo.com/logos/paypal-3.svg',
                    payu: 'https://cdn.worldvectorlogo.com/logos/payu.svg',
                    paytm: 'https://cdn.worldvectorlogo.com/logos/paytm.svg',
                    square: 'https://cdn.worldvectorlogo.com/logos/square-3.svg',
                    braintree: 'https://cdn.worldvectorlogo.com/logos/braintree.svg',
                    adyen: 'https://cdn.worldvectorlogo.com/logos/adyen.svg',
                    'authorize.net': 'https://cdn.worldvectorlogo.com/logos/authorize-net.svg'
                };

                const gatewayNames: Record<PaymentGatewayProvider, string> = {
                    stripe: 'Stripe',
                    razorpay: 'Razorpay',
                    paypal: 'PayPal',
                    payu: 'PayU',
                    paytm: 'Paytm',
                    square: 'Square',
                    braintree: 'Braintree',
                    adyen: 'Adyen',
                    'authorize.net': 'Authorize.net'
                };

                return (
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold">Start your 14-day free trial</h3>
                            <div className="bg-background p-4 rounded-lg border border-muted">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">{plan.name} Plan</span>
                                    <span className="font-bold text-lg">{plan.price}<span className="text-sm font-normal text-subtle">/mo</span></span>
                                </div>
                                <ul className="text-xs text-subtle mt-2 space-y-1">
                                    {plan.features.map(f => <li key={f} className="flex items-center gap-2"><AppIcons.CheckCircle className="h-3 w-3 text-green-500"/> {f}</li>)}
                                </ul>
                            </div>

                            {/* Payment Gateway Selection */}
                            {enabledGateways.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-sm">Choose Payment Method</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {enabledGateways.map(gateway => (
                                            <button
                                                key={gateway}
                                                type="button"
                                                onClick={() => setSelectedGateway(gateway)}
                                                className={`p-3 border rounded-lg flex items-center gap-3 hover:bg-muted/50 transition-colors ${
                                                    selectedGateway === gateway ? 'border-primary-500 bg-primary-50' : 'border-muted'
                                                }`}
                                            >
                                                <img src={gatewayLogos[gateway]} alt={gatewayNames[gateway]} className="h-6 w-6" />
                                                <span className="text-sm font-medium">{gatewayNames[gateway]}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <p className="text-xs text-subtle">
                                After your 14-day trial, your plan will automatically renew at {plan.price}/month. You can cancel at any time before the trial ends and you won't be charged.
                            </p>
                        </div>
                        <div className="space-y-4">
                             <input type="text" name="name" value={cardDetails.name} onChange={handleInputChange} placeholder="Name on Card" required className="w-full bg-background border border-muted p-3 rounded-md text-sm" />
                             <input type="text" name="number" value={cardDetails.number} onChange={handleInputChange} placeholder="Card Number" required className="w-full bg-background border border-muted p-3 rounded-md text-sm" />
                             <div className="grid grid-cols-2 gap-4">
                                <input type="text" name="expiry" value={cardDetails.expiry} onChange={handleInputChange} placeholder="MM / YY" required className="w-full bg-background border border-muted p-3 rounded-md text-sm" />
                                <input type="text" name="cvc" value={cardDetails.cvc} onChange={handleInputChange} placeholder="CVC" required className="w-full bg-background border border-muted p-3 rounded-md text-sm" />
                             </div>
                             <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg">
                                 Start Free Trial
                             </button>
                        </div>
                    </form>
                );
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={step === 'processing' ? () => {} : onClose} title={step === 'form' ? 'Checkout' : ''}>
            {renderContent()}
        </Modal>
    );
};

export default PaymentModal;



