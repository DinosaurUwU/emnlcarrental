"use client";
import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import { useUser } from "../lib/UserContext";
import { useBooking } from "../component/BookingProvider";
import { useParams } from "next/navigation";
import PhotoSwipeLightbox from "photoswipe/lightbox";
import "photoswipe/style.css";
import Header from "../component/Header";
import Footer from "../component/Footer";
import "./FleetDetails.css";

// const FleetDetails = ({ openBooking }) => {
  const FleetDetails = () => {
  const { openBooking } = useBooking();

  const { fleetDetailsUnits, fetchImageFromFirestore } = useUser();
  const [carouselImages, setCarouselImages] = useState([]);

  const { category } = useParams();
  const sedanRef = useRef(null);
  const suvRef = useRef(null);
  const mpvRef = useRef(null);
  const vanRef = useRef(null);
  const pickupRef = useRef(null);
  const navbarOverlayRef = useRef(null);
  const [activeSection, setActiveSection] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const [overlayStyle, setOverlayStyle] = useState({});
  const cardRef = useRef(null);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);

  const importAll = (r) => r.keys().map(r);

  const [currentSlide, setCurrentSlide] = useState(0);
  const slideIntervalRef = useRef(null);
  const carouselRef = useRef(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [transitionStyle, setTransitionStyle] = useState("transform 0.5s ease");

  const [currentOverlayImage, setCurrentOverlayImage] = useState(null);

  const [fetchedImages, setFetchedImages] = useState({});
  const [overlayGalleryImages, setOverlayGalleryImages] = useState([]);

  useEffect(() => {
    const fetchCarouselImages = async () => {
      const maxImages = 20;
      const promises = [];

      for (let i = 0; i < maxImages; i++) {
        promises.push(fetchImageFromFirestore(`FleetPage_${i}`));
      }

      const results = await Promise.all(promises);
      const fetchedImages = results
        .filter((result) => result)
        .map((result) => result.base64);

      // If no images in Firestore, fallback to local images
      if (fetchedImages.length === 0) {
        const localImages = importAll(
          require.context(
            "./assets/images/carousel",
            false,
            /\.(png|jpe?g|svg)$/,
          ),
        );
        setCarouselImages(localImages);
      } else {
        setCarouselImages(fetchedImages);
      }
    };

    fetchCarouselImages();
  }, [fetchImageFromFirestore]);

  // triple images for smooth infinite loop
  const images = overlayGalleryImages;
  const extendedImages = [...images, ...images, ...images];

  const total = images.length;
  const imgWidth = 180; // width + gap

  // Start in the middle section (real images)
  useEffect(() => {
    setCarouselIndex(total);
  }, [total]);

  const nextCarousel = () => {
    setCarouselIndex((prev) => {
      const next = prev + 1;

      if (next === total * 2) {
        setTimeout(() => {
          setTransitionStyle("none");
          setCarouselIndex(total);

          setTimeout(() => {
            setTransitionStyle("transform 0.5s ease");
          }, 20);
        }, 500);
      }

      return next;
    });
  };

  const prevCarousel = () => {
    setCarouselIndex((prev) => {
      const prevIndex = prev - 1;

      if (prevIndex === total - 1) {
        setTimeout(() => {
          setTransitionStyle("none");
          setCarouselIndex(total * 2 - 1);

          setTimeout(() => {
            setTransitionStyle("transform 0.5s ease");
          }, 20);
        }, 500);
      }

      return prevIndex;
    });
  };

  useEffect(() => {
    const fetchImages = async () => {
      if (!fleetDetailsUnits || fleetDetailsUnits.length === 0) return;

      const promises = fleetDetailsUnits.map(async (unit) => {
        if (!unit.imageId) return null;
        try {
          const { base64, updatedAt } = await fetchImageFromFirestore(
            unit.imageId,
          );
          return { [unit.imageId]: { base64, updatedAt } };
        } catch {
          return {
            [unit.imageId]: {
              base64: "/assets/images/default.png",
              updatedAt: Date.now(),
            },
          };
        }
      });

      const results = await Promise.all(promises);
      const merged = results.reduce((acc, cur) => ({ ...acc, ...cur }), {});
      setFetchedImages(merged);
    };

    fetchImages();
  }, [fleetDetailsUnits, fetchImageFromFirestore]);

  useEffect(() => {
    if (expandedCard?.galleryIds?.length > 0) {
      const fetchPromises = expandedCard.galleryIds.map((id) =>
        fetchImageFromFirestore(id).catch(() => null),
      );
      Promise.all(fetchPromises).then((results) => {
        setOverlayGalleryImages(results.filter((r) => r !== null));
      });
    } else {
      setOverlayGalleryImages([]);
    }
  }, [expandedCard, fetchImageFromFirestore]);

  const galleryRef = useRef(null);

  useEffect(() => {
    const lightbox = new PhotoSwipeLightbox({
      gallery: galleryRef.current,
      children: "a",
      pswpModule: () => import("photoswipe"),
      showHideAnimationType: "fade",
      paddingFn: () => ({ top: 50, bottom: 50, left: 20, right: 20 }),
      maxWidth: window.innerWidth * 0.8,
      maxHeight: window.innerHeight * 0.8,
    });

    lightbox.init();
    return () => lightbox.destroy();
  }, []);

  const carouselGalleryRef = useRef(null);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        { ref: sedanRef, name: "sedan" },
        { ref: suvRef, name: "suv" },
        { ref: mpvRef, name: "mpv" },
        { ref: vanRef, name: "van" },
        { ref: pickupRef, name: "pickup" },
      ];

      const scrollY = window.scrollY + window.innerHeight / 2; // Middle of viewport

      for (const section of sections) {
        if (section.ref.current) {
          const rect = section.ref.current.getBoundingClientRect();
          const sectionTop = rect.top + window.scrollY;
          const sectionBottom = sectionTop + rect.height;

          if (scrollY >= sectionTop && scrollY < sectionBottom) {
            setActiveSection(section.name);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const sedanUnits = fleetDetailsUnits.filter(
    (unit) => unit.carType.toLowerCase() === "sedan",
  );
  const suvUnits = fleetDetailsUnits.filter(
    (unit) => unit.carType.toLowerCase() === "suv",
  );
  const mpvUnits = fleetDetailsUnits.filter(
    (unit) => unit.carType.toLowerCase() === "mpv",
  );
  const vanUnits = fleetDetailsUnits.filter(
    (unit) => unit.carType.toLowerCase() === "van",
  );
  const pickupUnits = fleetDetailsUnits.filter(
    (unit) => unit.carType.toLowerCase() === "pickup",
  );

  const specificationOrder = [
    "Type",
    "Color",
    "Capacity",
    "Transmission",
    "Fuel",
    "Trunk",
    "Features",
  ];

    useEffect(() => {
    if (carouselImages.length === 0) return;

    slideIntervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => {
        if (prev >= carouselImages.length - 1) return 0;
        return prev + 1;
      });
    }, 3000);

    return () => clearInterval(slideIntervalRef.current);
  }, [carouselImages]);


  // useEffect(() => {
  //   slideIntervalRef.current = setInterval(() => {
  //     setCurrentSlide((prev) =>
  //       prev === carouselImages.length - 1 ? 0 : prev + 1,
  //     );
  //   }, 3000);

  //   return () => clearInterval(slideIntervalRef.current);
  // }, []);

  const goToSlide = (newIndex) => {
    setCurrentSlide(newIndex);

    // Reset interval after manual change
    clearInterval(slideIntervalRef.current);
    slideIntervalRef.current = setInterval(() => {
      setCurrentSlide((prev) =>
        prev === carouselImages.length - 1 ? 0 : prev + 1,
      );
    }, 3000);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (carouselRef.current) {
        const offset = window.scrollY * 0.5;
        carouselRef.current.style.transform = `translateY(${offset}px)`;
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const specificationIcons = {
    Type: "/assets/type.png",
    Color: "/assets/color.png",
    Capacity: "/assets/passenger.png",
    Transmission: "/assets/transmission.png",
    Fuel: "/assets/fuel.png",
    Trunk: "/assets/trunk.png",
    Features: "/assets/features.png",
  };

  const scrollToSection = (sectionRef) => {
    const offset = 200;
    const elementPosition =
      sectionRef.current.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    if (category === "sedan") scrollToSection(sedanRef);
    else if (category === "suv") scrollToSection(suvRef);
    else if (category === "mpv") scrollToSection(mpvRef);
    else if (category === "van") scrollToSection(vanRef);
    else if (category === "pickup") scrollToSection(pickupRef);
  }, [category]);

  useLayoutEffect(() => {
    const handleScroll = () => {
      const suvSection = sedanRef.current;
      const navbarOverlay = navbarOverlayRef.current;

      if (suvSection && navbarOverlay) {
        const suvSectionTop = suvSection.getBoundingClientRect().top;
        const currentWidth = window.innerWidth;

        if (suvSectionTop <= 300) {
          navbarOverlay.style.top = "12%";
        } else {
          if (currentWidth <= 768) {
            // interpolate top between 58% (768px) → 44% (390px)
            const minWidth = 390;
            const maxWidth = 768;
            const maxTop = 58;
            const minTop = 43;

            // clamp the width within range
            const clampedWidth = Math.min(
              Math.max(currentWidth, minWidth),
              maxWidth,
            );

            // linear interpolation factor
            const t = (clampedWidth - minWidth) / (maxWidth - minWidth);

            // interpolate top
            const interpolatedTop = minTop + t * (maxTop - minTop);

            navbarOverlay.style.top = `${interpolatedTop}%`;
          } else {
            navbarOverlay.style.top = "58%";
          }
        }
      }
    };

    handleScroll(); // Set initial position

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openOverlay = (car, event) => {
    console.log("Car clicked:", car);

    const cardRect = event.currentTarget.getBoundingClientRect();
    cardRef.current = event.currentTarget;
    setExpandedCard(car);
    setCurrentOverlayImage(
      fetchedImages[car.imageId]?.base64 || "/assets/images/default.png",
    );

    setIsOverlayVisible(true);
    document.body.classList.add("no-scroll");

    setOverlayStyle({
      top: `${cardRect.top}px`,
      left: `${cardRect.left}px`,
      width: `${cardRect.width}px`,
      height: `${cardRect.height}px`,
    });

    setTimeout(() => {
      setOverlayStyle({
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
      });
    }, 0);
  };

  const closeOverlay = () => {
    setIsOverlayVisible(false);

    document.body.classList.remove("no-scroll");

    if (cardRef.current) {
      const cardRect = cardRef.current.getBoundingClientRect(); // Get the original card's position
      setOverlayStyle({
        top: `${cardRect.top}px`,
        left: `${cardRect.left}px`,
        width: `${cardRect.width}px`,
        height: `${cardRect.height}px`,
      });

      // Allow reverse animation before removing the overlay content
      setTimeout(() => {
        setExpandedCard(null);
        cardRef.current = null; // Clear reference
      }, 500); // Match the animation duration
    }
  };

  const handleImageClick = (newImage) => {
    setCurrentOverlayImage(newImage.base64); // Update the overlay image
  };

  return (
    <div className="fleet-details">
      <Header openBooking={openBooking} s />

      <div className="navbar-overlay" ref={navbarOverlayRef}>
        <div className="navbar">
          {sedanUnits.length > 0 && (
            <button
              className={activeSection === "sedan" ? "active" : ""}
              onClick={() => scrollToSection(sedanRef)}
            >
              SEDAN
            </button>
          )}

          {suvUnits.length > 0 && (
            <button
              className={activeSection === "suv" ? "active" : ""}
              onClick={() => scrollToSection(suvRef)}
            >
              SUV
            </button>
          )}

          {mpvUnits.length > 0 && (
            <button
              className={activeSection === "mpv" ? "active" : ""}
              onClick={() => scrollToSection(mpvRef)}
            >
              MPV
            </button>
          )}

          {vanUnits.length > 0 && (
            <button
              className={activeSection === "van" ? "active" : ""}
              onClick={() => scrollToSection(vanRef)}
            >
              VAN
            </button>
          )}

          {pickupUnits.length > 0 && (
            <button
              className={activeSection === "pickup" ? "active" : ""}
              onClick={() => scrollToSection(pickupRef)}
            >
              PICKUP
            </button>
          )}
        </div>
      </div>

      {/* Carousel */}

      <div ref={carouselRef} className="fleet-carousel-container">
        {carouselImages.map((image, index) => (
          <div
            key={`bg-${index}`}
            className={`carousel-background ${
              index === currentSlide ? "active" : "inactive"
            }`}
          >
            <div
              className="carousel-bg-image"
              style={{
                backgroundImage: `url(${image})`,
              }}
            ></div>
          </div>
        ))}

        {carouselImages.map((image, index) => (
          <div
            key={index}
            className={`fleet-carousel-slide ${
              index === currentSlide ? "active" : "inactive"
            }`}
          >
            <img
              src={image}
              alt={`Slide ${index}`}
              className="hero-carousel-image"
              onClick={() => {
                document
                  .querySelector(`[data-pswp-index="carousel-${index}"]`)
                  ?.click();
              }}
            />
          </div>
        ))}

        <button
          className="carousel-prev"
          onClick={() =>
            goToSlide(
              currentSlide === 0 ? carouselImages.length - 1 : currentSlide - 1,
            )
          }
        >
          <img
            src="/assets/prv-btn.png"
            alt="Previous"
            className="arrow-icon"
          />
        </button>

        <button
          className="carousel-next"
          onClick={() =>
            goToSlide(
              currentSlide === carouselImages.length - 1 ? 0 : currentSlide + 1,
            )
          }
        >
          <img src="/assets/nxt-btn.png" alt="Next" className="arrow-icon" />
        </button>
      </div>

      {sedanUnits.length > 0 && (
        <section className="sedan-diagonal-section" ref={sedanRef}>
          <div className="sedan-diagonal-strip">
            <div className="sedan-diagonal-scroll">
              <div className="diagonal-text">
                SEDAN SEDAN SEDAN SEDAN SEDAN SEDAN&nbsp;
              </div>
              <div className="diagonal-text">
                SEDAN SEDAN SEDAN SEDAN SEDAN SEDAN&nbsp;
              </div>
            </div>
          </div>

          <div
            ref={sedanRef}
            id="sedan-section"
            className="category-section sedan-section"
          >
            <h2>SEDAN</h2>

            <div className="car-list">
              {sedanUnits.map((car, index) => (
                <div
                  key={index}
                  className="car-card"
                  onClick={(event) => openOverlay(car, event)}
                >
                  <div className="car-image-container">
                    <img
  src={fetchedImages[car.imageId]?.base64 || "/assets/images/default.png"}
  alt={car.name}
  className="car-image"
  onLoad={(e) => e.target.style.opacity = 1}
  onError={(e) => {
    e.target.src = "/assets/images/default.png";
  }}
/>

                  </div>

                  {/* Content Overlay */}
                  <div className="car-content-overlay">
                    <div className="car-content-wrapper">
                      <h3
                        style={{
                          textTransform: "uppercase",
                          fontFamily: "Montserrat, sans-serif",
                          fontWeight: "900",
                          lineHeight: "1",
                        }}
                      >
                        {" "}
                        <span
                          style={{
                            fontSize: "0.6em",
                            textTransform: "uppercase",
                            fontFamily: "Arial, sans-serif",
                            fontWeight: "900",
                          }}
                        >
                          {car.brand}
                          <br />
                        </span>
                        {car.name}
                      </h3>

                      <p
                        className={`availability ${
                          car.hidden ? "rented" : "available"
                        }`}
                      >
                        {car.hidden ? "Ongoing Rent" : "Available"}
                      </p>
                    </div>
                    <button className="view-details">View</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {suvUnits.length > 0 && (
        <section className="suv-diagonal-section" ref={suvRef}>
          <div className="suv-diagonal-strip">
            <div className="suv-diagonal-scroll">
              <div className="diagonal-text">SUV SUV SUV SUV SUV SUV&nbsp;</div>
              <div className="diagonal-text">
                {" "}
                SUV SUV SUV SUV SUV SUV&nbsp;
              </div>
            </div>
          </div>

          <div
            ref={suvRef}
            id="suv-section"
            className="category-section suv-section"
          >
            <h2>SUV</h2>

            <div className="car-list">
              {suvUnits.map((car, index) => (
                <div
                  key={index}
                  className="car-card"
                  onClick={(event) => openOverlay(car, event)}
                >
                  <div className="car-image-container">
                    <img
                      src={
                        fetchedImages[car.imageId]?.base64 ||
                        "/assets/images/default.png"
                      }
                      alt={car.name}
                      className="car-image"
                    />
                  </div>

                  {/* Content Overlay */}
                  <div className="car-content-overlay">
                    <div className="car-content-wrapper">
                      <h3
                        style={{
                          textTransform: "uppercase",
                          fontFamily: "Montserrat, sans-serif",
                          fontWeight: "900",
                          lineHeight: "1",
                        }}
                      >
                        {" "}
                        <span
                          style={{
                            fontSize: "0.6em",
                            textTransform: "uppercase",
                            fontFamily: "Arial, sans-serif",
                            fontWeight: "900",
                          }}
                        >
                          {car.brand}
                          <br />
                        </span>
                        {car.name}
                      </h3>

                      <p
                        className={`availability ${
                          car.hidden ? "rented" : "available"
                        }`}
                      >
                        {car.hidden ? "Ongoing Rent" : "Available"}
                      </p>
                    </div>
                    <button className="view-details">View</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {mpvUnits.length > 0 && (
        <section className="mpv-diagonal-section" ref={mpvRef}>
          <div className="mpv-diagonal-strip">
            <div className="mpv-diagonal-scroll">
              <div className="diagonal-text">MPV MPV MPV MPV MPV MPV&nbsp;</div>
              <div className="diagonal-text">
                {" "}
                MPV MPV MPV MPV MPV MPV&nbsp;
              </div>
            </div>
          </div>

          <div
            ref={mpvRef}
            id="mpv-section"
            className="category-section mpv-section"
          >
            <h2>MPV</h2>

            <div className="car-list">
              {mpvUnits.map((car, index) => (
                <div
                  key={index}
                  className="car-card"
                  onClick={(event) => openOverlay(car, event)}
                >
                  <div className="car-image-container">
                    <img
                      src={
                        fetchedImages[car.imageId]?.base64 ||
                        "/assets/images/default.png"
                      }
                      alt={car.name}
                      className="car-image"
                    />
                  </div>

                  {/* Content Overlay */}
                  <div className="car-content-overlay">
                    <div className="car-content-wrapper">
                      <h3
                        style={{
                          textTransform: "uppercase",
                          fontFamily: "Montserrat, sans-serif",
                          fontWeight: "900",
                          lineHeight: "1",
                        }}
                      >
                        {" "}
                        <span
                          style={{
                            fontSize: "0.6em",
                            textTransform: "uppercase",
                            fontFamily: "Arial, sans-serif",
                            fontWeight: "900",
                          }}
                        >
                          {car.brand}
                          <br />
                        </span>
                        {car.name}
                      </h3>

                      <p
                        className={`availability ${
                          car.hidden ? "rented" : "available"
                        }`}
                      >
                        {car.hidden ? "Ongoing Rent" : "Available"}
                      </p>
                    </div>
                    <button className="view-details">View</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {vanUnits.length > 0 && (
        <section className="van-diagonal-section" ref={vanRef}>
          <div className="van-diagonal-strip">
            <div className="van-diagonal-scroll">
              <div className="diagonal-text">VAN VAN VAN VAN VAN VAN&nbsp;</div>
              <div className="diagonal-text">
                {" "}
                VAN VAN VAN VAN VAN VAN&nbsp;
              </div>
            </div>
          </div>

          <div
            ref={vanRef}
            id="van-section"
            className="category-section van-section"
          >
            <h2>VAN</h2>

            <div className="car-list">
              {vanUnits.map((car, index) => (
                <div
                  key={index}
                  className="car-card"
                  onClick={(event) => openOverlay(car, event)}
                >
                  <div className="car-image-container">
                    <img
                      src={
                        fetchedImages[car.imageId]?.base64 ||
                        "/assets/images/default.png"
                      }
                      alt={car.name}
                      className="car-image"
                    />
                  </div>

                  {/* Content Overlay */}
                  <div className="car-content-overlay">
                    <div className="car-content-wrapper">
                      <h3
                        style={{
                          textTransform: "uppercase",
                          fontFamily: "Montserrat, sans-serif",
                          fontWeight: "900",
                          lineHeight: "1",
                        }}
                      >
                        {" "}
                        <span
                          style={{
                            fontSize: "0.6em",
                            textTransform: "uppercase",
                            fontFamily: "Arial, sans-serif",
                            fontWeight: "900",
                          }}
                        >
                          {car.brand}
                          <br />
                        </span>
                        {car.name}
                      </h3>

                      <p
                        className={`availability ${
                          car.hidden ? "rented" : "available"
                        }`}
                      >
                        {car.hidden ? "Ongoing Rent" : "Available"}
                      </p>
                    </div>
                    <button className="view-details">View</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {pickupUnits.length > 0 && (
        <section className="pickup-diagonal-section" ref={pickupRef}>
          <div className="pickup-diagonal-strip">
            <div className="pickup-diagonal-scroll">
              <div className="diagonal-text">
                PICKUP PICKUP PICKUP PICKUP PICKUP PICKUP&nbsp;
              </div>
              <div className="diagonal-text">
                PICKUP PICKUP PICKUP PICKUP PICKUP PICKUP&nbsp;
              </div>
            </div>
          </div>

          <div
            ref={pickupRef}
            id="pickup-section"
            className="category-section pickup-section"
          >
            <h2>PICKUP</h2>

            <div className="car-list">
              {pickupUnits.map((car, index) => (
                <div
                  key={index}
                  className="car-card"
                  onClick={(event) => openOverlay(car, event)}
                >
                  <div className="car-image-container">
                    <img
                      src={
                        fetchedImages[car.imageId]?.base64 ||
                        "/assets/images/default.png"
                      }
                      alt={car.name}
                      className="car-image"
                    />
                  </div>

                  {/* Content Overlay */}
                  <div className="car-content-overlay">
                    <div className="car-content-wrapper">
                      <h3
                        style={{
                          textTransform: "uppercase",
                          fontFamily: "Montserrat, sans-serif",
                          fontWeight: "900",
                          lineHeight: "1",
                        }}
                      >
                        {" "}
                        <span
                          style={{
                            fontSize: "0.6em",
                            textTransform: "uppercase",
                            fontFamily: "Arial, sans-serif",
                            fontWeight: "900",
                          }}
                        >
                          {car.brand}
                          <br />
                        </span>
                        {car.name}
                      </h3>
                      <p
                        className={`availability ${
                          car.hidden ? "rented" : "available"
                        }`}
                      >
                        {car.hidden ? "Ongoing Rent" : "Available"}
                      </p>
                    </div>
                    <button className="view-details">View</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      {/* Expanded Details Overlay */}
      {expandedCard && (
        <>
          {/* Background overlay */}
          <div
            className={`overlay-background ${
              isOverlayVisible ? "visible" : ""
            }`}
          ></div>

          {/* Car-card overlay */}
          <div className="overlay" style={overlayStyle}>
            <div className="overlay-content">
              <button className="close-overlay" onClick={closeOverlay}>
                <strong>✖</strong>
              </button>
              {/* Gradient container for details */}
              <div className="overlay-details">
                <h3 className="overlay-name">
                  <span
                    style={{
                      fontSize: "0.6em",
                      textTransform: "uppercase",
                      fontFamily: "Arial, sans-serif",
                      fontWeight: "900",
                    }}
                  >
                    {expandedCard.brand}
                  </span>
                  <br />
                  {expandedCard.name}
                </h3>

                <p
                  className={`overlay-availability ${
                    expandedCard.hidden ? "rented" : "available"
                  }`}
                >
                  {expandedCard.hidden ? "Ongoing Rent" : "Available"}
                </p>

                {/* Scrollable Car Details */}
                <div className="car-details">
                  <p className="car-introduction">
                    <strong>{expandedCard.details.introduction}</strong>
                  </p>

                  <div className="details-specifications">
                    <ul>
                      {specificationOrder.map((key, index) => {
                        const value = expandedCard.details.specifications[key];
                        if (!value) return null; // Skip if missing
                        const icon = specificationIcons[key] || null;
                        return (
                          <li key={index}>
                            {icon && (
                              <img
                                src={icon}
                                alt={key}
                                className="specification-icon"
                              />
                            )}
                            <span style={{ textAlign: "left" }}>
                              {key}: <strong>{value}</strong>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div className="details-pricing">
                    <p className="self-drive" style={{ marginTop: "0px" }}>
                      <strong>Self-Drive:</strong>
                      <br />
                      <span className="price-amount">
                        ₱{expandedCard.price.toLocaleString()} / Day
                      </span>
                    </p>

                    <p className="with-driver">
                      <strong>With Driver:</strong>
                      <br />
                      <span className="price-amount">
                        ₱
                        {(
                          expandedCard.price + expandedCard.driverRate
                        ).toLocaleString()}{" "}
                        / Day
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  className="view-details"
                  onClick={(event) => {
                    openBooking(event, {
                      carName: expandedCard.name,
                      carType: expandedCard.carType,
                      image:
                        fetchedImages[expandedCard.imageId]?.base64 ||
                        "/assets/images/default.png",
                      drivingOption: "Self-Drive",
                      pickupOption: "Pickup",
                    });
                  }}
                >
                  Book Now
                </button>
              </div>

              {/* Image remains outside the gradient container */}

              <img
                src={
                  currentOverlayImage ||
                  fetchedImages[expandedCard?.imageId]?.base64 ||
                  "/assets/images/default.png"
                }
                alt={expandedCard?.name || ""}
                className="overlay-image"
                onClick={() => {
                  const currentIndex = images.findIndex(
                    (img) => img.base64 === currentOverlayImage,
                  );
                  const indexToOpen = currentIndex >= 0 ? currentIndex : 0;
                  document
                    .querySelector(`[data-pswp-index="${indexToOpen}"]`)
                    ?.click();
                }}
              />

              <div className="additional-carousel-container">
                <button className="carousel-prev" onClick={prevCarousel}>
                  <img
                    src="/assets/prv-btn.png"
                    alt="Previous"
                    className="arrow-icon"
                  />
                </button>

                <div className="carousel-wrapper">
                  <div
                    className="carousel-inner"
                    style={{
                      transform: `translateX(-${carouselIndex * imgWidth}px)`,
                      transition: transitionStyle,
                    }}
                  >
                    {extendedImages.map((image, index) => (
                      <img
                        key={index}
                        src={image.base64}
                        alt={`Additional Image ${index % images.length}`}
                        className="carousel-image"
                        onClick={() => handleImageClick(image)} // Pass the full image object
                      />
                    ))}
                  </div>
                </div>

                <button className="carousel-next" onClick={nextCarousel}>
                  <img
                    src="/assets/nxt-btn.png"
                    alt="Next"
                    className="arrow-icon"
                  />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <div ref={galleryRef} style={{ display: "none" }}>
        {images.map((image, index) => (
          <a
            key={index}
            href={image.base64} // Use base64
            data-pswp-width={2873}
            data-pswp-height={1690}
            data-pswp-index={index}
          >
            <img src={image.base64} alt="" />
          </a>
        ))}
      </div>

      <div ref={carouselGalleryRef} style={{ display: "none" }}>
        {carouselImages.map((src, index) => (
          <a
            key={index}
            href={src}
            data-pswp-width={2873} // Recommended image WIDTH
            data-pswp-height={1690} // Recommended image HEIGHT
            data-pswp-index={`carousel-${index}`}
          >
            <img src={src} alt="" />
          </a>
        ))}
      </div>

      <Footer />
    </div>
  );
};

export default FleetDetails;
