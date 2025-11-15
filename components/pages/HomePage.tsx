import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppIcons } from '../ui/Icons';
import { HomepageContent, PlanContent, BlogPost } from '../../types';
import HomepageChatbot from './HomepageChatbot';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, FunnelChart, Funnel, LabelList, Cell } from 'recharts';
import PaymentModal from '../ui/PaymentModal';

// Custom hook for detecting when an element is in the viewport
interface UseIntersectionObserverOptions extends IntersectionObserverInit {
    triggerOnce?: boolean;
}
const useIntersectionObserver = (options: UseIntersectionObserverOptions) => {
    const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
    const observer = useRef<IntersectionObserver | null>(null);
    const ref = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (observer.current) observer.current.disconnect();

        const { triggerOnce, ...observerOptions } = options;

        observer.current = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setEntry(entry);
                 if (triggerOnce && ref.current) {
                     observer.current?.unobserve(ref.current);
                 }
            }
        }, observerOptions);

        if (ref.current) {
            observer.current.observe(ref.current);
        }

        return () => observer.current?.disconnect();
    }, [options]);

    return [ref, entry];
};

const AnimatedSection: React.FC<{children: React.ReactNode, className?: string, id?: string, as?: React.ElementType}> = ({ children, className, id, as: Component = 'section' }) => {
    const [ref, entry] = useIntersectionObserver({ threshold: 0.1, triggerOnce: true });
    const isVisible = !!entry;
    
    return (
        <Component id={id} ref={ref as React.RefObject<any>} className={`fade-in-section ${isVisible ? 'is-visible' : ''} ${className}`}>
            {children}
        </Component>
    );
};

const AnimatedCounter: React.FC<{ value: number }> = ({ value }) => {
    const [count, setCount] = useState(0);
    const [ref, entry] = useIntersectionObserver({ threshold: 0.5, triggerOnce: true });
    const isVisible = !!entry;

    useEffect(() => {
        if (isVisible) {
            let start = 0;
            const end = value;
            if (start === end) return;

            const duration = 1500;
            const incrementTime = (duration / end);
            
            const timer = setInterval(() => {
                start += 1;
                setCount(start);
                if (start === end) clearInterval(timer);
            }, incrementTime);

            return () => clearInterval(timer);
        }
    }, [isVisible, value]);
    
    return <span ref={ref as React.RefObject<HTMLSpanElement>}>{count}</span>;
}

const PlanCard: React.FC<{ plan: PlanContent; onStartTrial: () => void; }> = ({ plan, onStartTrial }) => {
    const ctaText = plan.price === '$0' ? 'Get Started' : (plan.name === 'Enterprise' ? 'Contact Us' : 'Start Free Trial');
    return (
    <div className={`group relative p-8 rounded-2xl border ${plan.isPopular ? 'border-primary-500' : 'border-muted'} bg-surface flex flex-col transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-primary-500/10`}>
         <div className="absolute inset-0 bg-[url('https://tailwindcss.com/_next/static/media/grid.25c96030.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] dark:invert opacity-5"></div>
        {/* Glowing border effect */}
        <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
             style={{
                background: `radial-gradient(400px at ${Math.random()*100}% ${Math.random()*100}%, rgba(59, 130, 246, 0.2), transparent 80%)`
             }}
        />
        <div className="relative">
            {plan.isPopular && <div className="absolute top-0 -translate-y-[150%] left-1/2 -translate-x-1/2 px-3 py-1 text-sm font-semibold text-white bg-primary-500 rounded-full whitespace-nowrap">Most Popular</div>}
            <h3 className="text-xl font-bold">{plan.name}</h3>
            <p className="mt-2 text-subtle">{plan.description}</p>
            <p className="mt-6 text-4xl font-bold">{plan.price}<span className="text-base font-normal text-subtle">/month</span></p>
            <ul className="mt-6 space-y-3 flex-grow">
                {plan.features.map(feature => (
                    <li key={feature} className="flex items-center gap-3">
                        <AppIcons.CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                    </li>
                ))}
            </ul>
            <button onClick={onStartTrial} className={`mt-8 block w-full text-center px-6 py-3 text-sm font-semibold rounded-lg transition-colors ${plan.isPopular ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-muted text-on-surface hover:bg-primary-500/10'}`}>
                {ctaText}
            </button>
        </div>
    </div>
)};

interface HomePageProps {
    content: HomepageContent;
    blogPosts: BlogPost[];
}

const TestimonialCard: React.FC<{ testimonial: HomepageContent['testimonials']['items'][0] }> = ({ testimonial }) => (
    <div className="w-80 md:w-96 flex-shrink-0 bg-surface p-8 rounded-2xl shadow-lg border border-muted h-full flex flex-col items-center mx-4 transition-transform duration-300 hover:-translate-y-2">
        <img src={testimonial.avatar.src} alt={testimonial.avatar.alt} loading="lazy" className="w-16 h-16 rounded-full mb-4 object-cover ring-2 ring-muted" />
        <p className="text-lg text-on-surface flex-grow text-center">"{testimonial.quote}"</p>
        <div className="mt-6 text-center">
            <p className="font-semibold">{testimonial.author}</p>
            <p className="text-sm text-subtle">{testimonial.company}</p>
        </div>
    </div>
);

