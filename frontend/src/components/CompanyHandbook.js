import React from 'react';
import './CompanyHandbook.css';

const CompanyHandbook = () => {
  return (
    <section className="company-handbook-section">
      <div className="handbook-container">
        <div className="handbook-sidebar">
          <div className="sidebar-header">
            <div className="workspace-btn">
              <div className="workspace-dot"></div>
              <span>Acme</span>
            </div>
            <button className="notification-btn">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 5.33333C12 4.27247 11.5786 3.25505 10.8284 2.50491C10.0783 1.75476 9.06087 1.33333 8 1.33333C6.93913 1.33333 5.92172 1.75476 5.17157 2.50491C4.42143 3.25505 4 4.27247 4 5.33333C4 10 2 11.3333 2 11.3333H14C14 11.3333 12 10 12 5.33333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9.15335 14C9.03614 14.2021 8.86791 14.3698 8.6655 14.4864C8.46309 14.6029 8.2336 14.6643 8.00001 14.6643C7.76643 14.6643 7.53694 14.6029 7.33453 14.4864C7.13212 14.3698 6.96389 14.2021 6.84668 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="sidebar-search">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="search-icon">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input type="text" placeholder="Search" />
            <button className="ask-btn">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L8.5 5.5L13 7L8.5 8.5L7 13L5.5 8.5L1 7L5.5 5.5L7 1Z" fill="currentColor"/>
              </svg>
              Ask
            </button>
          </div>

          <nav className="sidebar-nav">
            <a href="#updates" className="nav-item">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15Z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 4V8L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>Updates</span>
            </a>
            <a href="#knowledge" className="nav-item">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4L8 1L14 4V12C14 12.5304 13.7893 13.0391 13.4142 13.4142C13.0391 13.7893 12.5304 14 12 14H4C3.46957 14 2.96086 13.7893 2.58579 13.4142C2.21071 13.0391 2 12.5304 2 12V4Z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 14V7.5" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <span>Knowledge Management</span>
            </a>

            <div className="nav-section-header">MY CHANNELS</div>

            <a href="#private" className="nav-item">
              <svg className="chevron-right" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="3" y="6" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M5 6V4C5 3.46957 5.21071 2.96086 5.58579 2.58579C5.96086 2.21071 6.46957 2 7 2H9C9.53043 2 10.0391 2.21071 10.4142 2.58579C10.7893 2.96086 11 3.46957 11 4V6" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <span>My Private Channel</span>
            </a>

            <a href="#handbook" className="nav-item expanded">
              <svg className="chevron-down" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 2H10C10.5304 2 11.0391 2.21071 11.4142 2.58579C11.7893 2.96086 12 3.46957 12 4V14L8 12L4 14V4C4 3.46957 4.21071 2.96086 4.58579 2.58579C4.96086 2.21071 5.46957 2 6 2H4Z" stroke="#FF8C42" strokeWidth="1.5"/>
              </svg>
              <span>Company Handbook</span>
            </a>

            <a href="#team" className="nav-item sub-item">
              <svg className="chevron-right" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 2H10C10.5304 2 11.0391 2.21071 11.4142 2.58579C11.7893 2.96086 12 3.46957 12 4V14L8 12L4 14V4C4 3.46957 4.21071 2.96086 4.58579 2.58579C4.96086 2.21071 5.46957 2 6 2H4Z" stroke="#FF8C42" strokeWidth="1.5"/>
              </svg>
              <span>About the Team</span>
            </a>

            <a href="#policies" className="nav-item sub-item">
              <svg className="chevron-right" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="3" y="2" width="10" height="12" rx="1" stroke="#E91E8C" strokeWidth="1.5"/>
                <path d="M6 6H10M6 9H10" stroke="#E91E8C" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>Policies and Procedures</span>
            </a>

            <a href="#recruitment" className="nav-item sub-item">
              <svg className="chevron-right" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L10 5L14 6L11 9L12 13L8 11L4 13L5 9L2 6L6 5L8 1Z" stroke="#10B981" strokeWidth="1.5"/>
              </svg>
              <span>Recruitment</span>
            </a>

            <a href="#performance" className="nav-item sub-item">
              <svg className="chevron-right" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 12L5 9L8 11L14 5" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="5" cy="9" r="1" fill="#10B981"/>
                <circle cx="8" cy="11" r="1" fill="#10B981"/>
              </svg>
              <span>Performance & Development</span>
            </a>

            <a href="#monthly" className="nav-item sub-item">
              <svg className="chevron-right" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="3" y="3" width="10" height="10" rx="2" stroke="#3B82F6" strokeWidth="1.5"/>
                <path d="M7 3V1M9 3V1M3 6H13" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>Monthly Updates</span>
            </a>
          </nav>

          <div className="sidebar-quote">
            <p>"For company Wiki, this is the best."</p>
            <div className="quote-author">
              <div className="author-photo"></div>
              <div className="author-details">
                <div className="author-name">Filippo Latta</div>
                <div className="author-role">Senior People Partner at Klarx</div>
              </div>
            </div>
          </div>

          <div className="sidebar-footer">
            <div className="nav-section-header">ALL CHANNELS (21)</div>

            <a href="#insights" className="nav-item">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L9.5 5.5L14 7L9.5 8.5L8 13L6.5 8.5L2 7L6.5 5.5L8 1Z" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <span>Ask Insights</span>
            </a>

            <a href="#import" className="nav-item">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 10V13C14 13.5304 13.7893 14.0391 13.4142 14.4142C13.0391 14.7893 12.5304 15 12 15H4C3.46957 15 2.96086 14.7893 2.58579 14.4142C2.21071 14.0391 2 13.5304 2 13V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M4.5 6.5L8 10L11.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M8 10V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>Import content</span>
            </a>

            <a href="#templates" className="nav-item">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <span>Templates</span>
            </a>

            <a href="#shared" className="nav-item">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M3 14C3 11.7909 5.23858 10 8 10C10.7614 10 13 11.7909 13 14" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <span>Shared with me</span>
            </a>

            <a href="#archive" className="nav-item">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="4" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M2 4L4 2H12L14 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 8H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>Archive</span>
            </a>
          </div>
        </div>

        <div className="handbook-main">
          <div className="handbook-header">
            <div className="header-left">
              <button className="nav-arrow">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button className="nav-arrow disabled">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <span className="breadcrumb">Human Resources</span>
            </div>
            <div className="header-actions">
              <button className="action-btn">Share</button>
              <button className="icon-btn">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 5V8L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              <button className="icon-btn">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="4" r="1" fill="currentColor"/>
                  <circle cx="8" cy="8" r="1" fill="currentColor"/>
                  <circle cx="8" cy="12" r="1" fill="currentColor"/>
                </svg>
              </button>
              <button className="icon-btn">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M14 10V13C14 13.5304 13.7893 14.0391 13.4142 14.4142C13.0391 14.7893 12.5304 15 12 15H4C3.46957 15 2.96086 14.7893 2.58579 14.4142C2.21071 14.0391 2 13.5304 2 13V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4.5 6.5L8 10L11.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 10V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              <button className="icon-btn">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="4" r="1.5" fill="currentColor"/>
                  <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
                  <circle cx="8" cy="12" r="1.5" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="handbook-content">
            <div className="hero-section">
              <div className="hero-background">
                <div className="book-illustration">
                  <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="30" y="40" width="70" height="100" fill="#F5F0EB" stroke="#1a1a1a" strokeWidth="2"/>
                    <rect x="100" y="40" width="70" height="100" fill="#F5F0EB" stroke="#1a1a1a" strokeWidth="2"/>
                    <line x1="100" y1="40" x2="100" y2="140" stroke="#1a1a1a" strokeWidth="2"/>
                    <rect x="45" y="60" width="12" height="16" fill="#E8E3DC" stroke="#1a1a1a" strokeWidth="1.5"/>
                    <rect x="62" y="60" width="12" height="16" fill="#E8E3DC" stroke="#1a1a1a" strokeWidth="1.5"/>
                    <rect x="79" y="60" width="12" height="16" fill="#E8E3DC" stroke="#1a1a1a" strokeWidth="1.5"/>
                    <rect x="45" y="82" width="12" height="16" fill="#E8E3DC" stroke="#1a1a1a" strokeWidth="1.5"/>
                    <rect x="62" y="82" width="12" height="16" fill="#E8E3DC" stroke="#1a1a1a" strokeWidth="1.5"/>
                    <rect x="79" y="82" width="12" height="16" fill="#1a1a1a" stroke="#1a1a1a" strokeWidth="1.5"/>
                    <rect x="109" y="60" width="12" height="16" fill="#E8E3DC" stroke="#1a1a1a" strokeWidth="1.5"/>
                    <rect x="126" y="60" width="12" height="16" fill="#E8E3DC" stroke="#1a1a1a" strokeWidth="1.5"/>
                    <rect x="143" y="60" width="12" height="16" fill="#E8E3DC" stroke="#1a1a1a" strokeWidth="1.5"/>
                    <rect x="45" y="110" width="40" height="20" rx="2" fill="#8B7355" stroke="#1a1a1a" strokeWidth="2"/>
                    <line x1="100" y1="30" x2="100" y2="10" stroke="#1a1a1a" strokeWidth="2"/>
                    <circle cx="100" cy="5" r="6" fill="#8B5CF6" stroke="#8B5CF6" strokeWidth="2"/>
                  </svg>
                </div>

                <div className="verified-badge-green">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="6" fill="#10B981"/>
                    <path d="M4.66667 7L6.22222 8.55556L9.33333 5.44444" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Verified</span>
                  <span className="verified-date">until January 1, 2027</span>
                </div>
              </div>
            </div>

            <div className="content-main-section">
              <div className="content-left">
                <h1 className="handbook-title">Company Handbook</h1>
                <p className="handbook-description">
                  👋 Welcome to our Company Handbook, the go-to place for anything related to you and the way we work at Acme!
                </p>
                <p className="handbook-subdescription">
                  At Acme, we're all about creating a workspace everyone feels welcome and empowered. We've put together this handbook to serve two main goals: We both want clarity and ease for our team by providing solid ground rules covering most scenarios, and We aim for quality by aiming for ease.
                </p>
              </div>

              <div className="content-right">
                <div className="testimonial-box">
                  <div className="testimonial-quote">
                    <p>"The editing interface and document structure are SO good! It's definitely been the best knowledge base experience I've used."</p>
                  </div>
                  <div className="testimonial-author">
                    <div className="author-avatar">
                      <div className="avatar-gradient"></div>
                    </div>
                    <div className="author-info">
                      <div className="author-name">Martin Harmer</div>
                      <div className="author-title">VP of Friendster</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="fast-track-section">
              <h2 className="section-title">Fast Track Links</h2>
              <div className="fast-track-grid">
                <a href="#" className="track-card">
                  <div className="track-icon" style={{background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)'}}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <rect x="3" y="3" width="14" height="14" rx="2" stroke="#1976D2" strokeWidth="1.5"/>
                      <path d="M7 3V1M13 3V1M3 7H17" stroke="#1976D2" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span className="track-text">Company Inbox</span>
                </a>

                <a href="#" className="track-card">
                  <div className="track-icon" style={{background: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)'}}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <rect x="3" y="5" width="14" height="12" rx="2" stroke="#F57C00" strokeWidth="1.5"/>
                      <path d="M7 9H13M7 13H10" stroke="#F57C00" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span className="track-text">Op Dash</span>
                </a>

                <a href="#" className="track-card">
                  <div className="track-icon" style={{background: 'linear-gradient(135deg, #FCE4EC 0%, #F8BBD0 100%)'}}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="7" stroke="#C2185B" strokeWidth="1.5"/>
                      <path d="M10 6V10L13 13" stroke="#C2185B" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span className="track-text">Performance Review Process</span>
                </a>

                <a href="#" className="track-card">
                  <div className="track-icon" style={{background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)'}}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M4 6L10 3L16 6V14C16 15.1046 15.1046 16 14 16H6C4.89543 16 4 15.1046 4 14V6Z" stroke="#388E3C" strokeWidth="1.5"/>
                      <path d="M10 16V10" stroke="#388E3C" strokeWidth="1.5"/>
                    </svg>
                  </div>
                  <span className="track-text">Request a Part & Review Book</span>
                </a>
              </div>
            </div>

            <div className="company-updates-section">
              <h2 className="section-title">Company-Wide Updates</h2>
              <div className="updates-container">
                <a href="#" className="update-card">
                  <div className="update-date-badge">Dec 15</div>
                  <div className="update-content">
                    <p>Don't forget to join the Kickstarted channel in Slack</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="handbook-footer-brands">
        <div className="brand-logo brand-acme">ACME</div>
        <div className="brand-logo brand-soc">SOC 2</div>
        <div className="brand-logo brand-certified">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="12" fill="#FFD700" stroke="#FFA500" strokeWidth="2"/>
            <path d="M14 4L16.5 11H24L18 15.5L20.5 22.5L14 18L7.5 22.5L10 15.5L4 11H11.5L14 4Z" fill="#FFA500"/>
          </svg>
        </div>
        <div className="brand-logo brand-badge">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="#333" strokeWidth="2"/>
            <path d="M10 16L14 20L22 12" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </section>
  );
};

export default CompanyHandbook;
