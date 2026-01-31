"use client";
// CustomerTestimonials.js
import React, { useEffect, useRef, useState } from "react";
import { useUser } from "./lib/UserContext";

/* FALLBACK STATIC DATA */
const fallbackTestimonials = [
  {
    img: "/assets/images/customer1.jpg" || "/assets/images/default.png",
    name: "Bruce Hardy",
    date: "March 15, 2025",
    review:
      "I have had the pleasure of using EMNL car rental on 2 occasions now...",
    rating: 5,
  },
  {
    img: "/assets/images/customer2.jpg" || "/assets/images/default.png",
    name: "Mark Smith",
    date: "March 10, 2025",
    review: "Loved the experience!",
    rating: 5,
  },
  {
    img: "/assets/images/customer3.jpg" || "/assets/images/default.png",
    name: "Vera Duncan",
    date: "Feb 28, 2025",
    review: "Highly recommended!",
    rating: 5,
  },
  {
    img: "/assets/images/customer4.jpg" || "/assets/images/default.png",
    name: "Sophia Lopez",
    date: "Feb 20, 2025",
    review: "Exceptional service!",
    rating: 5,
  },
  {
    img: "/assets/images/customer5.jpg" || "/assets/images/default.png",
    name: "Daniel Carter",
    date: "Jan 30, 2025",
    review: "Great rental options!",
    rating: 4,
  },
];

/* ReviewBox */
function ReviewBox({ text }) {
  const ref = useRef(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const isScrollable = el.scrollHeight > el.clientHeight;
      setCanScrollUp(isScrollable && el.scrollTop > 0);
      setCanScrollDown(
        isScrollable && el.scrollTop + el.clientHeight < el.scrollHeight,
      );
    };

    requestAnimationFrame(update);

    el.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [text]);

  return (
    <div className="review-wrapper">
      <span className="quote-icon">“</span>
      <p className="review" ref={ref}>
        {text}
      </p>
      <div className={`scroll-indicator top ${canScrollUp ? "" : "hidden"}`}>
        ▲
      </div>
      <div
        className={`scroll-indicator bottom ${canScrollDown ? "" : "hidden"}`}
      >
        ▼
      </div>
    </div>
  );
}

/* Slider Base */
const TestimonialSliderBase = ({
  testimonialsData,
  reverse = false,
  isPaused,
}) => {
  const containerRef = useRef(null);
  const speedRef = useRef(1);
  const positionRef = useRef(0);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const isPausedRef = useRef(isPaused);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId;

    requestAnimationFrame(() => {
      const halfWidth = container.scrollWidth / 2;
      positionRef.current = -halfWidth / 2;
      container.style.transform = `translateX(${positionRef.current}px)`;

      const animate = () => {
        if (!isDraggingRef.current && !isPausedRef.current) {
          positionRef.current += reverse ? speedRef.current : -speedRef.current;
        }

        const resetLeft = -halfWidth;
        const resetRight = 0;

        if (positionRef.current <= resetLeft)
          positionRef.current = resetRight - 25;
        if (positionRef.current >= resetRight)
          positionRef.current = resetLeft + 25;

        container.style.transform = `translateX(${positionRef.current}px)`;
        animationFrameId = requestAnimationFrame(animate);
      };

      animationFrameId = requestAnimationFrame(animate);
    });

    return () => cancelAnimationFrame(animationFrameId);
  }, [reverse]);

  const startDrag = (x) => {
    isDraggingRef.current = true;
    dragStartXRef.current = x;
  };

  const moveDrag = (x) => {
    if (!isDraggingRef.current) return;
    const delta = x - dragStartXRef.current;
    dragStartXRef.current = x;
    positionRef.current += delta;
    containerRef.current.style.transform = `translateX(${positionRef.current}px)`;
  };

  const endDrag = () => {
    isDraggingRef.current = false;
  };

  return (
    <div
      className={`testimonials-container ${reverse ? "back" : "front"}`}
      ref={containerRef}
      onMouseEnter={() => (speedRef.current = 0.2)}
      onMouseLeave={() => ((speedRef.current = 0.4), endDrag())}
      onMouseDown={(e) => startDrag(e.clientX)}
      onMouseMove={(e) => moveDrag(e.clientX)}
      onMouseUp={endDrag}
      onTouchStart={(e) => startDrag(e.touches[0].clientX)}
      onTouchMove={(e) => moveDrag(e.touches[0].clientX)}
      onTouchEnd={endDrag}
    >
      {[...testimonialsData, ...testimonialsData].map((t, i) => (
        <div key={i} className="testimonial-card">
          <div className="testimonial-image">
            <img src={t.img} alt={t.name} />
          </div>
          <h3>{t.name}</h3>
          <p className="date">{t.date}</p>
          <ReviewBox text={t.review} />
          <div className="rating">{"★".repeat(t.rating)}</div>
        </div>
      ))}
    </div>
  );
};

/* MAIN COMPONENT */
export default function CustomerTestimonials() {
  const { fetchReviews } = useUser();
  const [isPaused, setIsPaused] = useState(false);
  const [testimonials, setTestimonials] = useState(fallbackTestimonials);

  /* FETCH REVIEWS */
  useEffect(() => {
    const loadReviews = async () => {
      const res = await fetchReviews();
      if (!res?.success || !Array.isArray(res.reviews)) return;

      const mapped = res.reviews.map((r) => ({
        img:
          typeof r.img === "string" && r.img.startsWith("data:image")
            ? r.img
            : "/assets/images/default.png",
        name: r.name || "Anonymous",
        date: r.date || "",
        review: r.review || "",
        rating: Number(r.rating) || 5,
      }));

      if (mapped.length) setTestimonials(mapped);
    };

    loadReviews();
  }, [fetchReviews]);

  const testimonialsBack = [...testimonials].reverse();

  return (
    <section className="customer-testimonials">
      <h2>Customer Testimonials</h2>
      <p>Hear from our satisfied customers.</p>

      <div className="testimonials-wrapper">
        <TestimonialSliderBase
          testimonialsData={testimonials}
          isPaused={isPaused}
        />
        <TestimonialSliderBase
          testimonialsData={testimonialsBack}
          reverse
          isPaused={isPaused}
        />

        <button className="pause-button" onClick={() => setIsPaused((p) => !p)}>
          {isPaused ? "▶ Play" : "❚❚ Pause"}
        </button>
      </div>
    </section>
  );
}
