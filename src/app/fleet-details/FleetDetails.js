"use client";
import React, {
  useEffect,
  useRef,
  useState,
  useLayoutEffect,
  useMemo,
} from "react";
import { useUser } from "../lib/UserContext";
import { useBooking } from "../component/BookingProvider";
import { useParams } from "next/navigation";
import { FiMenu } from "react-icons/fi";


import "photoswipe/style.css";
import Header from "../component/Header";
import Footer from "../component/Footer";
import "./FleetDetails.css";

const normalizeImageSrc = (img) => {
  if (!img) return "";
  if (typeof img === "string") return img;
  return img.default || img.src || "";
};

const fleetCarouselImages = (() => {
  const importAll = (r) => r.keys().map(r);
  return importAll(
    require.context("./assets/images/carousel", false, /\.(png|jpe?g|svg)$/),
  ).map(normalizeImageSrc);
})();

const isValidImageSrc = (src) =>
  typeof src === "string" &&
  src.trim() !== "" &&
  (src.startsWith("data:image/") ||
    src.startsWith("http") ||
    src.startsWith("/"));

const fleetCardImageMemory = {};

// const FleetDetails = ({ openBooking }) => {
const FleetDetails = () => {
  const { openBooking } = useBooking();

  const {
    fleetDetailsUnits,
    fetchImageFromFirestore,
    imageCache,
    imageUpdateTrigger,
    activeBookings,
  } = useUser();

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

  const [currentSlide, setCurrentSlide] = useState(0);
  const slideIntervalRef = useRef(null);
  const carouselRef = useRef(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [transitionStyle, setTransitionStyle] = useState("transform 0.5s ease");

  const [currentOverlayImage, setCurrentOverlayImage] = useState(null);

  const [fetchedImages, setFetchedImages] = useState({});
  const [overlayGalleryImages, setOverlayGalleryImages] = useState([]);

  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    // Defensive cleanup for login/logout redirects that can leave body locked
    document.body.classList.remove("modal-open", "no-scroll");
    document.body.style.top = "";

    return () => {
      document.body.classList.remove("no-scroll");
      document.body.style.top = "";
    };
  }, []);

  const buildUnitImageMap = (units, cache) => {
    const map = {};
    if (!units?.length) return map;

    for (const unit of units) {
      if (!unit.imageId) continue;

      // Prefer latest cache first; fallback to in-memory only if cache missing.
      if (cache[unit.imageId]) {
        map[unit.imageId] = cache[unit.imageId];
        continue;
      }

      if (fleetCardImageMemory[unit.imageId]) {
        map[unit.imageId] = fleetCardImageMemory[unit.imageId];
      }
    }

    return map;
  };

  const carouselImages = useMemo(() => {
    const maxImages = 20;

    const cachedImages = Array.from({ length: maxImages }, (_, i) => {
      const imageId = `FleetPage_${i}`;
      const cached = imageCache[imageId]?.base64;
      return isValidImageSrc(cached) ? cached : null;
    }).filter(Boolean);

    return cachedImages.length > 0
      ? cachedImages
      : fleetCarouselImages.length > 0
        ? fleetCarouselImages
        : ["/assets/images/default.png"];
  }, [imageCache]);

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

  // triple images for smooth infinite loop
  const images = overlayGalleryImages;
  const extendedImages = [...images, ...images, ...images];

  const [overlayImageSizes, setOverlayImageSizes] = useState({});
  const [fleetCarouselImageSizes, setFleetCarouselImageSizes] = useState({});

  useEffect(() => {
    if (!images.length) return;
    let cancelled = false;

    Promise.all(
      images.map(
        (image) =>
          new Promise((resolve) => {
            const src = image?.base64 || "";
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
        if (src) next[src] = { width, height };
      });
      setOverlayImageSizes(next);
    });

    return () => {
      cancelled = true;
    };
  }, [images]);

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
      setFleetCarouselImageSizes(next);
    });

    return () => {
      cancelled = true;
    };
  }, [carouselImages]);

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
    const instantMap = buildUnitImageMap(fleetDetailsUnits, imageCache);
    setFetchedImages((prev) => ({ ...prev, ...instantMap }));
  }, [fleetDetailsUnits, imageCache]);

  useEffect(() => {
    if (!fleetDetailsUnits?.length) return;

    let cancelled = false;

    const unitImageIds = Array.from(
      new Set(fleetDetailsUnits.map((u) => u.imageId).filter(Boolean)),
    );

    (async () => {
      const results = await Promise.all(
        unitImageIds.map((id) =>
          fetchImageFromFirestore(id, true).catch(() => null),
        ),
      );

      if (cancelled) return;

      const patch = {};
      results.forEach((img, i) => {
        const id = unitImageIds[i];
        if (!img) return;
        patch[id] = img;
        fleetCardImageMemory[id] = img;
      });

      if (Object.keys(patch).length) {
        setFetchedImages((prev) => ({ ...prev, ...patch }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fleetDetailsUnits, fetchImageFromFirestore, imageUpdateTrigger]);

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
    if (!galleryRef.current) return;

    let mounted = true;
    let idleId = null;
    let lightbox = null;

    const init = async () => {
      const [{ default: PhotoSwipeLightbox }] = await Promise.all([
        import("photoswipe/lightbox"),
        import("photoswipe/style.css"),
      ]);

      if (!mounted || !galleryRef.current) return;

      lightbox = new PhotoSwipeLightbox({
        gallery: galleryRef.current,
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
  }, []);

  const carouselGalleryRef = useRef(null);

  useEffect(() => {
    if (!carouselGalleryRef.current) return;

    let mounted = true;
    let idleId = null;
    let carouselLightbox = null;

    const init = async () => {
      const [{ default: PhotoSwipeLightbox }] = await Promise.all([
        import("photoswipe/lightbox"),
        import("photoswipe/style.css"),
      ]);

      if (!mounted || !carouselGalleryRef.current) return;

      carouselLightbox = new PhotoSwipeLightbox({
        gallery: carouselGalleryRef.current,
        children: "a",
        pswpModule: () => import("photoswipe"),
        showHideAnimationType: "fade",
        paddingFn: () => ({ top: 50, bottom: 50, left: 20, right: 20 }),
        maxWidth: window.innerWidth * 0.8,
        maxHeight: window.innerHeight * 0.8,
        preloaderDelay: 0,
      });

      carouselLightbox.init();
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
      carouselLightbox?.destroy();
    };
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

  const activeBookingPlateSet = useMemo(() => {
    return new Set(
      (activeBookings || [])
        .filter((booking) => {
          const status = String(booking?.status || "").toLowerCase();
          return status === "active" || status === "pending";
        })
        .map((booking) =>
          String(booking?.plateNo || "")
            .trim()
            .toUpperCase(),
        )
        .filter(Boolean),
    );
  }, [activeBookings]);

  const isUnitBooked = (car) => {
    const plate = String(car?.plateNo || car?.id || "")
      .trim()
      .toUpperCase();
    if (plate && activeBookingPlateSet.has(plate)) return true;
    return !!car?.hidden;
  };

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
    if (!sectionRef?.current) return;

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
    const updateNavbarTop = () => {
      const sedanSection = sedanRef.current;
      const navbarOverlay = navbarOverlayRef.current;
      if (!navbarOverlay) return;

      // If sections are not mounted yet, keep it in a safe visible default.
      if (!sedanSection) {
        navbarOverlay.style.top = window.innerWidth <= 768 ? "44%" : "58%";
        return;
      }

      const sectionTop = sedanSection.getBoundingClientRect().top;
      const currentWidth = window.innerWidth;

      if (sectionTop <= 300) {
        navbarOverlay.style.top = "12%";
      } else if (currentWidth <= 768) {
        const minWidth = 390;
        const maxWidth = 768;
        const maxTop = 58;
        const minTop = 43;

        const clampedWidth = Math.min(
          Math.max(currentWidth, minWidth),
          maxWidth,
        );
        const t = (clampedWidth - minWidth) / (maxWidth - minWidth);
        const interpolatedTop = minTop + t * (maxTop - minTop);

        navbarOverlay.style.top = `${interpolatedTop}%`;
      } else {
        navbarOverlay.style.top = "58%";
      }
    };

    // Run after paint so refs are ready after async/login route transitions.
    const raf = window.requestAnimationFrame(updateNavbarTop);

    window.addEventListener("scroll", updateNavbarTop, { passive: true });
    window.addEventListener("resize", updateNavbarTop);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", updateNavbarTop);
      window.removeEventListener("resize", updateNavbarTop);
    };
  }, [fleetDetailsUnits.length]);

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
        cardRef.current = null;
      }, 500);
    }
  };

  const handleImageClick = (newImage) => {
    setCurrentOverlayImage(newImage.base64); // Update the overlay image
  };

  return (
    <div className="fleet-details">
      <Header openBooking={openBooking} />

      {/* <div className="navbar-overlay" ref={navbarOverlayRef}>
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
      </div> */}




<div className="navbar-overlay">
  <div className={`floating-nav ${navOpen ? "open" : ""}`}>

    <button
      className="floating-nav-main"
      onClick={() => setNavOpen(!navOpen)}
    >
      <FiMenu />
    </button>


    <button
      className={`floating-nav-item sedan ${activeSection === "sedan" ? "active" : ""}`}
      onClick={() => scrollToSection(sedanRef)}
    >
      SEDAN
    </button>

    <button
      className={`floating-nav-item suv ${activeSection === "suv" ? "active" : ""}`}
      onClick={() => scrollToSection(suvRef)}
    >
      SUV
    </button>

    <button
      className={`floating-nav-item mpv ${activeSection === "mpv" ? "active" : ""}`}
      onClick={() => scrollToSection(mpvRef)}
    >
      MPV
    </button>

    <button
      className={`floating-nav-item van ${activeSection === "van" ? "active" : ""}`}
      onClick={() => scrollToSection(vanRef)}
    >
      VAN
    </button>

    <button
      className={`floating-nav-item pickup ${activeSection === "pickup" ? "active" : ""}`}
      onClick={() => scrollToSection(pickupRef)}
    >
      PICKUP
    </button>
<div 
  className="gauge-needle"
  style={{
    transform: activeSection === 'sedan' ? 'translate(-50%, -100%) rotate(0deg)' :
               activeSection === 'suv' ? 'translate(-50%, -100%) rotate(23deg)' :
               activeSection === 'mpv' ? 'translate(-50%, -100%) rotate(45deg)' :
               activeSection === 'van' ? 'translate(-50%, -100%) rotate(67deg)' :
               activeSection === 'pickup' ? 'translate(-50%, -100%) rotate(90deg)' :
               'translate(-50%, -100%) rotate(0deg)'
  }}
></div>


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
              loading={index === currentSlide ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={index === currentSlide ? "high" : "auto"}
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
        <section className="sedan-diagonal-section">
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
                      src={
                        fetchedImages[car.imageId]?.base64 ||
                        "/assets/images/default.png"
                      }
                      alt={car.name}
                      className="car-image"
                      loading="lazy"
                      decoding="async"
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

                     <div style={{ display: "flex", justifyContent: "center" }}>
  <span className={`availability-badge ${isUnitBooked(car) ? "ongoing" : "available"}`}>
    {isUnitBooked(car) ? "Ongoing Rent" : "Available"}
  </span>
</div>


                    </div>
                                          <div className="car-specs-grid">
                        <div className="spec-item">
                          <img src={specificationIcons["Fuel"]} alt="Fuel" />
                          <span style={{textTransform:"capitalize"}}>{car.details?.specifications?.Fuel || "-"}</span>
                        </div>
                        <div className="spec-item">
                          <img src={specificationIcons["Capacity"]} alt="Capacity" />
                          <span>{car.details?.specifications?.Capacity || "-"} Capacity</span>
                        </div>
                        <div className="spec-item">
                          <img src={specificationIcons["Transmission"]} alt="Transmission" />
                          <span>{car.details?.specifications?.Transmission || "-"}</span>
                        </div>
                        <div className="spec-item">
                          <img src={specificationIcons["Color"]} alt="Color" />
                          <span>{car.details?.specifications?.Color || "-"}</span>
                        </div>
                      </div>

                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {suvUnits.length > 0 && (
        <section className="suv-diagonal-section">
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
                      loading="lazy"
                      decoding="async"
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


                     <div style={{ display: "flex", justifyContent: "center" }}>
  <span className={`availability-badge ${isUnitBooked(car) ? "ongoing" : "available"}`}>
    {isUnitBooked(car) ? "Ongoing Rent" : "Available"}
  </span>
</div>


                    </div>
                                          <div className="car-specs-grid">
                        <div className="spec-item">
                          <img src={specificationIcons["Fuel"]} alt="Fuel" />
                          <span style={{textTransform:"capitalize"}}>{car.details?.specifications?.Fuel || "-"}</span>
                        </div>
                        <div className="spec-item">
                          <img src={specificationIcons["Capacity"]} alt="Capacity" />
                          <span>{car.details?.specifications?.Capacity || "-"} Capacity</span>
                        </div>
                        <div className="spec-item">
                          <img src={specificationIcons["Transmission"]} alt="Transmission" />
                          <span>{car.details?.specifications?.Transmission || "-"}</span>
                        </div>
                        <div className="spec-item">
                          <img src={specificationIcons["Color"]} alt="Color" />
                          <span>{car.details?.specifications?.Color || "-"}</span>
                        </div>
                      </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {mpvUnits.length > 0 && (
        <section className="mpv-diagonal-section">
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
                      loading="lazy"
                      decoding="async"
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


                     <div style={{ display: "flex", justifyContent: "center" }}>
  <span className={`availability-badge ${isUnitBooked(car) ? "ongoing" : "available"}`}>
    {isUnitBooked(car) ? "Ongoing Rent" : "Available"}
  </span>
</div>


                    </div>
                                          <div className="car-specs-grid">
                        <div className="spec-item">
                          <img src={specificationIcons["Fuel"]} alt="Fuel" />
                          <span style={{textTransform:"capitalize"}}>{car.details?.specifications?.Fuel || "-"}</span>
                        </div>
                        <div className="spec-item">
                          <img src={specificationIcons["Capacity"]} alt="Capacity" />
                          <span>{car.details?.specifications?.Capacity || "-"} Capacity</span>
                        </div>
                        <div className="spec-item">
                          <img src={specificationIcons["Transmission"]} alt="Transmission" />
                          <span>{car.details?.specifications?.Transmission || "-"}</span>
                        </div>
                        <div className="spec-item">
                          <img src={specificationIcons["Color"]} alt="Color" />
                          <span>{car.details?.specifications?.Color || "-"}</span>
                        </div>
                      </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {vanUnits.length > 0 && (
        <section className="van-diagonal-section">
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
                      loading="lazy"
                      decoding="async"
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


                     <div style={{ display: "flex", justifyContent: "center" }}>
  <span className={`availability-badge ${isUnitBooked(car) ? "ongoing" : "available"}`}>
    {isUnitBooked(car) ? "Ongoing Rent" : "Available"}
  </span>
</div>


                    </div>
                                          <div className="car-specs-grid">
                        <div className="spec-item">
                          <img src={specificationIcons["Fuel"]} alt="Fuel" />
                          <span style={{textTransform:"capitalize"}}>{car.details?.specifications?.Fuel || "-"}</span>
                        </div>
                        <div className="spec-item">
                          <img src={specificationIcons["Capacity"]} alt="Capacity" />
                          <span>{car.details?.specifications?.Capacity || "-"} Capacity</span>
                        </div>
                        <div className="spec-item">
                          <img src={specificationIcons["Transmission"]} alt="Transmission" />
                          <span>{car.details?.specifications?.Transmission || "-"}</span>
                        </div>
                        <div className="spec-item">
                          <img src={specificationIcons["Color"]} alt="Color" />
                          <span>{car.details?.specifications?.Color || "-"}</span>
                        </div>
                      </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {pickupUnits.length > 0 && (
        <section className="pickup-diagonal-section">
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
                      loading="lazy"
                      decoding="async"
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

                     <div style={{ display: "flex", justifyContent: "center" }}>
  <span className={`availability-badge ${isUnitBooked(car) ? "ongoing" : "available"}`}>
    {isUnitBooked(car) ? "Ongoing Rent" : "Available"}
  </span>
</div>


                    </div>
                                          <div className="car-specs-grid">
                        <div className="spec-item">
                          <img src={specificationIcons["Fuel"]} alt="Fuel" />
                          <span style={{textTransform:"capitalize"}}>{car.details?.specifications?.Fuel || "-"}</span>
                        </div>
                        <div className="spec-item">
                          <img src={specificationIcons["Capacity"]} alt="Capacity" />
                          <span>{car.details?.specifications?.Capacity || "-"} Capacity</span>
                        </div>
                        <div className="spec-item">
                          <img src={specificationIcons["Transmission"]} alt="Transmission" />
                          <span>{car.details?.specifications?.Transmission || "-"}</span>
                        </div>
                        <div className="spec-item">
                          <img src={specificationIcons["Color"]} alt="Color" />
                          <span>{car.details?.specifications?.Color || "-"}</span>
                        </div>
                      </div>
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
                  className={`overlay-availability ${isUnitBooked(expandedCard) ? "rented" : "available"}`}
                >
                  {isUnitBooked(expandedCard) ? "Ongoing Rent" : "Available"}
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

                        // Check if this is Features or Trunk and format as bullets
                        const isBulletField =
                          key === "Features" || key === "Trunk";

                        // Parse value into array if needed
                        let displayValue = value;
                        if (isBulletField) {
                          if (Array.isArray(value)) {
                            displayValue = value;
                          } else if (
                            typeof value === "string" &&
                            value.trim()
                          ) {
                            displayValue = value
                              .split(",")
                              .map((v) => v.trim())
                              .filter((v) => v);
                          }
                        }

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
                              {isBulletField && Array.isArray(displayValue) ? (
                                <>
                                  {key}:
                                  <div className="bullet-list">
                                    {displayValue.map((item, i) => (
                                      <div key={i} className="bullet-item">
                                        • {item}
                                      </div>
                                    ))}
                                  </div>
                                </>
                              ) : (
                                <>
                                  {key}: <strong>{value}</strong>
                                </>
                              )}
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
                      carId: expandedCard.id,
                      carName: expandedCard.name,
                      carType: expandedCard.carType,
                      image:
                        fetchedImages[expandedCard.imageId]?.base64 ||
                        "/assets/images/default.png",
                      drivingOption: "Self-Drive",
                      pickupOption: "Pickup",
                      isReservedRequest: isUnitBooked(expandedCard),
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
            data-pswp-width={overlayImageSizes[image.base64]?.width || 1200}
            data-pswp-height={overlayImageSizes[image.base64]?.height || 800}
            data-pswp-index={index}
          >
            <span aria-hidden="true" />
          </a>
        ))}
      </div>

      <div ref={carouselGalleryRef} style={{ display: "none" }}>
        {carouselImages.map((src, index) => (
          <a
            key={index}
            href={src}
            data-pswp-width={fleetCarouselImageSizes[src]?.width || 1200}
            data-pswp-height={fleetCarouselImageSizes[src]?.height || 800}
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
