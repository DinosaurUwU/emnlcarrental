"use client";
import React, { useState, useEffect } from "react";
import "./WhyChooseUs.css";

function WhyChooseUs() {
  const reasons = [
    {
      img: "/assets/images/image1.png",
      icon: "/assets/service.png",
      title: (
        <span className="title-span">
          <span className="first-letter">E</span>xceptional Service
        </span>
      ),
      desc: "At EMNL, we go the extra mile to ensure you have a seamless and enjoyable experience in Leyte, providing dedicated assistance every step of the way.",
    },
    {
      img: "/assets/images/image2.jpg",
      icon: "/assets/quality.png",
      title: (
        <span className="title-span">
          <span className="first-letter">M</span>odern Fleet
        </span>
      ),
      desc: "Our Leyte fleet features the latest models, offering top-tier safety, comfort, and performance for travelers seeking reliability and style on the road.",
    },
    {
      img: "/assets/images/image3.jpg",
      icon: "/assets/support.png",
      title: (
        <span className="title-span">
          <span className="first-letter">N</span>on-stop Support
        </span>
      ),
      desc: "Here at EMNL, our dedicated team provides 24/7 assistance for all your rental needs, ensuring help is always available whenever you need it most.",
    },
    {
      img: "/assets/images/image3.jpg",
      icon: "/assets/location.png",
      title: (
        <span className="title-span">
          <span className="first-letter">L</span>ocal Expertise
        </span>
      ),
      desc: "With deep knowledge of Leyte roads, EMNL ensures safe and reliable journeys by guiding you with the best routes, insights, and local recommendations.",
    },
  ];

  const letters = ["E", "M", "N", "L"];

  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;

    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % reasons.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isHovered, reasons.length]);

  return (
    <section className="why-choose-us">
      <h2>Why Choose Us</h2>
      <p>Discover what sets us apart from the competition.</p>

      <div className="reasons">
        {reasons.map((reason, index) => (
          <div
            key={index}
            className={`reason ${activeIndex === index ? "expanded" : ""}`}
            onMouseEnter={() => {
              setActiveIndex(index);
              setIsHovered(true);
            }}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div
              className={`reason-overlay letter-${letters[index].toLowerCase()}`}
            >
              <span>{letters[index]}</span>
            </div>

            <img src={reason.img} alt={reason.title} className="reason-bg" />
            <div className="reason-content">
              <img src={reason.icon} alt="Icon" className="reason-icon" />
              <h3>{reason.title}</h3>
              <p className={activeIndex === index ? "show" : ""}>
                {reason.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default WhyChooseUs;
