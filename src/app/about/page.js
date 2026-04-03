"use client";
import React, { useEffect, useRef, useState, useMemo } from "react";
import { useUser } from "../lib/UserContext";
import Header from "../component/Header";
import Footer from "../component/Footer";
import "./About.css";

function About({ openBooking }) {
  const { fetchImageFromFirestore, imageCache, imageUpdateTrigger } = useUser();

  const aboutSectionRef = useRef(null);
  const contentRef = useRef(null);

  const aboutFallback = "/assets/images/about.png";

  const aboutCachedSrc = useMemo(
    () => imageCache["AboutPage_0"]?.base64 || aboutFallback,
    [imageCache],
  );

  const [aboutBackground, setAboutBackground] = useState(aboutCachedSrc);

  // instant from cache
  useEffect(() => {
    setAboutBackground(aboutCachedSrc);
  }, [aboutCachedSrc]);

  // background revalidate (fresh from Firestore)
  useEffect(() => {
    let cancelled = false;

    const fetchAboutBackground = async () => {
      const result = await fetchImageFromFirestore("AboutPage_0", false);
      if (!cancelled && result?.base64) {
        setAboutBackground(result.base64);
      }
    };

    fetchAboutBackground();
    return () => {
      cancelled = true;
    };
  }, [fetchImageFromFirestore, imageUpdateTrigger]);

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
            : "url(/assets/images/about.png)",
        }}
      >
        <div className="gradient-overlay"></div>
        <div className="content" ref={contentRef}>
          <img src="/assets/white-logo.png" alt="Logo" className="about-logo" />
          <h1>About Us</h1>
          <p>
            EMNL CAR RENTAL SERVICES is one of the pioneering and leading car
            rental in Ormoc City, Leyte, with the goal of providing quality car
            rental and outstanding customer service for companies, tourist, and
            individuals. Our fleet includes small cars, vans, and larger units
            suited for daily travel, family trips, and business use across the
            province.
          </p>
          <p>
            We focus on good service, well-maintained units, and clear pricing.
            Whether you're going around town or traveling across Leyte, we’re
            here to make your trip smooth and comfortable.
          </p>
        </div>
      </div>

      {/* Mission & Vision Section */}
      <section className="about-mission-vision-section">
        <div className="about-mv-container">
          <div className="about-mv-block">
            <h2>Our Mission</h2>
            <p>
              At EMNL Car Rental Services, our mission is to provide reliable,
              convenient, and affordable transportation solutions across Leyte.
              We are committed to delivering exceptional customer service,
              maintaining a fleet of well-serviced vehicles, and ensuring a
              hassle-free rental experience for every client, whether you're a
              tourist, a business traveler, or a local resident.
            </p>
          </div>
          <div className="about-mv-block">
            <h2>Our Vision</h2>
            <p>
              To be the most trusted car rental service in Leyte, recognized for
              our commitment to quality, transparency, and customer
              satisfaction. We strive to make every journey smooth and
              memorable, building lasting relationships with our clients and
              contributing to the region's tourism and transportation needs.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="about-why-choose-section">
        <h2>Why Choose EMNL</h2>
        <div className="about-why-choose-grid">
          <div className="about-why-choose-card">
            <h3>We're Here for You</h3>
            <p>
              Our friendly and professional team is always ready to assist you
              with any questions or concerns. From the moment you book until you
              return the vehicle, we're dedicated to ensuring your car rental
              experience in Leyte is smooth and worry-free.
            </p>
          </div>
          <div className="about-why-choose-card">
            <h3>Transparent Process</h3>
            <p>
              We've designed our rental process to be clear and straightforward.
              Browse our vehicle selection, make your reservation, and either
              pick up your car from our location or have it delivered directly
              to you—no hidden fees, no surprises.
            </p>
          </div>
          <div className="about-why-choose-card">
            <h3>Corporate Solutions</h3>
            <p>
              For businesses with unique transportation needs, we offer tailored
              corporate services. From scheduled business transfers and
              executive fleet options to short and long-term leasing agreements,
              we keep your team mobile and professional.
            </p>
          </div>
          <div className="about-why-choose-card">
            <h3>Local Expertise</h3>
            <p>
              As a homegrown Leyte car rental service, we know the area inside
              and out. We can recommend the best routes, scenic spots, and
              must-visit destinations to make the most of your time in the
              region.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="about-cta-section">
        <div className="about-cta-content">
          <h2>Ready to Explore Leyte?</h2>
          <p>
            Join countless satisfied customers who have discovered the
            convenience and quality of EMNL Car Rental Services. Whether you're
            planning a family getaway, a business trip, or simply need reliable
            transportation, we're here to get you where you need to go.
          </p>
          <p className="about-cta-note">
            We look forward to serving you and making your Leyte adventure an
            unforgettable one.
          </p>
        </div>
      </section>

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

// {/* Team Section */}
// <section className="team-section">
//   <h2>Meet Our Team</h2>
//   <div className="team-members">
//     {/* CEO */}
//     <div className="team-member">
//       <div className="team-square">
//         <img src="/assets/images/ceo.png" alt="CEO" />
//       </div>
//       <div className="team-info">
//         <h3>Emmanuel</h3>
//         <p className="role">CEO</p>
//         <p className="motto">
//           "As the CEO, Emmanuel leads with vision and determination to
//           steer EMNL into the future of seamless travel."
//         </p>
//       </div>
//     </div>

//     {/* Manager */}
//     <div className="team-member right-aligned">
//       <div className="team-info">
//         <h3>Aron</h3>
//         <p className="role">Operations Manager</p>
//         <p className="motto">
//           "Aron ensures that all operations at EMNL run like a well-oiled
//           machine, delivering a flawless experience for customers."
//         </p>
//       </div>
//       <div className="team-square">
//         <img src="/assets/images/manager.png" alt="Manager" />
//       </div>
//     </div>
//   </div>
// </section>

// <Footer />
