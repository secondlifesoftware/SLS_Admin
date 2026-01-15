import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-left">
            <p className="footer-company">Second Life Software LLC</p>
          </div>
          <div className="footer-right">
            <a href="mailto:info@secondlifesoftware.com" className="footer-email">
              info@secondlifesoftware.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

