"use client";
import React, { useState } from "react";
import "./CompanyMap.css";

const CompanyMap = () => {
  return (
    <div className="company-map-container">
      {/* Header section */}
      <div className="header-section">
        <h2>Our Location</h2>
        <p>Find your way to our office with ease</p>
      </div>

      {/* Map and Info Section */}
      <div className="map-info-container">
        {/* Map section */}
        <div className="map-section">
          <div className="map-responsive">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2008530.3532314168!2d122.6684711798829!3d10.507688090269225!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3307f13b2918057b%3A0xfedc2ea58ff6bc11!2sEMNL%20CAR%20RENTAL%20SERVICES%20-%20ORMOC%20CITY!5e0!3m2!1sen!2sph!4v1719292558129!5m2!1sen!2sph"
              width="600"
              height="450"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
            ></iframe>
          </div>
        </div>

        {/* Info section */}
        <div className="info-section">
          <h3>EMNL Contact Information</h3>

          <p>
            <strong
              style={{
                fontFamily: "Montserrat, sans-serif",
                fontWeight: 900,
                textTransform: "uppercase",
              }}
            >
              Phone:
            </strong>{" "}
            <br />
            <a href="tel:+639123456789" className="contact-link">
              +63 912 345 6789
            </a>
          </p>
          <p>
            <strong
              style={{
                fontFamily: "Montserrat, sans-serif",
                fontWeight: 900,
                textTransform: "uppercase",
              }}
            >
              Email:
            </strong>{" "}
            <br />
            <a href="mailto:emnl@gmail.com" className="contact-link">
              emnl@gmail.com
            </a>
          </p>
          <p>
            <strong
              style={{
                fontFamily: "Montserrat, sans-serif",
                fontWeight: 900,
                textTransform: "uppercase",
              }}
            >
              Location:
            </strong>{" "}
            <br />
            <a
              href="https://www.google.com/maps/place/EMNL+CAR+RENTAL+-+ORMOC/@11.0238166,124.5954816,227a,35y,97.13h,45t/data=!3m1!1e3!4m9!1m2!2m1!1sPurok+7,+Brgy.+Dona+Feliza+Z.+Mejia,+Ormoc+City,+6541+Leyte,+Philippines!3m5!1s0x3307f13b2918057b:0xfedc2ea58ff6bc11!8m2!3d11.0230411!4d124.5974016!16s%2Fg%2F11kqrrmsfs?entry=ttu&g_ep=EgoyMDI1MDgxMy4wIKXMDSoASAFQAw%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-link"
            >
              Brgy. Dona Feliza Z. Mejia, Corner Berlin St. and, Madrid, Ormoc
              City, 6541 Leyte
            </a>
          </p>

          <h4>Follow Us</h4>
          <div className="social-links">
            {/* Facebook */}
            <a
              href="https://www.facebook.com/EMNLOrmoc"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/assets/fb-filled.png"
                alt="Facebook"
                className="social-icon"
              />
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/emnl.rentals.ph"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/assets/ig-filled.png"
                alt="Instagram"
                className="social-icon"
              />
            </a>

            <a
              href="https://www.tiktok.com/@emnl.rentals.ph"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/assets/tk-filled.png"
                alt="Tiktok"
                className="social-icon"
              />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyMap;
