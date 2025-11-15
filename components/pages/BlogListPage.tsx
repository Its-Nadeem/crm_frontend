
import React, { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BlogPost, User } from '../../types';

interface BlogListPageProps {
    blogPosts: BlogPost[];
    users: User[];
}

const BlogCard: React.FC<{ post: BlogPost; author?: User }> = ({ post, author }) => (
    <Link to={`/blog/${post.slug}`} className="group block bg-surface rounded-xl shadow-lg border border-muted/50 hover:shadow-primary-500/10 transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
        <div className="overflow-hidden">
            <img src={post.featuredImage.src} alt={post.featuredImage.alt} className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
        <div className="p-6">
            <p className="text-sm text-primary-500 font-semibold">{post.tags.join(' • ')}</p>
            <h3 className="mt-2 text-xl font-bold text-on-surface group-hover:text-primary-500 transition-colors">{post.title}</h3>
            <p className="mt-3 text-sm text-subtle line-clamp-3">{post.excerpt}</p>
            <div className="mt-6 flex items-center gap-3">
                <img src={author?.avatar} alt={author?.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                    <p className="text-sm font-semibold text-on-surface">{author?.name}</p>
                    <p className="text-xs text-subtle">{new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </div>
        </div>
    </Link>
);

const BlogListPage: React.FC<BlogListPageProps> = ({ blogPosts, users }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const categoryFilter = searchParams.get('category');

    const [selectedTag, setSelectedTag] = useState<string | null>(categoryFilter);

    useEffect(() => {
        setSelectedTag(categoryFilter);
    }, [categoryFilter]);

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        blogPosts.forEach(post => {
            post.tags.forEach(tag => tags.add(tag));
        });
        return Array.from(tags).sort();
    }, [blogPosts]);

    const handleTagClick = (tag: string | null) => {
        if (tag) {
            setSearchParams({ category: tag });
        } else {
            setSearchParams({});
        }
    };

    const filteredPosts = useMemo(() => {
        const sorted = [...blogPosts].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        if (!selectedTag) {
            return sorted;
        }
        return sorted.filter(post => post.tags.includes(selectedTag));
    }, [blogPosts, selectedTag]);

    const featuredPost = filteredPosts[0];
    const otherPosts = filteredPosts.slice(1);

    const getAuthor = (authorId: number) => users.find(u => u.id === authorId);

    return (
        <div className="py-12 sm:py-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold tracking-tight">Clienn CRM Blog</h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-subtle">
                        Insights, strategies, and tips on sales, marketing automation, and business growth.
                    </p>
                </div>

                {/* Category Filter */}
                <nav className="mb-12 flex flex-wrap justify-center gap-2">
                    <button
                        onClick={() => handleTagClick(null)}
                        className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${!selectedTag ? 'bg-primary-600 text-white' : 'bg-surface text-on-surface hover:bg-muted'}`}
                    >
                        All Posts
                    </button>
                    {allTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => handleTagClick(tag)}
                            className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${selectedTag === tag ? 'bg-primary-600 text-white' : 'bg-surface text-on-surface hover:bg-muted'}`}
                        >
                            {tag}
                        </button>
                    ))}
                </nav>

                {/* Featured Post */}
                {featuredPost && (
                    <section className="mb-16">
                        <Link to={`/blog/${featuredPost.slug}`} className="group grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-surface p-8 rounded-2xl shadow-xl border border-muted/50 hover:shadow-primary-500/10 transition-shadow duration-300">
                            <div className="overflow-hidden rounded-lg">
                                <img src={featuredPost.featuredImage.src} alt={featuredPost.featuredImage.alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            </div>
                            <div>
                                <p className="text-sm text-primary-500 font-semibold">{featuredPost.tags.join(' • ')}</p>
                                <h2 className="mt-4 text-3xl font-bold text-on-surface group-hover:text-primary-500 transition-colors">{featuredPost.title}</h2>
                                <p className="mt-4 text-base text-subtle line-clamp-4">{featuredPost.excerpt}</p>
                                <div className="mt-6 flex items-center gap-3">
                                    <img src={getAuthor(featuredPost.authorId)?.avatar} alt={getAuthor(featuredPost.authorId)?.name} className="w-12 h-12 rounded-full object-cover" />
                                    <div>
                                        <p className="text-sm font-semibold text-on-surface">{getAuthor(featuredPost.authorId)?.name}</p>
                                        <p className="text-xs text-subtle">{new Date(featuredPost.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </section>
                )}

                {/* Other Posts */}
                <section>
                     {otherPosts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {otherPosts.map(post => (
                                <BlogCard key={post.id} post={post} author={getAuthor(post.authorId)} />
                            ))}
                        </div>
                    ) : featuredPost ? null : (
                         <div className="text-center py-16 bg-surface rounded-lg">
                            <h3 className="text-xl font-semibold">No posts found</h3>
                            <p className="text-subtle mt-2">There are no blog posts in the "{selectedTag}" category yet.</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default BlogListPage;