const HomePage: React.FC<HomePageProps> = ({ content, blogPosts }) => {
     const { hero, trustedBy, features, pricing, testimonials, faq, finalCta, growthChart, funnel, contactForm, chatbot, blog, howItWorks, integrations } = content;
     const location = useLocation();

     const [activeFeature, setActiveFeature] = useState(features.items[0]);
     const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
     const [openFaq, setOpenFaq] = useState<string | null>(null);

     const [contactFormData, setContactFormData] = useState<Record<string, string>>({});
     const [isSubmitting, setIsSubmitting] = useState(false);
     const [submitSuccess, setSubmitSuccess] = useState(false);

     const [howItWorksRef, howItWorksEntry] = useIntersectionObserver({ threshold: 0.2, triggerOnce: true });
     const isHowItWorksVisible = !!howItWorksEntry;

     const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
     const [selectedPlan, setSelectedPlan] = useState<PlanContent | null>(null);
     const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

     const privacyRef = useRef<HTMLElement>(null);

     // Handle URL hash for privacy section
     useEffect(() => {
         if (location.hash === '#privacy') {
             setIsPrivacyOpen(true);
             // Scroll to privacy section after a short delay to ensure DOM is ready
             setTimeout(() => {
                 privacyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
             }, 100);
         }
     }, [location.hash]);

    const handleStartTrial = (plan: PlanContent) => {
        setSelectedPlan(plan);
        setIsPaymentModalOpen(true);
    };

    const testimonialsRow1 = testimonials.items.slice(0, Math.ceil(testimonials.items.length / 2));
    const testimonialsRow2 = testimonials.items.slice(Math.ceil(testimonials.items.length / 2));

    const handleContactFormChange = (id: string, value: string) => {
        setContactFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        console.log("Submitting to webhook:", contactForm.webhookUrl);
        console.log("Form data:", contactFormData);
        // Simulate API call
        await new Promise(res => setTimeout(res, 1500));
        setIsSubmitting(false);
        setSubmitSuccess(true);
        setContactFormData({});
    };

    const howItWorksIcons: Record<string, React.ReactNode> = {
        Connect: <AppIcons.Connect className="h-8 w-8" />,
        AutomateSteps: <AppIcons.AutomateSteps className="h-8 w-8" />,
        Grow: <AppIcons.Grow className="h-8 w-8" />,
    };
    
    const featureIcons: Record<string, React.ReactNode> = {
        dashboard: <AppIcons.Dashboard className="h-6 w-6" />,
        summary: <AppIcons.Sparkles className="h-6 w-6" />,
        automation: <AppIcons.Automation className="h-6 w-6" />,
        reporting: <AppIcons.Reports className="h-6 w-6" />,
    };

    return (
        <>
            <PaymentModal 
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                plan={selectedPlan}
            />
            {chatbot.enabled && <HomepageChatbot config={chatbot} />}
            
            {/* Hero Section */}
            <section className="py-20 sm:py-24 lg:py-32 overflow-hidden">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-on-surface">
                        {hero.title} <br/>
                        <span className="bg-gradient-to-r from-primary-500 to-purple-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">{hero.gradientTitle}</span>
                    </h1>
                    <p className="mt-6 max-w-2xl mx-auto text-lg text-subtle">
                        {hero.subtitle}
                    </p>
                    <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
                        <button onClick={() => handleStartTrial(pricing.monthlyPlans.find(p => p.isPopular) || pricing.monthlyPlans[2])} className="px-8 py-3 text-base font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-transform hover:scale-105 w-full sm:w-auto">
                            {hero.cta1}
                        </button>
                        <a href="#contact" onClick={(e) => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }} className="px-8 py-3 text-base font-semibold text-on-surface bg-muted rounded-lg hover:bg-primary-500/10 transition-transform hover:scale-105 w-full sm:w-auto">
                            {hero.cta2}
                        </a>
                    </div>
                </div>
            </section>

            {/* Trusted By Marquee */}
            <div className="py-12 bg-surface">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-center text-sm font-semibold text-subtle uppercase tracking-wider">{trustedBy.title}</h2>
                        <div
                        className="group mt-8 w-full overflow-hidden"
                        style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}
                    >
                        <div className="flex w-max animate-infinite-scroll group-hover:[animation-play-state:paused]">
                            {[...trustedBy.logos, ...trustedBy.logos].map((logo, index) => (
                                <div key={`${logo.name}-${index}`} className="px-8 flex-shrink-0">
                                    <img src={logo.src} alt={logo.alt} className="h-12 w-auto transition-transform duration-300 hover:scale-110" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* How It Works */}
            <AnimatedSection id="how-it-works" className="py-20 sm:py-24" as="div">
                    <div ref={howItWorksRef as React.RefObject<HTMLDivElement>} className={`container mx-auto px-4 sm:px-6 lg:px-8 fade-in-child ${isHowItWorksVisible ? 'is-visible' : ''}`}>
                    <div className="text-center">
                        <h2 className="text-3xl font-bold tracking-tight">{howItWorks.title}</h2>
                        <p className="mt-4 text-lg text-subtle max-w-2xl mx-auto">{howItWorks.subtitle}</p>
                    </div>
                    <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center relative">
                        {/* Animated connecting line */}
                        <div className={`hidden md:block absolute top-8 left-0 w-full h-px draw-line ${isHowItWorksVisible ? 'is-visible' : ''}`}>
                            <svg width="100%" height="2" className="overflow-visible">
                                    <path className="line-path" d="M 16.66% 0 L 83.33% 0" strokeWidth="2" stroke="var(--muted)" strokeDasharray="8 8" fill="none" />
                            </svg>
                        </div>

                        {howItWorks.steps.map((step, index) => (
                            <div key={step.id} className={`p-6 transition-transform duration-300 hover:-translate-y-2 anim-child anim-child-${index + 1} relative`}>
                                <div className="relative inline-block">
                                    <div className="flex items-center justify-center h-16 w-16 mx-auto rounded-full bg-primary-500/10 text-primary-500 ring-8 ring-background">
                                        {howItWorksIcons[step.icon]}
                                    </div>
                                        <div className="absolute -top-2 -right-2 flex items-center justify-center h-8 w-8 rounded-full bg-primary-500 text-white font-bold text-sm">
                                        {index + 1}
                                    </div>
                                </div>
                                <h3 className="mt-6 text-xl font-semibold">{step.title}</h3>
                                <p className="mt-2 text-subtle">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </AnimatedSection>

            {/* Interactive Features */}
            <AnimatedSection id="features" className="py-20 sm:py-24 bg-surface">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold tracking-tight">{features.title}</h2>
                        <p className="mt-4 text-lg text-subtle">{features.subtitle}</p>
                    </div>
                    
                    <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                        <div role="tablist" aria-label="Product features" className="flex flex-col gap-4">
                            {features.items.map((feature) => (
                                <button 
                                    key={feature.id} 
                                    id={`feature-tab-${feature.id}`}
                                    role="tab"
                                    aria-selected={activeFeature.id === feature.id}
                                    aria-controls={`feature-panel-${feature.id}`}
                                    onClick={() => setActiveFeature(feature)} 
                                    className={`p-4 rounded-lg text-left transition-all duration-300 ${activeFeature.id === feature.id ? 'bg-primary-500/10 ring-2 ring-primary-500' : 'hover:bg-muted'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg transition-colors ${activeFeature.id === feature.id ? 'bg-primary-500 text-white' : 'bg-muted text-primary-500'}`}>{featureIcons[feature.id]}</div>
                                        <h3 className="font-semibold text-on-surface">{feature.title}</h3>
                                    </div>
                                    {activeFeature.id === feature.id && <p className="mt-2 text-sm text-subtle pl-12">{feature.description}</p>}
                                </button>
                            ))}
                        </div>
                        <div className="lg:col-span-2 relative h-96">
                            {features.items.map(feature => (
                                <div
                                    key={feature.id}
                                    id={`feature-panel-${feature.id}`}
                                    role="tabpanel"
                                    aria-labelledby={`feature-tab-${feature.id}`}
                                    className={`absolute inset-0 transition-opacity duration-500 ${activeFeature.id === feature.id ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
                                >
                                    <img 
                                        src={feature.image.src} 
                                        alt={feature.image.alt} 
                                        loading="lazy"
                                        className="w-full h-full object-cover rounded-xl shadow-2xl ring-1 ring-muted/50" 
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </AnimatedSection>

            {/* Growth Chart Section */}
            <AnimatedSection id="growth" className="py-20 sm:py-24">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">{growthChart.title}</h2>
                            <p className="mt-4 text-lg text-subtle">{growthChart.subtitle}</p>
                            <div className="mt-8 bg-primary-500/10 p-6 rounded-lg text-center">
                                <p className="text-5xl font-bold text-primary-500">
                                    <AnimatedCounter value={growthChart.stat.value} />%
                                </p>
                                <p className="mt-2 text-sm font-semibold text-primary-600">{growthChart.stat.label}</p>
                            </div>
                        </div>
                        <div className="bg-surface p-6 rounded-xl shadow-lg border border-muted">
                            <h3 className="text-lg font-semibold text-center mb-4">Typical Growth Trajectory</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={growthChart.chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--muted)" />
                                    <XAxis dataKey="month" stroke="var(--subtle)" />
                                    <YAxis stroke="var(--subtle)" tickFormatter={(value) => `${value}%`} />
                                    <Tooltip cursor={{ fill: 'var(--muted)' }} contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--muted)' }} formatter={(value: number) => [`${value}%`, "Conversion Rate"]} />
                                    <Bar dataKey="value" name="Conversion Rate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </AnimatedSection>
            
            {/* Funnel Section */}
            <AnimatedSection id="funnel" className="py-20 sm:py-24 bg-surface">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">{funnel.title}</h2>
                            <p className="mt-4 text-lg text-subtle">{funnel.subtitle}</p>
                            {funnel.stages.length > 1 && (
                                <div className="mt-8 bg-purple-500/10 p-6 rounded-lg text-center">
                                    <p className="text-5xl font-bold text-purple-500">
                                        {((funnel.stages[funnel.stages.length - 1].value / funnel.stages[0].value) * 100).toFixed(1)}%
                                    </p>
                                    <p className="mt-2 text-sm font-semibold text-purple-600">Overall Conversion Rate</p>
                                </div>
                            )}
                        </div>
                        
                        <div className="bg-background p-6 rounded-xl shadow-lg border border-muted h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <FunnelChart>
                                    <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--muted)' }} />
                                    <Funnel
                                        dataKey="value"
                                        data={funnel.stages}
                                        isAnimationActive={true}
                                    >
                                        {
                                            funnel.stages.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef'][index % 5]} />
                                            ))
                                        }
                                        <LabelList position="center" fill="#fff" stroke="none" dataKey="name" className="font-semibold" />
                                    </Funnel>
                                </FunnelChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </AnimatedSection>

            {/* Integrations Showcase */}
            <AnimatedSection id="integrations" className="py-20 sm:py-24">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold tracking-tight">{integrations.title}</h2>
                        <p className="mt-4 text-lg text-subtle max-w-2xl mx-auto">{integrations.subtitle}</p>
                    </div>
                    <div className="mt-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
                        {integrations.logos.map(logo => (
                            <div key={logo.name} className="flex justify-center transition duration-300 transform hover:scale-110 hover:shadow-2xl rounded-full p-2">
                                <img src={logo.src} alt={logo.alt} className="h-12 w-auto" />
                            </div>
                        ))}
                    </div>
                </div>
            </AnimatedSection>

            {/* Pricing Plans */}
            <AnimatedSection id="pricing" className="py-20 sm:py-24 bg-surface">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold tracking-tight">{pricing.title}</h2>
                        <p className="mt-4 text-lg text-subtle">{pricing.subtitle}</p>
                    </div>
                    <div className="flex justify-center items-center gap-4 mb-8">
                            <span className={`font-medium ${billingCycle === 'monthly' ? 'text-primary-500' : 'text-subtle'}`}>Monthly</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={billingCycle === 'yearly'} onChange={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')} className="sr-only peer" />
                            <div className="w-14 h-8 bg-muted rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                            <span className={`font-medium ${billingCycle === 'yearly' ? 'text-primary-500' : 'text-subtle'}`}>Yearly</span>
                            <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full dark:bg-green-900 dark:text-green-300">Save 20%</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {(billingCycle === 'monthly' ? pricing.monthlyPlans : pricing.yearlyPlans).map(plan => {
                            const startTrialHandler = () => {
                                if (plan.name === 'Free') {
                                    window.location.hash = '/login';
                                } else if (plan.name === 'Enterprise') {
                                    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                                } else {
                                    handleStartTrial(plan);
                                }
                            };
                            return <PlanCard key={plan.name} plan={plan} onStartTrial={startTrialHandler} />;
                        })}
                    </div>
                </div>
            </AnimatedSection>
            
            {/* Testimonials */}
            <AnimatedSection id="testimonials" className="py-20 sm:py-24">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
                    <h2 className="text-3xl font-bold tracking-tight">{testimonials.title}</h2>
                    <div className="mt-16 space-y-8">
                        {/* Row 1: Scrolls right to left */}
                        <div className="group w-full overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
                            <div className="flex w-max animate-infinite-scroll group-hover:[animation-play-state:paused]">
                                {[...testimonialsRow1, ...testimonialsRow1].map((testimonial, index) => (
                                    <TestimonialCard key={`${testimonial.id}-1-${index}`} testimonial={testimonial} />
                                ))}
                            </div>
                        </div>
                        {/* Row 2: Scrolls left to right */}
                        <div className="group w-full overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
                            <div className="flex w-max animate-infinite-scroll-reverse group-hover:[animation-play-state:paused]">
                                {[...testimonialsRow2, ...testimonialsRow2].map((testimonial, index) => (
                                    <TestimonialCard key={`${testimonial.id}-2-${index}`} testimonial={testimonial} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </AnimatedSection>

            {/* Blog Section */}
            <AnimatedSection id="blog" className="py-20 sm:py-24 bg-surface">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold tracking-tight">{blog.title}</h2>
                        <p className="mt-4 text-lg text-subtle">{blog.subtitle}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {blogPosts.slice(0, 3).map(post => (
                            <Link to={`/blog/${post.slug}`} key={post.id} className="group block bg-background rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                                <div className="overflow-hidden">
                                    <img src={post.featuredImage.src} alt={post.featuredImage.alt} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                                </div>
                                <div className="p-6">
                                    <p className="text-sm text-primary-500 font-semibold">{post.tags.join(', ')}</p>
                                    <h3 className="mt-2 text-lg font-bold group-hover:text-primary-500 transition-colors">{post.title}</h3>
                                    <p className="mt-2 text-sm text-subtle line-clamp-3">{post.excerpt}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                    <div className="text-center mt-12">
                        <Link to="/blog" className="font-semibold text-primary-500 hover:text-primary-600">
                            View All Posts &rarr;
                        </Link>
                    </div>
                </div>
            </AnimatedSection>

                {/* FAQ Section */}
            <AnimatedSection id="faq" className="py-20 sm:py-24 bg-background">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold tracking-tight">{faq.title}</h2>
                        <p className="mt-4 text-lg text-subtle">{faq.subtitle}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 max-w-4xl mx-auto">
                        {faq.items.map((faqItem) => (
                            <div key={faqItem.id} className="border-b border-muted">
                                <button
                                    id={`faq-button-${faqItem.id}`}
                                    onClick={() => setOpenFaq(openFaq === faqItem.id ? null : faqItem.id)}
                                    aria-expanded={openFaq === faqItem.id}
                                    aria-controls={`faq-panel-${faqItem.id}`}
                                    className="w-full flex justify-between items-center text-left font-semibold py-4 hover:bg-muted/50 rounded-t-lg px-2 text-on-surface"
                                >
                                    <span>{faqItem.q}</span>
                                    <span className={`transform transition-transform duration-300 ${openFaq === faqItem.id ? 'rotate-180' : ''}`}>
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </span>
                                </button>
                                <div
                                    id={`faq-panel-${faqItem.id}`}
                                    role="region"
                                    aria-labelledby={`faq-button-${faqItem.id}`}
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === faqItem.id ? 'max-h-60' : 'max-h-0'}`}
                                >
                                    <p className="pt-2 pb-4 px-2 text-subtle">{faqItem.a}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </AnimatedSection>
            
            {/* Contact Form */}
            <AnimatedSection id="contact" className="py-20 sm:py-24 relative overflow-hidden bg-surface">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/10 to-purple-500/10 blur-3xl opacity-50 dark:opacity-20"></div>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold tracking-tight">{contactForm.title}</h2>
                        <p className="mt-4 text-lg text-subtle">{contactForm.subtitle}</p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                            {/* Left Column: Contact Info & Map */}
                        <div className="space-y-8 order-2 lg:order-1">
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-primary-500/10 rounded-lg"><AppIcons.MapPin className="h-6 w-6 text-primary-500 flex-shrink-0" /></div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Our Office</h3>
                                        <p className="text-subtle">{contactForm.address}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-primary-500/10 rounded-lg"><AppIcons.Envelope className="h-6 w-6 text-primary-500 flex-shrink-0" /></div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Email Us</h3>
                                        <a href={`mailto:${contactForm.email}`} className="text-subtle hover:text-primary-500 transition-colors">{contactForm.email}</a>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-primary-500/10 rounded-lg"><AppIcons.Phone className="h-6 w-6 text-primary-500 flex-shrink-0" /></div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Call Us</h3>
                                        <a href={`tel:${contactForm.phone.replace(/\s/g, '')}`} className="text-subtle hover:text-primary-500 transition-colors">{contactForm.phone}</a>
                                    </div>
                                </div>
                            </div>
                            <div className="aspect-w-16 aspect-h-9 rounded-2xl overflow-hidden shadow-lg border border-muted/50">
                                <iframe 
                                    src={contactForm.mapSrc}
                                    width="100%" 
                                    height="100%" 
                                    style={{ border: 0 }} 
                                    allowFullScreen={false} 
                                    loading="lazy" 
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="Location of Our Office on Google Maps"
                                ></iframe>
                            </div>
                        </div>
                        {/* Right Column: Form */}
                        <div className="bg-surface/50 dark:bg-surface/20 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-muted/50 order-1 lg:order-2">
                            {submitSuccess ? (
                                <div className="text-center p-8 transition-all duration-500">
                                    <AppIcons.CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                                    <h3 className="text-2xl font-semibold">Thank You!</h3>
                                    <p className="text-subtle mt-2">Your message has been sent. Our team will get back to you shortly.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleContactSubmit} className="space-y-8">
                                    {contactForm.fields.map(field => (
                                        <div key={field.id} className="relative z-0">
                                            {field.type === 'textarea' ? (
                                                <textarea id={field.id} name={field.id} rows={4} required={field.required} value={contactFormData[field.id] || ''} onChange={e => handleContactFormChange(field.id, e.target.value)} 
                                                className="block py-2.5 px-0 w-full text-sm text-on-surface bg-transparent border-0 border-b-2 border-muted appearance-none focus:outline-none focus:ring-0 focus:border-primary-500 peer"
                                                placeholder=" " />
                                            ) : (
                                                <input id={field.id} name={field.id} type={field.type} required={field.required} value={contactFormData[field.id] || ''} onChange={e => handleContactFormChange(field.id, e.target.value)} 
                                                className="block py-2.5 px-0 w-full text-sm text-on-surface bg-transparent border-0 border-b-2 border-muted appearance-none focus:outline-none focus:ring-0 focus:border-primary-500 peer"
                                                placeholder=" " />
                                            )}
                                            <label htmlFor={field.id} 
                                            className="absolute text-sm text-subtle duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-primary-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
                                                {field.label}
                                            </label>
                                        </div>
                                    ))}
                                    <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg disabled:bg-primary-400 transition-all duration-300 transform hover:scale-105">
                                        {isSubmitting ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                            Send Message <AppIcons.ChevronRight className="h-5 w-5" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </AnimatedSection>


            {/* Privacy Policy Section */}
            <AnimatedSection id="privacy" className="relative py-20 sm:py-24 bg-surface overflow-hidden">
                {/* Background glow effects */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5"></div>
                <div className="absolute top-1/4 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl opacity-30"></div>
                <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl opacity-30"></div>

                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center gap-3 mb-4">
                                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg">
                                    <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h2 className="text-3xl font-bold tracking-tight text-white">Privacy Policy</h2>
                            </div>
                            <p className="text-sm text-gray-300">Last updated: 13 October 2025</p>
                        </div>

                        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden backdrop-blur-sm hover:shadow-blue-500/10 transition-shadow duration-500">
                            {/* Glowing border effect */}
                            <div className="absolute -inset-px rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 blur-sm"></div>

                            {/* Decorative background elements */}
                            <div className="absolute inset-0 opacity-40">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-2xl"></div>
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-2xl"></div>
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl"></div>
                            </div>
                            <button
                                onClick={() => setIsPrivacyOpen(!isPrivacyOpen)}
                                className="relative w-full p-6 text-left flex items-center justify-between hover:bg-slate-800/50 transition-all duration-300 group"
                                aria-expanded={isPrivacyOpen}
                                aria-controls="privacy-content"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                                        <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <span className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors">Privacy Policy</span>
                                </div>
                                <svg className={`h-5 w-5 text-gray-400 transform transition-transform duration-300 ${isPrivacyOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            <div
                                id="privacy-content"
                                className={`relative overflow-hidden transition-all duration-300 ease-in-out ${isPrivacyOpen ? 'max-h-[40vh] opacity-100' : 'max-h-0 opacity-0'}`}
                            >
                                {/* Content gradient overlay */}
                                <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-slate-800/50 to-transparent pointer-events-none z-10"></div>
                                <div className={`p-6 ${isPrivacyOpen ? 'overflow-y-auto' : ''}`} style={{ maxHeight: isPrivacyOpen ? '40vh' : '0px' }}>
                                     <div className="prose prose-sm max-w-none text-white">
                                         <p className="mb-4 text-white">
                                             At <strong className="text-blue-400">Clienn CRM</strong>, your privacy and data protection are our highest priorities.
                                             This Privacy Policy explains how we collect, use, store, and protect your personal and organizational data when you use our CRM, LMS, and integrated marketing services.
                                         </p>

                                         <p className="mb-6 text-white">
                                             By using Clienn CRM, you agree to this Privacy Policy. If you do not agree, please stop using the platform immediately.
                                         </p>

                                         <h3 className="text-lg font-semibold mb-4 text-blue-400 border-b border-blue-400 pb-2">1. Overview</h3>

                                         <h3 className="text-lg font-semibold mb-4 text-blue-400 border-b border-blue-400 pb-2">2. What Information We Collect</h3>

                                         <h4 className="text-base font-semibold mb-3 text-blue-300">2.1 Account Information</h4>
                                         <ul className="list-disc pl-6 mb-4 text-sm text-gray-200 leading-relaxed">
                                             <li>Name, email address, phone number</li>
                                             <li>Organization details, designation, and team role</li>
                                             <li>Billing and subscription information</li>
                                         </ul>

                                         <h4 className="text-base font-semibold mb-3 text-blue-300">2.2 Usage Data</h4>
                                         <ul className="list-disc pl-6 mb-4 text-sm text-gray-200 leading-relaxed">
                                             <li>Actions you take within the CRM (lead creation, task updates, note additions)</li>
                                             <li>Feature usage metrics (e.g., campaigns, imports, communication logs)</li>
                                             <li>Device details (browser type, OS, IP address, time zone)</li>
                                         </ul>

                                         <h4 className="text-base font-semibold mb-3 text-blue-300">2.3 Leads and Contacts</h4>
                                         <ul className="list-disc pl-6 mb-4 text-sm text-gray-200 leading-relaxed">
                                             <li>Lead name, email, phone number, and any notes or interactions logged by your team</li>
                                             <li>Source information (e.g., Facebook Lead Ads, Google Forms, or manual entries)</li>
                                         </ul>

                                         <h4 className="text-base font-semibold mb-3 text-blue-300">2.4 Integrations</h4>
                                         <ul className="list-disc pl-6 mb-4 text-sm text-gray-200 leading-relaxed">
                                             <li>API keys and tokens from third-party services (e.g., Meta, Google, WhatsApp, Zoom)</li>
                                             <li>Consent-based data sharing for leads and campaigns</li>
                                         </ul>

                                         <h4 className="text-base font-semibold mb-3 text-blue-300">2.5 Cookies and Tracking</h4>
                                         <p className="mb-4 text-sm text-gray-200 leading-relaxed">We use cookies for session management, analytics, and feature optimization.</p>
                                         <p className="mb-6 text-sm text-gray-200 leading-relaxed">You can control cookie preferences in your browser.</p>

                                         <h3 className="text-lg font-semibold mb-4 text-blue-400 border-b border-blue-400 pb-2">3. How We Use the Data</h3>

                                        <p className="mb-4 text-sm text-white">We process your data for the following purposes:</p>

                                        <div className="overflow-x-auto mb-6">
                                            <table className="w-full text-sm border-collapse border border-slate-600">
                                                <thead>
                                                    <tr className="bg-slate-800">
                                                        <th className="border border-slate-600 p-2 text-left font-semibold text-blue-400">Purpose</th>
                                                        <th className="border border-slate-600 p-2 text-left font-semibold text-blue-400">Description</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td className="border border-slate-600 p-2 text-gray-200">Account Management</td>
                                                        <td className="border border-slate-600 p-2 text-gray-200">To create, manage, and authenticate user accounts</td>
                                                    </tr>
                                                    <tr className="bg-slate-800">
                                                        <td className="border border-slate-600 p-2 text-gray-200">Service Delivery</td>
                                                        <td className="border border-slate-600 p-2 text-gray-200">To provide CRM/LMS features, integrations, and dashboards</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="border border-slate-600 p-2 text-gray-200">Communication</td>
                                                        <td className="border border-slate-600 p-2 text-gray-200">To send updates, notifications, and support messages</td>
                                                    </tr>
                                                    <tr className="bg-slate-800">
                                                        <td className="border border-slate-600 p-2 text-gray-200">AI Recommendations</td>
                                                        <td className="border border-slate-600 p-2 text-gray-200">To improve lead scoring, engagement prediction, and campaign optimization</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="border border-slate-600 p-2 text-gray-200">Compliance & Security</td>
                                                        <td className="border border-slate-600 p-2 text-gray-200">To prevent fraud, unauthorized access, and misuse of the system</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        <h3 className="text-lg font-semibold mb-4 text-blue-400 border-b border-blue-400 pb-2">4. AI-Driven Processing</h3>

                                        <p className="mb-4 text-sm text-gray-200 leading-relaxed">
                                            Our platform uses AI models to recommend actions (e.g., lead priority, follow-up timing, and communication templates).
                                        </p>

                                        <p className="mb-4 text-sm text-gray-200 leading-relaxed">
                                            These recommendations are based on anonymized and aggregated data.
                                        </p>

                                        <p className="mb-6 text-sm text-gray-200 leading-relaxed">
                                            We do not use your private lead data for any external AI model training.
                                        </p>

                                        <p className="mb-6 text-sm text-gray-200 leading-relaxed">
                                            You can request opt-out of AI-based insights anytime.
                                        </p>

                                        <h3 className="text-lg font-semibold mb-4 text-blue-400 border-b border-blue-400 pb-2">5. Data Sharing & Third-Party Services</h3>

                                        <p className="mb-4 text-sm font-semibold text-white">We never sell your data.</p>
                                        <p className="mb-4 text-sm text-gray-200 leading-relaxed">We may share limited information only under these conditions:</p>

                                        <div className="overflow-x-auto mb-6">
                                            <table className="w-full text-sm border-collapse border border-slate-600">
                                                <thead>
                                                    <tr className="bg-slate-800">
                                                        <th className="border border-slate-600 p-2 text-left font-semibold text-blue-400">Type</th>
                                                        <th className="border border-slate-600 p-2 text-left font-semibold text-blue-400">Shared With</th>
                                                        <th className="border border-slate-600 p-2 text-left font-semibold text-blue-400">Purpose</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td className="border border-slate-600 p-2 text-gray-200">Analytics</td>
                                                        <td className="border border-slate-600 p-2 text-gray-200">Google Analytics, Mixpanel</td>
                                                        <td className="border border-slate-600 p-2 text-gray-200">To understand feature usage</td>
                                                    </tr>
                                                    <tr className="bg-slate-800">
                                                        <td className="border border-slate-600 p-2 text-gray-200">Integrations</td>
                                                        <td className="border border-slate-600 p-2 text-gray-200">Meta, Google, WhatsApp API</td>
                                                        <td className="border border-slate-600 p-2 text-gray-200">To sync leads and send communications</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="border border-slate-600 p-2 text-gray-200">Payment Gateways</td>
                                                        <td className="border border-slate-600 p-2 text-gray-200">Razorpay, Stripe</td>
                                                        <td className="border border-slate-600 p-2 text-gray-200">For subscription and plan renewals</td>
                                                    </tr>
                                                    <tr className="bg-slate-800">
                                                        <td className="border border-slate-600 p-2 text-gray-200">Cloud Services</td>
                                                        <td className="border border-slate-600 p-2 text-gray-200">AWS, MongoDB Atlas, Neon PostgreSQL</td>
                                                        <td className="border border-slate-600 p-2 text-gray-200">For secure hosting and data storage</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        <p className="mb-6 text-sm text-gray-200 leading-relaxed">
                                            All third parties comply with strict contractual obligations and data protection standards.
                                        </p>

                                        <h3 className="text-lg font-semibold mb-4 text-blue-400 border-b border-blue-400 pb-2">6. Organization-Level Privacy</h3>

                                        <p className="mb-6 text-sm text-gray-200 leading-relaxed">
                                            Clienn CRM operates in a multi-tenant architecture:
                                        </p>

                                        <ul className="list-disc pl-6 mb-6 text-sm text-gray-200 leading-relaxed">
                                            <li>Each organization's data is logically and physically isolated.</li>
                                            <li>Super Admins can view only their organization's users and leads.</li>
                                            <li>No cross-organization data access is permitted.</li>
                                        </ul>

                                        <h3 className="text-lg font-semibold mb-4 text-blue-400 border-b border-blue-400 pb-2">7. Data Retention Policy</h3>

                                        <div className="overflow-x-auto mb-6">
                                            <table className="w-full text-sm border-collapse border border-slate-600">
                                                <thead>
                                                    <tr className="bg-slate-800">
                                                        <th className="border border-slate-600 p-2 text-left font-semibold text-blue-400">Data Type</th>
                                                        <th className="border border-slate-600 p-2 text-left font-semibold text-blue-400">Retention Period</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td className="border border-slate-600 p-2 text-gray-200">Account and organization data</td>
                                                        <td className="border border-slate-600 p-2 text-gray-200">Until account deletion</td>
                                                    </tr>
                                                    <tr className="bg-slate-800">
                                                        <td className="border border-slate-600 p-2 text-gray-200">Leads and communications</td>
                                                        <td className="border border-slate-600 p-2 text-gray-200">As long as your subscription is active</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="border border-slate-600 p-2 text-gray-200">Billing records</td>
                                                        <td className="border border-slate-600 p-2 text-gray-200">7 years (as required by law)</td>
                                                    </tr>
                                                    <tr className="bg-slate-800">
                                                        <td className="border border-slate-600 p-2 text-gray-200">Logs and backups</td>
                                                        <td className="border border-slate-600 p-2 text-gray-200">Up to 90 days</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        <p className="mb-6 text-sm text-gray-200 leading-relaxed">
                                            You can request data deletion via email or the in-app Support section.
                                        </p>

                                        <h3 className="text-lg font-semibold mb-4 text-blue-400 border-b border-blue-400 pb-2">8. Data Security</h3>

                                        <p className="mb-4 text-sm text-gray-200 leading-relaxed">We implement multiple layers of protection:</p>

                                        <ul className="list-disc pl-6 mb-6 text-sm text-gray-200 leading-relaxed">
                                            <li>SSL/TLS encryption for all data in transit</li>
                                            <li>Role-based access control (RBAC)</li>
                                            <li>Encrypted passwords and tokens (bcrypt + JWT)</li>
                                            <li>Regular security audits and vulnerability scans</li>
                                            <li>Geo-redundant backups and uptime monitoring</li>
                                        </ul>

                                        <h3 className="text-lg font-semibold mb-4 text-blue-400 border-b border-blue-400 pb-2">9. Your Rights</h3>

                                        <p className="mb-4 text-sm text-gray-200 leading-relaxed">You have full control over your data:</p>

                                        <ul className="list-disc pl-6 mb-6 text-sm text-gray-200 leading-relaxed">
                                            <li><strong>Access</strong> – Request a copy of your data</li>
                                            <li><strong>Correction</strong> – Update inaccurate information</li>
                                            <li><strong>Deletion</strong> – Request permanent deletion</li>
                                            <li><strong>Portability</strong> – Export your CRM data in structured format</li>
                                            <li><strong>Consent Withdrawal</strong> – Opt-out of marketing or data sharing</li>
                                        </ul>

                                        <p className="mb-6 text-sm text-gray-200 leading-relaxed">
                                            To exercise any of these rights, contact us via the in-app support form or email below.
                                        </p>

                                        <h3 className="text-lg font-semibold mb-4 text-blue-400 border-b border-blue-400 pb-2">10. International Data Transfer</h3>

                                        <p className="mb-6 text-sm text-gray-200 leading-relaxed">
                                            If you are located outside India, your data may be processed in India or other countries where our servers and partners are located.
                                            We ensure equivalent data protection measures in compliance with GDPR and DPDP (India).
                                        </p>

                                        <h3 className="text-lg font-semibold mb-4 text-blue-400 border-b border-blue-400 pb-2">11. Children's Privacy</h3>

                                        <p className="mb-6 text-sm text-gray-200 leading-relaxed">
                                            Our services are not directed to individuals under the age of 18.
                                            We do not knowingly collect personal data from minors.
                                        </p>

                                        <h3 className="text-lg font-semibold mb-4 text-blue-400 border-b border-blue-400 pb-2">12. Policy Updates</h3>

                                        <p className="mb-4 text-sm text-gray-200 leading-relaxed">We may update this Privacy Policy periodically.</p>
                                        <p className="mb-4 text-sm text-gray-200 leading-relaxed">When changes are made, we will:</p>

                                        <ul className="list-disc pl-6 mb-6 text-sm text-gray-200 leading-relaxed">
                                            <li>Update the "Last Updated" date, and</li>
                                            <li>Notify all users via dashboard or email.</li>
                                        </ul>

                                        <h3 className="text-lg font-semibold mb-4 text-blue-400 border-b border-blue-400 pb-2">13. Contact Us</h3>

                                        <p className="mb-4 text-sm text-gray-200 leading-relaxed">
                                            If you have any questions, concerns, or complaints about privacy or data usage:
                                        </p>

                                        <div className="bg-slate-800 p-4 rounded-lg mb-6">
                                            <p className="text-sm font-semibold text-white">Data Protection Officer (DPO)</p>
                                            <p className="text-sm font-semibold text-white">Clienn CRM | Zetta Edutech Private Limited</p>
                                            <a href="mailto:support@Clienn CRM.io" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">📧 Email: support@Clienn CRM.io</a>
                                            <p className="text-sm text-gray-200">🏢 Address: New Delhi, India</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AnimatedSection>

            {/* Final CTA */}
            <section className="relative bg-slate-900 text-white overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-purple-600 opacity-80"></div>
                    <div className="absolute -bottom-1/2 -left-1/4 w-full h-full bg-gradient-to-r from-primary-500/30 to-transparent rounded-full blur-3xl transform rotate-45"></div>
                <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                    <h2 className="text-4xl font-bold">{finalCta.title}</h2>
                    <p className="mt-4 max-w-2xl mx-auto text-slate-200">{finalCta.subtitle}</p>
                    <div className="mt-8">
                            <button onClick={() => handleStartTrial(pricing.monthlyPlans.find(p => p.isPopular) || pricing.monthlyPlans[2])} className="inline-flex items-center gap-2 px-8 py-3 text-base font-semibold text-primary-600 bg-white rounded-lg hover:bg-gray-200 transition-transform hover:scale-105 shadow-lg">
                                {finalCta.cta} <AppIcons.Rocket className="h-5 w-5" />
                            </button>
                    </div>
                </div>
            </section>
        </>
    );
};
export default HomePage;


