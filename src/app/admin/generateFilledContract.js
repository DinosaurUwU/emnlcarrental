// generateFilledContract.js
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";

// Load binary file as blob from public folder
export const generateFilledContract = async (bookingData) => {
  const response = await fetch("/templates/contract-template.docx");
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();

  const zip = new PizZip(arrayBuffer);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

  const fullName = [
    bookingData.firstName,
    bookingData.middleName,
    bookingData.surname,
  ]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();

  // Add ordinal suffix function
  const getOrdinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const startDateObj = new Date(bookingData.startDate);
  const contractDay = getOrdinal(startDateObj.getDate()); // e.g. "26th"
  const contractMonth = startDateObj.toLocaleString("default", {
    month: "long",
  }); // e.g. "June"
  const contractYear = startDateObj.getFullYear(); // e.g. 2025

  doc.setData({
    fullName,
    email: bookingData.email,
    contact: (bookingData.contact || "").toUpperCase(),
    address: (bookingData.address || "").toUpperCase(),
    carName: (bookingData.carName || "").toUpperCase(),
    plateNo: (bookingData.plateNo || "").toUpperCase(),
    startDate: bookingData.startDate,
    startTime: bookingData.startTime,
    endDate: bookingData.endDate,
    endTime: bookingData.endTime,
    purpose: (bookingData.purpose || "").toUpperCase(),
    location: (bookingData.location || "").toUpperCase(),
    dailyRate: `₱${bookingData.discountedRate?.toLocaleString() || "0.00"}`,
    totalPrice: `₱${bookingData.totalPrice?.toLocaleString() || "0.00"}`,
    extraHours: bookingData.rentalDuration?.extraHours
      ? `${bookingData.rentalDuration.extraHours} hour${bookingData.rentalDuration.extraHours > 1 ? "s" : ""}`
      : "0 hour",
    extraHourCharge: `₱${bookingData.extraHourCharge?.toLocaleString() || "0.00"}`,
    durationSummary: bookingData.rentalDuration?.isFlatRateSameDay
      ? `1 Day / for ${bookingData.rentalDuration.extraHours || 1} hr${bookingData.rentalDuration.extraHours > 1 ? "s" : ""} only`
      : `${bookingData.billedDays} Day${bookingData.billedDays > 1 ? "s" : ""} / ${bookingData.billedDays * 24}hrs`,
    contractDay,
    contractMonth,
    contractYear,
    unitCount: 1,
  });

  try {
    doc.render();
  } catch (error) {
    const e = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      properties: error.properties,
    };
    console.error("❌ Docxtemplater render error:", JSON.stringify(e, null, 2));
    throw error;
  }

  const out = doc.getZip().generate({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  const fileName = `${bookingData.surname}_${bookingData.firstName}_${bookingData.startDate}_Rental_Contract.docx`;
  saveAs(out, fileName);
};
