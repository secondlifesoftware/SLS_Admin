import React from 'react';
import './About.css';
import { FaBrain, FaUser, FaChartLine } from 'react-icons/fa';

const About = () => {
  return (
    <section className="about">
      <div className="container">
        <div className="about-header">
          <div className="about-tags">
            <div className="tag">
              <FaBrain className="tag-icon" />
              <span>Founders</span>
            </div>
            <div className="tag">
              <FaUser className="tag-icon" />
              <span>Teams</span>
            </div>
            <div className="tag">
              <FaChartLine className="tag-icon" />
              <span>Businesses</span>
            </div>
          </div>
          <p className="about-slogan">
            We help you bring your vision to life with clean, functional software
          </p>
        </div>

        <div className="about-content">
          <div className="about-left">
            <div className="iphone-mockup">
              <div className="iphone-screen">
                <div className="iphone-status-bar">
                  <span className="time">4:41</span>
                  <div className="signal-bars">
                    <div className="bar"></div>
                    <div className="bar"></div>
                    <div className="bar"></div>
                    <div className="bar"></div>
                  </div>
                </div>
                <div className="iphone-header">
                  <span className="contact-name">Second Life Software</span>
                </div>
                <div className="iphone-messages">
                  <div className="message message-outgoing">
                    I have an app idea
                  </div>
                  <div className="message message-incoming">
                    We can build it
                  </div>
                  <div className="message-time">Today 4:57 PM</div>
                  <div className="message message-outgoing">
                    I need help automating
                  </div>
                  <div className="message message-incoming">
                    Well we can do that too
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="about-right">
            <div className="experience-box">
              <p>
                We bring years of experience working at top tech companies to every project — from fast-moving startups to complex enterprise systems.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;

