import React, { useEffect, useRef } from "react";
import "./CTA_Section.css";

const CTA_Section = () => {
  const readyRef = useRef(null);
  const middleRef = useRef(null);
  const roadRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const triggerPoint = window.innerHeight * 0.8; // 80% of viewport height
      const elements = [readyRef.current, middleRef.current, roadRef.current];

      elements.forEach((el, index) => {
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top < triggerPoint) {
            el.classList.add("show");
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check on load
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="cta-section">
      <div className="cta-large-text">
        <span ref={readyRef} className="cta-word cta-ready">
          READY
        </span>
        <span ref={middleRef} className="cta-word cta-middle">
          TO HIT THE
        </span>
        <span ref={roadRef} className="cta-word cta-road">
          ROAD?
        </span>
      </div>
    </section>
  );
};

export default CTA_Section;
