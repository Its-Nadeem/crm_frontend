import React, { useState, useEffect } from 'react';
import { AppIcons } from '../ui/Icons';
import { HomepageContent } from '../../types';
import { Link } from 'react-router-dom';

interface LoginPageProps {
    onLogin: (email: string, pass: string) => Promise<string | undefined>;
    content: HomepageContent['loginPage'];
    features: HomepageContent['features']['items'];
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, content, features }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % features.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [features.length]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        const errorMessage = await onLogin(email, password);
        if (errorMessage) {
            setError(errorMessage);
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background">
            {/* Left side - Slideshow */}
            <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-100 dark:bg-slate-900/50 relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="animate-float absolute -top-20 -left-20 w-96 h-96 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-900/50 dark:to-purple-900/50 rounded-full blur-3xl opacity-50" style={{animationDelay: '0s'}}></div>
                    <div className="animate-float absolute -bottom-20 -right-10 w-96 h-96 bg-gradient-to-r from-yellow-200 to-pink-200 dark:from-yellow-900/50 dark:to-pink-900/50 rounded-full blur-3xl opacity-50" style={{animationDelay: '3s'}}></div>
                </div>

                <div className="relative z-10">
                    <Link to="/" className="flex items-center gap-3">
                        <AppIcons.Logo className="h-8 w-8 text-primary-500" />
                        <span className="text-xl font-bold">Clienn CRM</span>
                    </Link>
                </div>
                
                <div className="relative z-10 flex flex-col items-center text-center my-auto">
                    <div className="relative w-full max-w-lg h-72 mb-8 rounded-2xl shadow-2xl overflow-hidden bg-muted">
                        {features.map((feature, index) => (
                            <img
                                key={feature.id}
                                src={feature.image.src}
                                alt={feature.image.alt}
                                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${currentSlide === index ? 'opacity-100' : 'opacity-0'}`}
                            />
                        ))}
                    </div>
                    <div className="relative h-32 w-full max-w-lg">
                         {features.map((feature, index) => (
                             <div key={feature.id} className={`absolute inset-0 transition-all duration-700 ease-in-out ${currentSlide === index ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{feature.title}</h2>
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto line-clamp-3">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="relative z-10 flex justify-center space-x-3">
                    {features.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            aria-label={`Go to slide ${index + 1}`}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${currentSlide === index ? 'bg-primary-500 scale-125' : 'bg-slate-400 dark:bg-slate-600 hover:bg-primary-300'}`}
                        />
                    ))}
                </div>
            </div>

            {/* Right side - Login form */}
            <div className="flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-sm">
                    <Link to="/" className="block text-center mb-8 group">
                        <AppIcons.Logo className="h-10 w-auto text-primary-500 mx-auto transition-transform group-hover:scale-110" />
                         <h2 className="mt-6 text-2xl font-bold text-on-surface">Welcome Back</h2>
                         <p className="text-subtle text-sm">Sign in to continue to Clienn CRM</p>
                    </Link>
                    <div className="bg-surface p-8 rounded-xl shadow-2xl border border-muted/50">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm" role="alert">
                                    {error}
                                </div>
                            )}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-subtle">Email</label>
                                <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 bg-background border border-muted rounded-md text-sm shadow-sm placeholder-subtle 
                                    focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/50 transition duration-150"
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-subtle">Password</label>
                                <div className="relative mt-1">
                                    <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)}
                                        className="block w-full px-3 py-2 bg-background border border-muted rounded-md text-sm shadow-sm placeholder-subtle 
                                        focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/50 transition duration-150"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center px-3 text-subtle">
                                        {/* FIX: AppIcons.EyeOff and AppIcons.Eye were not found, added to Icons.tsx. */}
                                        {showPassword ? <AppIcons.EyeOff className="h-5 w-5"/> : <AppIcons.Eye className="h-5 w-5"/>}
                                    </button>
                                </div>
                            </div>
                             <div className="flex items-center justify-between text-xs">
                                <a href="#" className="font-medium text-primary-600 hover:text-primary-500">Sign In with OTP</a>
                                <a href="#" className="font-medium text-primary-600 hover:text-primary-500">Forgot Password?</a>
                            </div>
                            <div>
                                <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-not-allowed">
                                    {isLoading ? 'Signing In...' : 'Sign In'}
                                </button>
                            </div>
                        </form>
                    </div>
                    <div className="mt-8 text-center text-sm text-subtle space-y-2">
                        <p>
                            Don't have an account? <Link to="/" className="font-medium text-primary-400 hover:text-primary-300">Start your free trial</Link>
                        </p>
                        <p>
                            <Link to="/" className="font-medium text-subtle hover:text-on-surface">&larr; Back to Home</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;


