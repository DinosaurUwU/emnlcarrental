"use client";
import React, { useEffect, useRef, useState } from "react";
import Header from "./component/Header";
import Carousel from "./Carousel";
import OurFleet from "./OurFleet";
import HowItWorks from "./HowItWorks";
// import SpecialOffers from './SpecialOffers';
import WhyChooseUs from "./WhyChooseUs";
import CustomerTestimonials from "./CustomerTestimonials";
import CompanyMap from "./CompanyMap";
import Footer from "./component/Footer";
import { useBooking } from "./component/BookingProvider";
import { useUser } from "./lib/UserContext";
import { useRouter } from "next/navigation";

import "./LandingPage.css";
import "./Carousel.css";
import "./OurFleet.css";
import "./HowItWorks.css";
import "./SpecialOffers.css";
import "./WhyChooseUs.css";
import "./CustomerTestimonials.css";
import "./CompanyMap.css";
import "./component/Footer.css";

function LandingPage() {
  const { openBooking } = useBooking();

const hiddenButtonRef = useRef(null);
const router = useRouter();

    const {

      user,

    } = useUser();

  const carouselRef = useRef(null);
  const specialOffersRef = useRef(null);
  const [showButtons, setShowButtons] = useState(false);

  const customerTestimonialsRef = useRef(null);

  // Refs for the images
  const everestRef = useRef(null);
  const avanzaRef = useRef(null);
  const viosRef = useRef(null);
  const hiaceRef = useRef(null);

  const readyRef = useRef(null);
  const toHitTheRef = useRef(null);
  const roadRef = useRef(null);

  const [showReady, setShowReady] = useState(false);
  const [showToHitThe, setShowToHitThe] = useState(false);
  const [showRoad, setShowRoad] = useState(false);

  const [showImages, setShowImages] = useState(false);

  const [scrollProgress, setScrollProgress] = useState(0);


  

useEffect(() => {
  const checkPendingBookingAndOpenOverlay = async () => {
    if (!user?.uid || !openBooking) return;

    const pendingData = localStorage.getItem(`pendingBookingData_${user.uid}`);
    
    if (pendingData) {
      try {
        const data = JSON.parse(pendingData);
        localStorage.removeItem(`pendingBookingData_${user.uid}`);
        
        console.log("📝 Found pending booking data from guest session, opening overlay...");
        
        // Build prefill data from saved booking
        const prefillData = {
          firstName: data.formData?.firstName || "",
          middleName: data.formData?.middleName || "",
          surname: data.formData?.surname || "",
          email: data.formData?.email || "",
          contact: data.formData?.contactNo || "",
          location: data.formData?.location || "",
          occupation: data.formData?.occupation || "",
          address: data.formData?.address || "",
          dropoffLocation: data.formData?.dropoffLocation || "",
          purpose: data.formData?.purpose || "",
          referralSource: data.formData?.referralSource || "",
          carType: data.selectedCarType || "ALL",
          carName: data.selectedCarId || "",
          drivingOption: data.driveType || "Self-Drive",
          pickupOption: data.dropOffType || "Pickup",
          startDate: data.startDate || "",
          startTime: data.startTime || "",
          endDate: data.endDate || "",
          endTime: data.endTime || "",
          driverLicense: data.uploadedID || "",
        };
        
        // Call openBooking directly - it will center the overlay since no event
        openBooking(null, prefillData);
      } catch (error) {
        console.error("Error parsing pending booking data:", error);
      }
    }
  };

  const timer = setTimeout(() => {
    checkPendingBookingAndOpenOverlay();
  }, 500);

  return () => clearTimeout(timer);
}, [user, openBooking]);








  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.pageYOffset;

      // Parallax effect for Carousel
      if (carouselRef.current) {
        carouselRef.current.style.transform = `translateY(${
          scrollPosition * 0.5
        }px)`;
      }

      // Parallax effect for SpecialOffers (slower scroll)
      if (specialOffersRef.current) {
        specialOffersRef.current.style.backgroundPositionY = `${
          -scrollPosition * 0.5
        }px`;
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowReady(entry.isIntersecting);
      },
      { threshold: 0.5 },
    );

    if (customerTestimonialsRef.current) {
      observer.observe(customerTestimonialsRef.current);
    }

    return () => {
      if (customerTestimonialsRef.current) {
        observer.unobserve(customerTestimonialsRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowToHitThe(entry.isIntersecting);
      },
      { threshold: 0.05 },
    );

    if (customerTestimonialsRef.current) {
      observer.observe(customerTestimonialsRef.current);
    }

    return () => {
      if (customerTestimonialsRef.current) {
        observer.unobserve(customerTestimonialsRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowRoad(entry.isIntersecting);
      },
      { threshold: 0.005 },
    );

    if (customerTestimonialsRef.current) {
      observer.observe(customerTestimonialsRef.current);
    }

    return () => {
      if (customerTestimonialsRef.current) {
        observer.unobserve(customerTestimonialsRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Observer for customer testimonials (showButtons)
    const buttonObserver = new IntersectionObserver(
      (entries) => {
        setShowButtons(entries[0].isIntersecting); // Trigger showButtons
      },
      { threshold: 0.01 }, // Threshold for buttons
    );

    // Observe the customer testimonials section
    if (customerTestimonialsRef.current) {
      buttonObserver.observe(customerTestimonialsRef.current);
    }

    // Cleanup the observer when the component unmounts or ref changes
    return () => {
      if (customerTestimonialsRef.current) {
        buttonObserver.unobserve(customerTestimonialsRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Observer for images (showImages)
    const imageObserver = new IntersectionObserver(
      (entries) => {
        setShowImages(entries[0].isIntersecting); // Trigger showImages
      },
      { threshold: 0.1 }, // Very small threshold for images
    );

    // Observe the same customer testimonials section for both buttons and images
    if (customerTestimonialsRef.current) {
      imageObserver.observe(customerTestimonialsRef.current);
    }

    // Cleanup the observer for images
    return () => {
      if (customerTestimonialsRef.current) {
        imageObserver.unobserve(customerTestimonialsRef.current);
      }
    };
  }, []);

  return (
    <div className="LandingPage">

      <Header openBooking={openBooking} />

      <div ref={carouselRef} className="carousel-container">
        <Carousel />
      </div>

      <OurFleet />
      <HowItWorks />

      <WhyChooseUs />
      <div ref={customerTestimonialsRef}>
        <CustomerTestimonials />
      </div>

      <div className="cta-section">
        <div className={`cta-buttons ${showButtons ? "visible" : ""}`}>
          <button className="cta-button-book-now" onClick={openBooking}>
            Book Now
          </button>
          <a href="tel:+639123456789" className="cta-button-call-us">
            Call Us
          </a>
        </div>

        {/* Text images in a vertical column */}
        <div className="text-images-column">
          <img
            ref={readyRef}
            src="/assets/images/ready.png"
            alt="READY"
            className={`text-image ${showReady ? "visible" : ""}`}
          />
          <img
            ref={toHitTheRef}
            src="/assets/images/to-hit-the.png"
            alt="TO HIT THE"
            className={`text-image ${showToHitThe ? "visible" : ""}`}
          />
          <img
            ref={roadRef}
            src="/assets/images/road.png"
            alt="ROAD?"
            className={`text-image ${showRoad ? "visible" : ""}`}
          />
        </div>

        {/* Images for cars */}
        <div className="static-images">
          <img
            ref={everestRef}
            src="/assets/images/everest.png"
            alt="Everest"
            className={`everest-image ${showImages ? "visible" : ""}`}
          />
          <img
            ref={avanzaRef}
            src="/assets/images/avanza.png"
            alt="Avanza"
            className={`avanza-image ${showImages ? "visible" : ""}`}
          />
        </div>
        <div className="static-images">
          <img
            ref={hiaceRef}
            src="/assets/images/hiace.png"
            alt="Hiace"
            className={`hiace-image ${showImages ? "visible" : ""}`}
          />
          <img
            ref={viosRef}
            src="/assets/images/vios.png"
            alt="Vios"
            className={`vios-image ${showImages ? "visible" : ""}`}
          />
        </div>
      </div>

      <CompanyMap />
      <Footer />
    </div>
  );
}

export default LandingPage;
