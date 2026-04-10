"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "./lib/UserContext";
import "photoswipe/style.css";
import "./Carousel.css";

const importAll = (r) => r.keys().map(r);
const normalizeImageSrc = (img) => {
  if (!img) return "";
  if (typeof img === "string") return img;
  return img.default || img.src || "";
};

const images = importAll(
  require.context(
    "../../public/assets/images/carousel_js",
    false,
    /\.(png|jpe?g|svg)$/,
  ),
).map(normalizeImageSrc);

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
  const { fetchImageFromFirestore, imageCache, imageUpdateTrigger } = useUser();
  const isValidImageSrc = (src) =>
    typeof src === "string" &&
    src.trim() !== "" &&
    (src.startsWith("data:image/") ||
      src.startsWith("http") ||
      src.startsWith("/"));

  const carouselImages = useMemo(() => {
    const numImages = 5;
    const fallbackImages = images.slice(0, numImages);

    const cachedImages = Array.from({ length: numImages }, (_, i) => {
      const imageId = `LandingPage_${i}`;
      const cached = imageCache[imageId]?.base64;
      return isValidImageSrc(cached) ? cached : null;
    }).filter(Boolean);

    return cachedImages.length > 0
      ? cachedImages
      : fallbackImages.length > 0
        ? fallbackImages
        : ["/assets/images/default.png"];
  }, [imageCache]);

  const [carouselImageSizes, setCarouselImageSizes] = useState({});

  useEffect(() => {
    if (!carouselImages.length) return;
    let cancelled = false;

    Promise.all(
      carouselImages.map(
        (src) =>
          new Promise((resolve) => {
            const img = new Image();
            img.onload = () =>
              resolve({
                src,
                width: img.naturalWidth || 1200,
                height: img.naturalHeight || 800,
              });
            img.onerror = () =>
              resolve({
                src,
                width: 1200,
                height: 800,
              });
            img.src = src;
          }),
      ),
    ).then((results) => {
      if (cancelled) return;
      const next = {};
      results.forEach(({ src, width, height }) => {
        next[src] = { width, height };
      });
      setCarouselImageSizes(next);
    });

    return () => {
      cancelled = true;
    };
  }, [carouselImages]);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [prevSlide, setPrevSlide] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const router = useRouter();
  const carouselGalleryRef = useRef(null);

  useEffect(() => {
    const landingIds = Array.from({ length: 5 }, (_, i) => `LandingPage_${i}`);
    const fleetIds = Array.from({ length: 20 }, (_, i) => `FleetPage_${i}`);
    const ids = [...landingIds, ...fleetIds];

    (async () => {
      await Promise.all(
        ids.map((id) => fetchImageFromFirestore(id, true).catch(() => null)),
      );
    })();
  }, [fetchImageFromFirestore, imageUpdateTrigger]);

  useEffect(() => {
    if (carouselImages.length === 0) return;
    if (!carouselGalleryRef.current) return;

    let mounted = true;
    let idleId = null;
    let lightbox = null;

    // const init = async () => {
    //   const [{ default: PhotoSwipeLightbox }] = await Promise.all([
    //     import("photoswipe/lightbox"),
    //     import("photoswipe/style.css"),
    //   ]);

    //   if (!mounted || !carouselGalleryRef.current) return;

    //   lightbox = new PhotoSwipeLightbox({
    //     gallery: carouselGalleryRef.current,
    //     children: "a",
    //     pswpModule: () => import("photoswipe"),
    //     showHideAnimationType: "fade",
    //     paddingFn: () => ({ top: 50, bottom: 50, left: 20, right: 20 }),
    //     maxWidth: window.innerWidth * 0.8,
    //     maxHeight: window.innerHeight * 0.8,
    //     preloaderDelay: 0,
    //   });

    //   lightbox.init();
    // };

        const init = async () => {
      const [{ default: PhotoSwipeLightbox }] = await Promise.all([
        import("photoswipe/lightbox"),
        import("photoswipe/style.css"),
      ]);

      if (!mounted || !carouselGalleryRef.current) return;

      // Destroy any existing PhotoSwipe instances first
      document.querySelectorAll(".pswp").forEach(el => el.remove());

      lightbox = new PhotoSwipeLightbox({
        gallery: carouselGalleryRef.current,
        children: "a",
        pswpModule: () => import("photoswipe"),
        showHideAnimationType: "fade",
        paddingFn: () => ({ top: 50, bottom: 50, left: 20, right: 20 }),
        maxWidth: window.innerWidth * 0.8,
        maxHeight: window.innerHeight * 0.8,
        preloaderDelay: 0,
      });

      lightbox.init();
    };

    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(init, { timeout: 1200 });
    } else {
      idleId = setTimeout(init, 0);
    }

    return () => {
      mounted = false;
      if (typeof idleId === "number") clearTimeout(idleId);
      if ("cancelIdleCallback" in window && typeof idleId !== "number") {
        window.cancelIdleCallback(idleId);
      }
      lightbox?.destroy();
    };
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
            loading={index === currentSlide ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={index === currentSlide ? "high" : "auto"}
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
            data-pswp-width={carouselImageSizes[src]?.width || 1200}
            data-pswp-height={carouselImageSizes[src]?.height || 800}
            data-pswp-index={index}
          >
            <span aria-hidden="true" />
          </a>
        ))}
      </div>
    </div>
  );
}

export default Carousel;
