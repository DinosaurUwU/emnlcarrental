"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "./lib/UserContext";
import PhotoSwipeLightbox from "photoswipe/lightbox";
import "photoswipe/style.css";

import "./Carousel.css";

const importAll = (r) => r.keys().map(r);
const images = importAll(
  require.context("../../public/assets/images/carousel_js", false, /\.(png|jpe?g|svg)$/),
);

const textContent = [
  {
    header: "Welcome to EMNL!",
    subtitle:
      "Your Trusted Partner for Premium Car Rentals in Leyte, Philippines.",
    cta: "Explore Our Fleet",
    route: "/fleet-details",
  },
  {
    header: "Affordable Rides",
    subtitle: "Affordable SEDANs and SUVs for Everyday Travel in Leyte.",
    cta: "Browse Cars",
    route: "/fleet-details/sedan",
  },
  {
    header: "Adventure Ready",
    subtitle: "Rugged Vehicles Perfect for Road Trips and Adventures.",
    cta: "Start Your Journey",
    route: "/fleet-details/suv",
  },
  {
    header: "Corporate Rentals",
    subtitle: "Professional vehicles for business meetings and travel.",
    cta: "Rent Business Cars",
    route: "/fleet-details/mpv",
  },
  {
    header: "Vans for All",
    subtitle:
      "Spacious VANs like Nissan Urvan Highroof for families and teams.",
    cta: "Rent for Groups",
    route: "/fleet-details/van",
  },
];

function Carousel() {
  const { fetchImageFromFirestore } = useUser();
  const [carouselImages, setCarouselImages] = useState([]);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [prevSlide, setPrevSlide] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const router = useRouter();

  const carouselGalleryRef = useRef(null);

  useEffect(() => {
    const fetchCarouselImages = async () => {
      const fetchedImages = [];
      const numImages = 5;

      for (let i = 0; i < numImages; i++) {
        const imageId = `LandingPage_${i}`;
        const result = await fetchImageFromFirestore(imageId);
        if (result) {
          fetchedImages.push(result.base64); // Already a full data URL
        } else {
          // Fallback to local images
          const localImages = importAll(
            require.context(
              "../../public/assets/images/carousel_js",
              false,
              /\.(png|jpe?g|svg)$/,
            ),
          );
          fetchedImages.push(localImages[i] || ""); // Empty string or placeholder if no local image
        }
      }
      setCarouselImages(fetchedImages);
    };

    fetchCarouselImages();
  }, [fetchImageFromFirestore]);

  useEffect(() => {
    if (carouselImages.length === 0) return; // Wait for images to load

    const carouselLightbox = new PhotoSwipeLightbox({
      gallery: carouselGalleryRef.current,
      children: "a",
      pswpModule: () => import("photoswipe"),
      showHideAnimationType: "fade",
      paddingFn: () => ({ top: 50, bottom: 50, left: 20, right: 20 }),
      maxWidth: window.innerWidth * 0.8,
      maxHeight: window.innerHeight * 0.8,
    });

    carouselLightbox.init();
    return () => carouselLightbox.destroy();
  }, [carouselImages]);

  useEffect(() => {
    if (isPaused || carouselImages.length === 0) return;

    const interval = setInterval(() => {
      setPrevSlide(currentSlide);
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [currentSlide, isPaused, carouselImages.length]);

  const handleDotClick = (index) => {
    if (index === currentSlide) return;
    setPrevSlide(currentSlide);
    setCurrentSlide(null);
    setTimeout(() => {
      setCurrentSlide(index);
    }, 50);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 6000);
  };

  // // Only render if images are loaded
  // if (carouselImages.length === 0) {
  //   return <div>Loading carousel...</div>;
  // }

  return (
    <div className="landing-carousel-container">
      <div className="left-gradient-overlay"></div>

      {/* Hero Text Section inside Gradient */}
      <div className="carousel-text-container">
        {textContent.map((text, index) => (
          <div
            key={index}
            className={`carousel-text ${
              index === currentSlide ? "visible" : "hidden"
            } ${index === prevSlide ? "fade-out" : ""}`}
          >
            <h1 className="carousel-header">{text.header}</h1>
            <p className="carousel-subtitle">{text.subtitle}</p>
            {/* CTA button directly under the subtitle */}
            <button
              className={`carousel-cta ${
                index === currentSlide ? "visible" : "hidden"
              }`}
              onClick={() => router.push(text.route)}
            >
              {text.cta}
            </button>
          </div>
        ))}
      </div>

      <div className="carousel-slide">
        {carouselImages.map((img, index) => (
          <div
            key={`bg-${index}`}
            className={`landing-carousel-background ${
              index === currentSlide ? "active" : "inactive"
            }`}
          >
            <div
              className="landing-carousel-bg-image"
              style={{
                backgroundImage: `url(${img})`,
              }}
            ></div>
          </div>
        ))}

        {carouselImages.map((img, index) => (
          <img
            key={index}
            src={img}
            alt={`Slide ${index + 1}`}
            className={`carousel-image 
        ${index === currentSlide ? "active" : ""} 
        ${index === prevSlide && index !== currentSlide ? "previous" : ""}`}
            onClick={() => {
              const currentIndex = carouselImages.indexOf(img);
              document
                .querySelector(`[data-pswp-index="${currentIndex}"]`)
                ?.click();
            }}
          />
        ))}
      </div>

      {/* Custom Dots */}
      <div className="custom-dots">
        {carouselImages.map((_, index) => (
          <div
            key={index}
            className={`custom-dot ${index === currentSlide ? "active" : ""}`}
            onClick={() => handleDotClick(index)}
          >
            <span className="dot-number">{index + 1}</span>
            <svg className="progress-svg" viewBox="0 0 36 36">
              <circle className="progress-background" cx="18" cy="18" r="16" />
              <circle
                className="carousel-progress-bar"
                cx="18"
                cy="18"
                r="16"
                style={{
                  strokeDasharray: "100, 100",
                  strokeDashoffset: "100",
                  animation:
                    index === currentSlide
                      ? "fillCircle 5s linear forwards"
                      : "none",
                }}
              />
            </svg>
          </div>
        ))}
      </div>

      <div ref={carouselGalleryRef} style={{ display: "none" }}>
        {carouselImages.map((src, index) => (
          <a
            key={index}
            href={src}
            data-pswp-width={2873} // Recommended image WIDTH
            data-pswp-height={1690} // Recommended image HEIGHT
            data-pswp-index={index}
          >
            <img src={src} alt="" />
          </a>
        ))}
      </div>
    </div>
  );
}

export default Carousel;
