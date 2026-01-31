// src/BookingSection.js
import React, { useState } from "react";
import "./BookingSection.css";

function BookingSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bookingDate, setBookingDate] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Perform submission logic
    console.log(
      `Booking submitted: ${name}, ${email}, ${phone}, ${bookingDate}`,
    );
    // Reset the form fields after submission
    setName("");
    setEmail("");
    setPhone("");
    setBookingDate("");
  };

  return (
    <section className="booking-section">
      <div className="booking-container">
        <h2>Book Your Ride</h2>
        <p className="booking-subtitle">
          Fill in the details and we'll give you a call!
        </p>
        <form onSubmit={handleSubmit} className="horizontal-form">
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Phone:</label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="bookingDate">Booking Date:</label>
            <input
              type="date"
              id="bookingDate"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              required
            />
          </div>
          <button type="submit">Submit</button>
        </form>
      </div>
    </section>
  );
}

export default BookingSection;
