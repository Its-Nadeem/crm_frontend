
import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { AppIcons } from '../ui/Icons';
import { HomepageContent, OfferStrip } from '../../types';

interface PublicLayoutProps {
    theme: string;
    toggleTheme: () => void;
    content: HomepageContent;
    offerStrip: OfferStrip;
}

const MobileNavLink: React.FC<{ to: string; children: React.ReactNode; onClick: () => void; }> = ({ to, children, onClick }) => {
    const isExternal = to.startsWith('http') || to.startsWith('mailto');
    if (isExternal || to.startsWith('#')) {
        return (
            <a href={to} onClick={onClick} className="block text-center text-lg font-semibold text-on-surface py-3 hover:bg-muted rounded-lg transition-colors">
                {children}
            </a>
        );
    }
    return (
        <Link to={to} onClick={onClick} className="block text-center text-lg font-semibold text-on-surface py-3 hover:bg-muted rounded-lg transition-colors">
            {children}
        </Link>
    );
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ theme, toggleTheme, content, offerStrip }) => {
    const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isOfferDismissed, setIsOfferDismissed] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsHeaderScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'auto';
        return () => { document.body.style.overflow = 'auto'; };
    }, [isMobileMenuOpen]);
    
    const socialIcons: Record<string, React.ReactNode> = {
        LinkedIn: <AppIcons.LinkedIn className="h-5 w-5" />,
        Twitter: <AppIcons.Twitter className="h-5 w-5" />,
        Facebook: <AppIcons.Facebook className="h-5 w-5" />,
        Youtube: <AppIcons.Youtube className="h-5 w-5" />,
        Instagram: <AppIcons.Instagram className="h-5 w-5" />,
    };

    const navLinks = [
        { to: "/#features", text: "Features" },
        { to: "/pricing", text: "Pricing" },
        { to: "/blog", text: "Blog" },
        { to: "/#contact", text: "Contact" },
    ];
    
    const isOfferActive = offerStrip && offerStrip.isEnabled && !isOfferDismissed && (!offerStrip.autoDisableAt || new Date() < new Date(offerStrip.autoDisableAt));

    return (
         <div className="bg-background text-on-surface font-sans">
            {isOfferActive && offerStrip && (
                <div className="bg-primary-600 text-white p-2.5 text-center text-sm relative">
                    <span>{offerStrip.text}</span>
                    {offerStrip.ctaText && offerStrip.ctaLink && (
                        <a href={offerStrip.ctaLink} className="font-bold underline ml-2 hover:opacity-80">
                            {offerStrip.ctaText} &rarr;
                        </a>
                    )}
                    <button onClick={() => setIsOfferDismissed(true)} className="absolute top-1/2 right-4 -translate-y-1/2 p-1 rounded-full hover:bg-white/20" aria-label="Dismiss promotional banner">
                        <AppIcons.Close className="h-4 w-4"/>
                    </button>
                </div>
            )}
            <header className={`sticky top-0 bg-background/80 backdrop-blur-lg z-50 transition-shadow ${isHeaderScrolled ? 'shadow-md shadow-slate-900/5' : ''}`}>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
                    <Link to="/" className="flex items-center gap-3">
                        <AppIcons.Logo className="h-8 w-8 text-primary-500" />
                        <span className="text-xl font-bold">Clienn CRM</span>
                    </Link>
                    <nav aria-label="Main navigation" className="hidden md:flex items-center gap-8">
                        {navLinks.map(link => (
                            <Link key={link.text} to={link.to} className="text-sm font-semibold text-subtle hover:text-on-surface transition-colors">{link.text}</Link>
                        ))}
                    </nav>
                    <div className="flex items-center gap-2">
                        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-muted text-subtle hover:text-on-surface">
                            {theme === 'dark' ? <AppIcons.Sun className="h-5 w-5" /> : <AppIcons.Moon className="h-5 w-5" />}
                        </button>
                        <div className="flex items-center gap-4">
                            <Link to="/login" className="text-sm font-semibold text-primary-500 hover:text-primary-600">Log In</Link>
                            <Link to="/login" className="hidden sm:block px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors">
                                Start Free Trial
                            </Link>
                        </div>
                        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 md:hidden">
                            <AppIcons.Menu className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                 <div className="fixed inset-0 bg-background z-50 flex flex-col p-4">
                    <div className="flex justify-between items-center mb-8">
                        <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3">
                            <AppIcons.Logo className="h-8 w-8 text-primary-500" />
                            <span className="text-xl font-bold">Clienn CRM</span>
                        </Link>
                        <button onClick={() => setIsMobileMenuOpen(false)} className="p-2">
                            <AppIcons.Close className="h-6 w-6" />
                        </button>
                    </div>
                    <nav className="flex flex-col gap-4">
                         {navLinks.map(link => (
                            <MobileNavLink key={link.text} to={link.to} onClick={() => setIsMobileMenuOpen(false)}>{link.text}</MobileNavLink>
                        ))}
                    </nav>
                    <div className="mt-auto pt-8 border-t border-muted space-y-4">
                        <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center px-4 py-3 text-lg font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors">
                            Start Free Trial
                        </Link>
                    </div>
                </div>
            )}

            <main>
                <Outlet />
            </main>
            <footer className="bg-surface border-t border-muted">
                 <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8">
                        <div className="col-span-full lg:col-span-2 mb-8 lg:mb-0 pr-8">
                             <div className="flex items-center gap-3">
                                <AppIcons.Logo className="h-8 w-8 text-primary-500" />
                                <span className="text-xl font-bold">Clienn CRM</span>
                            </div>
                            <p className="mt-4 text-sm text-subtle">{content.footer.description}</p>
                            <p className="mt-4 text-sm text-subtle">{content.footer.address}</p>
                        </div>
                        {content.footer.columns.map(col => (
                             <div key={col.title}>
                                <h3 className="font-semibold text-on-surface uppercase tracking-wider text-sm">{col.title}</h3>
                                <ul className="mt-4 space-y-3 text-sm">
                                    {col.links.map(link => {
                                        const { url, text } = link;
                                        if (url.startsWith('/#/')) {
                                            const path = url.substring(2);
                                            return <li key={text}><Link to={path ? `/${path}` : '/'} className="text-subtle hover:text-on-surface transition-colors">{text}</Link></li>;
                                        }
                                        if (url.startsWith('/') && !url.startsWith('//')) {
                                            // Handle internal routes like /privacy, /pricing, etc.
                                            return <li key={text}><Link to={url} className="text-subtle hover:text-on-surface transition-colors">{text}</Link></li>;
                                        }
                                        if (url.startsWith('#') && url.length > 1) {
                                            const path = `/${url}`;
                                            return <li key={text}><Link to={path} className="text-subtle hover:text-on-surface transition-colors">{text}</Link></li>;
                                        }
                                        // For external links or simple '#'
                                        return <li key={text}><a href={url} className="text-subtle hover:text-on-surface transition-colors">{text}</a></li>;
                                    })}
                                </ul>
                            </div>
                        ))}
                    </div>
                    <div className="mt-12 pt-8 border-t border-muted flex flex-col sm:flex-row justify-between items-center text-sm">
                        <div className="flex items-center gap-4 text-subtle order-2 sm:order-1 mt-4 sm:mt-0">
                            <p>{content.footer.legal.copyright}</p>
                            {content.footer.legal.links.map(link => (
                                <a key={link.text} href={link.url} className="hover:text-on-surface transition-colors">{link.text}</a>
                            ))}
                        </div>
                         <div className="flex gap-4 order-1 sm:order-2">
                            {content.footer.socialLinks.map(link => (
                                <a key={link.name} href={link.url} className="text-subtle hover:text-on-surface transition-colors">
                                    {socialIcons[link.name as keyof typeof socialIcons]}
                                    <span className="sr-only">{link.name}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PublicLayout;


