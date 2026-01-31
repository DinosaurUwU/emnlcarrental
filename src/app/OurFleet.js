"use client";
import React from "react";
import { useRouter } from "next/navigation";
import "./OurFleet.css";

function OurFleet() {
  const router = useRouter();

  const fleetCategories = [
    {
      name: "SEDAN",
      description:
        "Perfect for city drives and business trips, offering fuel efficiency and comfort.",
      image: "/assets/images/sedan.png",
      path: "/fleet-details/sedan",
    },
    {
      name: "SUV",
      description:
        "Spacious and powerful, ideal for family trips and off-road adventures.",
      image: "/assets/images/suv.png",
      path: "/fleet-details/suv",
    },
    {
      name: "MPV",
      description:
        "Versatile and roomy, designed for group travel and extra luggage space.",
      image: "/assets/images/mpv.png",
      path: "/fleet-details/mpv",
    },
    {
      name: "VAN",
      description:
        "Reliable and comfortable for large groups, ensuring a smooth journey.",
      image: "/assets/images/van.png",
      path: "/fleet-details/van",
    },
    {
      name: "PICKUP",
      description:
        "Tough and versatile, perfect for hauling cargo or rugged terrains.",
      image: "/assets/images/pickup.png",
      path: "/fleet-details/pickup",
    },
  ];

  const handleCategoryClick = (path) => {
    router.push(path);
  };

  return (
    <div className="our-fleet">
      <h2>Our Fleet</h2>
      <p className="fleet-description">
        Discover your perfect ride from our diverse fleet, designed for every
        journey and every destination.
      </p>

      <div className="fleet-cards">
        {fleetCategories.map((category, index) => (
          <div
            key={index}
            className="fleet-card"
            onClick={() => handleCategoryClick(category.path)}
          >
            <div className="img-container">
              <img src={category.image} alt={category.name} />
            </div>

            {/* Container overlay with gradient */}
            <div className="content-overlay">
              <div className="content-wrapper">
                <h3>{category.name}</h3>
                <p>{category.description}</p>
              </div>
              <button
                className="view-details"
                onClick={() => handleCategoryClick(category.path)}
              >
                View
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OurFleet;
