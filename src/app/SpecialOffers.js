import React, { useState } from "react";
import "./SpecialOffers.css";

function SpecialOffers() {
  const offers = [
    {
      image: "/assets/images/offer1.jpg",
      title: "Summer Special",
      discount: "30% OFF",
      description:
        "Enjoy our Summer Special discount! Get 30% off on all rides booked before the end of the season.",
    },
    {
      image: "/assets/images/offer2.jpg",
      title: "Weekend Getaway",
      discount: "25% OFF",
      description:
        "Plan a perfect weekend getaway with a 25% discount on selected destinations.",
    },
    {
      image: "/assets/images/offer3.jpg",
      title: "Early Bird",
      discount: "20% OFF",
      description:
        "Book your ride early and save 20%! Available for bookings made 2 weeks in advance.",
    },
  ];

  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [hoverStyle, setHoverStyle] = useState({
    transform: "rotateX(0deg) rotateY(0deg)",
  });

  const handleNext = () => {
    if (!animating) {
      setAnimating(true);
      setCurrent((current + 1) % offers.length);
      setTimeout(() => setAnimating(false), 600);
    }
  };

  const handlePrev = () => {
    if (!animating) {
      setAnimating(true);
      setCurrent((current - 1 + offers.length) % offers.length);
      setTimeout(() => setAnimating(false), 600);
    }
  };

  const getClass = (index) => {
    const position = (index - current + offers.length) % offers.length;
    if (position === 0) return "last";
    if (position === 1) return "mid";
    return "active";
  };

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (centerY - y) / 10; // Adjust the multiplier to control tilt intensity
    const rotateY = (x - centerX) / 10; // Adjust the multiplier to control tilt intensity

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = (e) => {
    const card = e.currentTarget;
    card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
  };

  const handleCardClick = (index) => {
    if (!animating) {
      setAnimating(true);
      setCurrent(index);
      setTimeout(() => setAnimating(false), 600);
    }
  };

  return (
    <section className="special-offers">
      <h2>Special Offers & Discounts</h2>
      <p>Take advantage of our latest deals and save big on your next ride.</p>
      <div className="offers-carousel">
        {offers.map((offer, index) => (
          <div
            key={index}
            className={`offer-card ${getClass(index)}`}
            style={getClass(index) === "active" ? hoverStyle : {}}
            onMouseMove={getClass(index) === "active" ? handleMouseMove : null}
            onMouseLeave={
              getClass(index) === "active" ? handleMouseLeave : null
            }
          >
            <div className="offer-content">
              <div className="img-container">
                <img src={offer.image} alt={`Offer ${index + 1}`} />
              </div>
              <div className="offer-details">
                <h3>{offer.title}</h3>

                <h3 className="discount">{offer.discount}</h3>
                <p className="description">{offer.description}</p>
              </div>
              <div className="offer-extra">
                <div className="scissors"></div>
                <img
                  src="/assets/divider.png"
                  alt="Divider"
                  className="divider"
                />
                <img
                  src="/assets/barcode.png"
                  alt="Barcode"
                  className="barcode"
                />
                <span className="emnl">EMNL</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Custom Prev Button */}
      <button className="prev" onClick={handlePrev}>
        <img src="/assets/prev-btn.png" alt="Previous" />
      </button>

      {/* Custom Next Button */}
      <button className="next" onClick={handleNext}>
        <img src="/assets/nxt-btn.png" alt="Next" />
      </button>
    </section>
  );
}

export default SpecialOffers;
