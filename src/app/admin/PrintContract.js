//PrintContract.js
import React from "react";

const PrintContract = ({ booking }) => {
  const fullName = [booking.firstName, booking.middleName, booking.surname]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className="contract-container"
      style={{
        padding: "40px",
        fontFamily: "Arial",
        textAlign: "justify",
        lineHeight: 1.5,
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "5px" }}>
        EMNL CAR RENTAL SERVICES
      </h2>
      <p style={{ textAlign: "center", marginBottom: "30px" }}>
        WASHINGTON ST., NEW YORK CITY, USA <br />
        emnl@gmail.com | +63 975 4778 178
      </p>

      <h3 style={{ textAlign: "center" }}>
        TERMS AND CONDITIONS FOR RENTED VEHICLES
      </h3>

      <p>
        <strong>KNOW ALL MEN THESE PRESENTS:</strong> <br />
        {"     "}The agreement made and executed on the <strong>___</strong> day
        of <strong>_________</strong> 20__, by and between the EMNL CAR RENTAL
        SERVICES, a company duly organized and existing under and by virtue of
        the Philippines by its Owner/Proprietor PETER HOWARD, of legal age,
        Filipino, married and a resident of Brgy, Dona Feliza Z. Mejia, Ormoc
        City, Leyte. Hereinafter called the <strong>LESSOR/COMPANY</strong>;
      </p>

      <p>
        And <strong style={{ textDecoration: "underline" }}>{fullName}</strong>{" "}
        of legal age, citizen, single/married, and a resident of{" "}
        <strong style={{ textDecoration: "underline" }}>
          {booking.location || "__________"}
        </strong>
        , with email address/Facebook name of{" "}
        <strong style={{ textDecoration: "underline" }}>
          {booking.email || "__________"}
        </strong>
        , and an active mobile number{" "}
        <strong style={{ textDecoration: "underline" }}>
          {booking.contact || "__________"}
        </strong>
        . Hereinafter called the <strong>LESSER/RENTER</strong>;
      </p>

      <p>
        WITNESSETH: THE LESSOR/COMPANY hereby lends to the LESSER/RENTER a ___
        unit vehicle described as{" "}
        <strong style={{ textDecoration: "underline" }}>
          {booking.carName || "_________"}
        </strong>{" "}
        with a plate/conduction number <strong>__________</strong>, and both
        parties acknowledge and agree to the following terms and conditions:
      </p>

      <ol>
        <li>
          <strong>AMOUNT OF THE LEASE/RENTAL & TERMS OF PAYMENT:</strong> The
          amount of{" "}
          <strong>₱{booking.totalPrice?.toLocaleString() || "___"}</strong>, to
          be paid in full and in CASH upon signing of this contract.
        </li>
        <li>
          <strong>PERIOD OF RENTAL:</strong> From{" "}
          <strong>
            {booking.startDate} {booking.startTime}
          </strong>{" "}
          to{" "}
          <strong>
            {booking.endDate} {booking.endTime}
          </strong>
          , covering{" "}
          {booking.rentalDuration?.isFlatRateSameDay
            ? `1 Day / for ${booking.rentalDuration.extraHours || 1} hr${
                booking.rentalDuration.extraHours > 1 ? "s" : ""
              } only`
            : `${booking.billedDays} Day${
                booking.billedDays > 1 ? "s" : ""
              } / ${booking.billedDays * 24} hrs`}
          {booking.rentalDuration?.extraHours > 0 &&
            ` (+${booking.rentalDuration.extraHours} hr${
              booking.rentalDuration.extraHours > 1 ? "s" : ""
            } | ₱${booking.extraHourCharge || 0})`}
        </li>
        <li>
          <strong>SECURITY DEPOSIT:</strong> A deposit of ₱5,000 shall be paid
          and is refundable upon proper return, barring any damages or loss.
        </li>

        <li>
          <strong>FAITHFUL COMPLIANCE:</strong> Both parties agree to honor the
          stipulations above. Any breach will be subject to legal action.
        </li>
      </ol>

      <p style={{ marginTop: "40px" }}>
        DATE RENTED & TIME:{" "}
        <strong style={{ textDecoration: "underline" }}>
          {booking.startDate} {booking.startTime}
        </strong>{" "}
        <br />
        DATE RETURNED & TIME:{" "}
        <strong style={{ textDecoration: "underline" }}>
          {booking.endDate} {booking.endTime}
        </strong>{" "}
        <br />
        DAILY RENTAL RATE:{" "}
        <strong style={{ textDecoration: "underline" }}>
          ₱{booking.discountedRate || "___"}
        </strong>{" "}
        <br />
        DECLARED DESTINATION:{" "}
        <strong style={{ textDecoration: "underline" }}>
          {booking.location || "___"}
        </strong>{" "}
        <br />
        CAR PLATE #: <strong>__________</strong> <br />
        CAR UNIT & MODEL:{" "}
        <strong style={{ textDecoration: "underline" }}>
          {booking.carName || "___"}
        </strong>{" "}
        <br />
        PURPOSE OF RENTAL:{" "}
        <strong style={{ textDecoration: "underline" }}>
          {booking.purpose || "N/A"}
        </strong>{" "}
        <br />
        EXTENDED HOURS/DAYS:{" "}
        <strong>{booking.rentalDuration?.extraHours || "___"} hr</strong>
      </p>

      <p style={{ marginTop: "60px" }}>
        ___________________________
        <br />
        RELEASED BY
      </p>

      <p style={{ marginTop: "60px" }}>
        ___________________________
        <br />
        RENTER SIGNATURE OVER PRINTED NAME
      </p>
    </div>
  );
};

export default PrintContract;
