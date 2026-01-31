"use client";
import React from "react";
import "./HowItWorks.css";

function HowItWorks() {
  return (
    <section className="how-it-works">
      <h2>How It Works</h2>
      <p>
        Experience a seamless journey from selection to service with our
        streamlined process. Here's how it works:
      </p>
      <div className="steps">
        {/* Step 1 */}
        <div className="step-container">
          <div className="step-image">
            <img
              src="/assets/images/step1.png"
              alt="Step 1"
              className="step-background"
            />
            <div className="step-overlay">
              <span>1</span>
            </div>
          </div>

          <div className="step-content">
            <div className="step-header">
              <img
                src="/assets/step1.png"
                alt="Step 1 Icon"
                className="step-icon-left"
              />
              <h3>Pick Your Ride</h3>
            </div>
            <p>
              Discover our fleet of reliable vehicles tailored for Leyte
              adventures and daily needs.
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="step-container">
          <div className="step-image">
            <img
              src="/assets/images/step2.png"
              alt="Step 2"
              className="step-background"
            />
            <div className="step-overlay">
              <span>2</span>
            </div>
          </div>
          <div className="step-content">
            <div className="step-header">
              <img
                src="/assets/step2.png"
                alt="Step 2 Icon"
                className="step-icon-left"
              />
              <h3>Book Online</h3>
            </div>
            <p>
              Use our simple online system to reserve your perfect vehicle from
              EMNL.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="step-container">
          <div className="step-image">
            <img
              src="/assets/images/step3.png"
              alt="Step 3"
              className="step-background"
            />
            <div className="step-overlay">
              <span>3</span>
            </div>
          </div>
          <div className="step-content">
            <div className="step-header">
              <img
                src="/assets/step3.png"
                alt="Step 3 Icon"
                className="step-icon-left"
              />
              <h3>Hit the Road</h3>
            </div>
            <p>
              Pick up from our Leyte location and enjoy your journey with
              confidence.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
