"use client";
import React, { useEffect, useRef, useState } from "react";
import { useUser } from "../lib/UserContext";
import Header from "../component/Header";
import Footer from "../component/Footer";
import "./About.css";

function About({ openBooking }) {
  const { fetchImageFromFirestore } = useUser();
  const [aboutBackground, setAboutBackground] = useState("");
const [isLoading, setIsLoading] = useState(true);
  const aboutSectionRef = useRef(null);
  const contentRef = useRef(null);

  // useEffect(() => {
  //   const fetchAboutBackground = async () => {
  //     const result = await fetchImageFromFirestore("AboutPage_0");
  //     if (result) {
  //       setAboutBackground(result.base64);
  //     }
  //   };
  //   fetchAboutBackground();
  // }, [fetchImageFromFirestore]);

   useEffect(() => {
    const fetchAboutBackground = async () => {
      const result = await fetchImageFromFirestore("AboutPage_0");
      if (result) {
        setAboutBackground(result.base64);
      }
      setIsLoading(false); // Always stop loading
    };
    fetchAboutBackground();
  }, [fetchImageFromFirestore]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;

      // Parallax effect for about section background
      if (aboutSectionRef.current) {
        aboutSectionRef.current.style.backgroundPositionY = `${scrollPosition * 0.5}px`;
      }

      // Parallax effect for content section (slower scroll)
      if (contentRef.current) {
        contentRef.current.style.transform = `translateY(${scrollPosition * 0.5}px)`;
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="aboutPage-container">
      <Header openBooking={openBooking} />

      {/* About Section with Background */}
      <div
        className="about-section"
        ref={aboutSectionRef}
        style={{
  backgroundImage: aboutBackground
    ? `url(${aboutBackground})`
    : 'url(/assets/images/about.png)',
}}
      >
        <div className="gradient-overlay"></div>
        <div className="content" ref={contentRef}>
          <img src="/assets/white-logo.png" alt="Logo" className="about-logo" />
          <h1>About Us</h1>
          <p>
            EMNL provides convenient and reliable car rentals here in Leyte. Our
            fleet includes small cars, vans, and larger units suited for daily
            travel, family trips, and business use across the province.
          </p>
          <p>
            We focus on good service, well-maintained units, and clear pricing.
            Whether you're going around town or traveling across Leyte, we’re
            here to make your trip smooth and comfortable.
          </p>
        </div>
      </div>

      {/* Team Section */}
      <section className="team-section">
        <h2>Meet Our Team</h2>
        <div className="team-members">
          {/* CEO */}
          <div className="team-member">
            <div className="team-square">
              <img src="/assets/images/ceo.png" alt="CEO" />
            </div>
            <div className="team-info">
              <h3>Emmanuel</h3>
              <p className="role">CEO</p>
              <p className="motto">
                "As the CEO, Emmanuel leads with vision and determination to
                steer EMNL into the future of seamless travel."
              </p>
            </div>
          </div>

          {/* Manager */}
          <div className="team-member right-aligned">
            <div className="team-info">
              <h3>Aron</h3>
              <p className="role">Operations Manager</p>
              <p className="motto">
                "Aron ensures that all operations at EMNL run like a well-oiled
                machine, delivering a flawless experience for customers."
              </p>
            </div>
            <div className="team-square">
              <img src="/assets/images/manager.png" alt="Manager" />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default About;
