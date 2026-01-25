import React from 'react';
import './Blog.css';

const Blog = () => {
  // Placeholder blog posts - in production, these would come from an API
  const blogPosts = [
    {
      id: 1,
      title: "5 Ways to Scale Your Software Development Team",
      excerpt: "Learn how to effectively scale your development team without sacrificing quality or culture.",
      date: "January 15, 2026",
      readTime: "5 min read",
      linkedIn: true
    },
    {
      id: 2,
      title: "The Future of AI in Software Development",
      excerpt: "Exploring how AI tools are transforming the way we build software and what it means for developers.",
      date: "January 10, 2026",
      readTime: "7 min read",
      linkedIn: true
    },
    {
      id: 3,
      title: "Building Maintainable Code: Best Practices",
      excerpt: "Tips and strategies for writing code that stands the test of time and is easy to maintain.",
      date: "January 5, 2026",
      readTime: "6 min read",
      linkedIn: true
    }
  ];

  return (
    <section id="blog" className="blog">
      <div className="blog-container">
        <div className="blog-header">
          <h2 className="blog-title">Blog</h2>
          <p className="blog-subtitle">
            Insights, tips, and updates from our team. Also available on <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="blog-linkedin-link">LinkedIn</a>.
          </p>
        </div>

        <div className="blog-grid">
          {blogPosts.map((post) => (
            <article key={post.id} className="blog-card">
              {post.linkedIn && (
                <div className="blog-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <span>LinkedIn</span>
                </div>
              )}
              <h3 className="blog-card-title">{post.title}</h3>
              <p className="blog-card-excerpt">{post.excerpt}</p>
              <div className="blog-card-meta">
                <span className="blog-date">{post.date}</span>
                <span className="blog-read-time">{post.readTime}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Blog;
