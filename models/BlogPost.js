import mongoose from 'mongoose';

const blogPostSchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    excerpt: { type: String },
    content: { type: String, required: true },
    authorId: { type: Number, required: true },
    tags: [String],
    featuredImage: {
        src: String,
        alt: String,
    },
    seo: {
        title: String,
        description: String,
    },
    views: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
}, { timestamps: true }); // uses createdAt for publishedAt

const BlogPost = mongoose.model('BlogPost', blogPostSchema);

export default BlogPost;



