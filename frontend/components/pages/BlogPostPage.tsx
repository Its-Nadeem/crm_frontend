
import React, { useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BlogPost, User } from '../../types';
import { AppIcons } from '../ui/Icons';

interface BlogPostPageProps {
    blogPosts: BlogPost[];
    users: User[];
}

const RelatedPostCard: React.FC<{ post: BlogPost; author?: User }> = ({ post, author }) => (
    <Link to={`/blog/${post.slug}`} className="group block">
        <div className="overflow-hidden rounded-lg">
            <img src={post.featuredImage.src} alt={post.featuredImage.alt} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
        <h3 className="mt-4 text-lg font-bold group-hover:text-primary-500 transition-colors">{post.title}</h3>
        <div className="mt-3 flex items-center gap-2 text-xs text-subtle">
            <img src={author?.avatar} alt={author?.name} className="w-6 h-6 rounded-full object-cover" />
            <span>{author?.name}</span>
            <span>&bull;</span>
            <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>
    </Link>
);


const BlogPostPage: React.FC<BlogPostPageProps> = ({ blogPosts, users }) => {
    const { slug } = useParams<{ slug: string }>();
    const post = blogPosts.find(p => p.slug === slug);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (post) {
            document.title = post.seo.title;
        }
    }, [post]);

    const relatedPosts = useMemo(() => {
        if (!post) return [];
        return blogPosts
            .filter(p => p.id !== post.id && p.tags.some(tag => post.tags.includes(tag)))
            .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
            .slice(0, 3);
    }, [post, blogPosts]);

    if (!post) {
        return (
            <div className="text-center py-20">
                <h1 className="text-3xl font-bold">Post not found</h1>
                <Link to="/blog" className="mt-4 inline-block text-primary-500 hover:underline">
                    &larr; Back to all posts
                </Link>
            </div>
        );
    }

    const author = users.find(u => u.id === post.authorId);

    const socialShareLinks = {
        twitter: `https://twitter.com/intent/tweet?url=${window.location.href}&text=${encodeURIComponent(post.title)}`,
        linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${window.location.href}&title=${encodeURIComponent(post.title)}&summary=${encodeURIComponent(post.excerpt)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`,
    };


    return (
        <article className="bg-surface">
            <header className="relative py-24 sm:py-32 lg:py-40">
                <div className="absolute inset-0">
                    <img src={post.featuredImage.src} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/80 to-transparent"></div>
                </div>
                <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center">
                    <div className="flex justify-center gap-2">
                        {post.tags.map(tag => (
                            <Link key={tag} to={`/blog?category=${tag}`} className="bg-white/10 backdrop-blur-sm text-on-surface text-xs font-bold px-2.5 py-1 rounded-full border border-white/20 hover:bg-white/20 transition-colors">
                                {tag}
                            </Link>
                        ))}
                    </div>
                    <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight text-on-surface">
                        {post.title}
                    </h1>
                     <div className="mt-6 flex items-center justify-center gap-4">
                        {author && (
                             <img src={author.avatar} alt={author.name} className="w-12 h-12 rounded-full object-cover border-2 border-white/50" />
                        )}
                        <div>
                            <p className="text-sm font-semibold text-on-surface">{author?.name || 'Clienn CRM Team'}</p>
                            <p className="text-xs text-on-surface/80">
                                Published on {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </div>
            </header>
            
            <div className="py-12 sm:py-16">
                 <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
                    <div 
                        className="prose dark:prose-invert prose-lg max-w-none" 
                        style={{ whiteSpace: 'pre-wrap' }}
                    >
                        {post.content}
                    </div>

                    <div className="mt-12 pt-8 border-t border-muted text-center">
                        <h3 className="font-semibold text-on-surface">Share this post</h3>
                        <div className="flex justify-center gap-4 mt-4">
                            <a href={socialShareLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-3 bg-muted rounded-full text-subtle hover:bg-primary-500/10 hover:text-primary-500 transition-colors"><AppIcons.Twitter className="h-5 w-5" /></a>
                            <a href={socialShareLinks.linkedin} target="_blank" rel="noopener noreferrer" className="p-3 bg-muted rounded-full text-subtle hover:bg-primary-500/10 hover:text-primary-500 transition-colors"><AppIcons.LinkedIn className="h-5 w-5" /></a>
                            <a href={socialShareLinks.facebook} target="_blank" rel="noopener noreferrer" className="p-3 bg-muted rounded-full text-subtle hover:bg-primary-500/10 hover:text-primary-500 transition-colors"><AppIcons.Facebook className="h-5 w-5" /></a>
                        </div>
                    </div>

                    {relatedPosts.length > 0 && (
                        <div className="mt-16 pt-12 border-t border-muted">
                            <h2 className="text-2xl font-bold text-center">You Might Also Like</h2>
                            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {relatedPosts.map(relatedPost => (
                                    <RelatedPostCard 
                                        key={relatedPost.id} 
                                        post={relatedPost} 
                                        author={users.find(u => u.id === relatedPost.authorId)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
};

export default BlogPostPage;



