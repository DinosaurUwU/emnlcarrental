"use client";
// Footer.js
import React, { useState } from "react";
import "./Footer.css";
import Link from "next/link";

const Footer = () => {
  const [fbHovered, setFbHovered] = useState(false);
  const [igHovered, setIgHovered] = useState(false);
  const [tkHovered, setTkHovered] = useState(false);

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section-about">
          <img
            src="/assets/white-logo.png"
            alt="Company Logo"
            className="footer-logo"
          />
          <p className="footer-content-p">
            Experience the thrill of the drive with EMNL. Enjoy top-notch
            service, unbeatable rates, and the freedom to explore.
          </p>
        </div>
        <div className="footer-section links">
          <h3 className="footer-section-h3">Information</h3>
          <ul className="footer-section-ul">
            <li>
              <Link href="/about">About Us</Link>
            </li>
            <li>
              <Link href="/info#help-center">Help Center</Link>
            </li>
            <li>
              <Link href="/info#faqs">FAQs</Link>
            </li>
            <li>
              <Link href="/info#privacy-policy">Privacy Policy</Link>
            </li>
            <li>
              <Link href="/info#terms">Terms & Conditions</Link>
            </li>
          </ul>
        </div>
        <div className="footer-section contacts">
          <h3 className="footer-section-h3">Contacts</h3>
          <div className="contact">
            <span className="footer-section-span">
              <i className="fas fa-phone"></i>{" "}
              <a href="tel:+639123456789" className="footer-link">
                +63 975 477 8178
              </a>
            </span>
            <span className="footer-section-span">
              <i className="fas fa-envelope"></i>{" "}
              <a
                href="mailto:rentalinquiries.emnl@gmail.com"
                className="footer-link"
              >
                rentalinquiries.emnl@gmail.com
              </a>
            </span>
            <span className="footer-section-span">
              <i className="fas fa-map-marker-alt"></i>{" "}
              <a
                href="https://www.google.com/maps/place/EMNL+CAR+RENTAL+-+ORMOC/@11.0238166,124.5954816,227a,35y,97.13h,45t/data=!3m1!1e3!4m9!1m2!2m1!1sPurok+7,+Brgy.+Dona+Feliza+Z.+Mejia,+Ormoc+City,+6541+Leyte,+Philippines!3m5!1s0x3307f13b2918057b:0xfedc2ea58ff6bc11!8m2!3d11.0230411!4d124.5974016!16s%2Fg%2F11kqrrmsfs?entry=ttu&g_ep=EgoyMDI1MDgxMy4wIKXMDSoASAFQAw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                Brgy. Dona Feliza Z. Mejia, Corner Berlin St. and, Madrid, Ormoc
                City, 6541 Leyte
              </a>
            </span>
          </div>
        </div>

        <div className="footer-section social">
          <h3 className="footer-section-h3">Follow Us</h3>
          <div className="social-icons">
            <a
              href="https://www.facebook.com/EMNLOrmoc"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon"
              onMouseEnter={() => setFbHovered(true)}
              onMouseLeave={() => setFbHovered(false)}
            >
              {fbHovered ? (
                <img src="/assets/fb-filled.png" alt="Facebook" />
              ) : (
                <img src="/assets/fb-outlined.svg" alt="Facebook" />
              )}
            </a>

            <a
              href="https://www.instagram.com/emnl.rentals.ph"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon"
              onMouseEnter={() => setIgHovered(true)}
              onMouseLeave={() => setIgHovered(false)}
            >
              {igHovered ? (
                <img src="/assets/ig-filled.png" alt="Instagram" />
              ) : (
                <img src="/assets/ig-outlined.svg" alt="Instagram" />
              )}
            </a>

            <a
              href="https://www.tiktok.com/@emnl.rentals.ph"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon"
              onMouseEnter={() => setTkHovered(true)}
              onMouseLeave={() => setTkHovered(false)}
            >
              {tkHovered ? (
                <img src="/assets/tk-filled.png" alt="Tiktok" />
              ) : (
                <img src="/assets/tk-outlined.svg" alt="Tiktok" />
              )}
            </a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p className="footer-content-p">
          &copy; {new Date().getFullYear()} EMNL. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
