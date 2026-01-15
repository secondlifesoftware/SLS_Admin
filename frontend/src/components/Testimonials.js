import React from 'react';
import './Testimonials.css';

const Testimonials = () => {
  const testimonials = [
    {
      quote: "Second Life Software helped us build exactly what we needed. The team was responsive, professional, and delivered on time.",
      author: "Sarah Chen",
      role: "Founder",
      company: "Tech Startup",
      avatar: "SC"
    },
    {
      quote: "Working with Second Life Software was a great experience. They understood our vision and brought it to life.",
      author: "Michael Johnson",
      role: "Product Manager",
      company: "Growing Company",
      avatar: "MJ"
    },
    {
      quote: "The quality of work exceeded our expectations. We'll definitely work with them again on future projects.",
      author: "Emily Rodriguez",
      role: "CTO",
      company: "Innovation Labs",
      avatar: "ER"
    }
  ];

  return (
    <section className="testimonials">
      <div className="testimonials-container">
        <div className="testimonials-header">
          <h2 className="testimonials-title">Trusted by teams like yours</h2>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card">
              <p className="testimonial-text">"{testimonial.quote}"</p>
              <div className="testimonial-author">
                <div className="author-avatar">{testimonial.avatar}</div>
                <div className="author-info">
                  <div className="author-name">{testimonial.author}</div>
                  <div className="author-role">{testimonial.role}, {testimonial.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
