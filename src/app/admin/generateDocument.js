// generateDocument.js
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";

// Common data preparation for both invoice and quotation
const prepareDocumentData = (bookingData) => {
  // Get values from rentalDuration
  const rentalDays = bookingData.rentalDuration?.days || bookingData.billedDays || 1;
  const extraHours = bookingData.rentalDuration?.extraHours || 0;
  const isFlatRateSameDay = bookingData.rentalDuration?.isFlatRateSameDay || false;
  
  // Extension rate (per hour)
  const extension = bookingData.extension || 0;
  
  // Extra hours charge
  const extraHoursCharge = bookingData.extraHourCharge || (extraHours * extension);

  // ========== RENTAL DURATION DISPLAY ==========
  // If 1 day: "1 Day / 24 hrs"
  // If more than 1 day: "X Days / Y hrs" (Y = total hours minus full days * 24)
  let durationDisplay = "";
  if (rentalDays === 1) {
    durationDisplay = "1 Day / 24 hrs";
  } else {
    // For multi-day, calculate remaining hours
    const totalHours = Math.floor((bookingData.rentalDuration?.actualSeconds || 0) / 3600);
    const remainingHours = totalHours - ((rentalDays - 1) * 24);
    durationDisplay = `${rentalDays} Days / ${remainingHours} hrs`;
  }

  // Add extra hours if present
  if (extraHours > 0) {
    durationDisplay += `\n(+${extraHours} hrs)`;
  }

  // ========== PRICE DISPLAY ==========
  // If no extra hours: "₱1500"
  // If has extra hours: "₱1500 | +2hrs"
  let priceDisplay = bookingData.discountedRate ? `₱${bookingData.discountedRate.toLocaleString()}` : "₱0";
  if (extraHours > 0 && extraHoursCharge > 0) {
    priceDisplay += ` | +${extraHours}hrs`;
  }

  return {
    // Customer info
    customerName: `${bookingData.firstName} ${bookingData.surname}`.toUpperCase(),
    fullName: `${bookingData.firstName} ${bookingData.middleName || ""} ${bookingData.surname}`.trim().toUpperCase(),
    firstName: bookingData.firstName?.toUpperCase() || "",
    surname: bookingData.surname?.toUpperCase() || "",
    email: bookingData.email || "",
    occupation: bookingData.occupation?.toUpperCase() || "",
    contact: bookingData.contact?.toUpperCase() || "",
    address: bookingData.address?.toUpperCase() || "",

    // Vehicle info
    carName: bookingData.carName?.toUpperCase() || "",
    plateNo: bookingData.plateNo?.toUpperCase() || "",

    // Dates & Times
    startDate: bookingData.startDate || "",
    startTime: bookingData.startTime || "",
    endDate: bookingData.endDate || "",
    endTime: bookingData.endTime || "",

    // Location
    location: bookingData.location?.toUpperCase() || "",
    purpose: bookingData.purpose?.toUpperCase() || "",

    // Pricing
    dailyRate: bookingData.discountedRate ? `₱${bookingData.discountedRate.toLocaleString()}` : "₱0",
    totalPrice: bookingData.totalPrice ? `₱${bookingData.totalPrice.toLocaleString()}` : "₱0",
    extraHours: extraHours,
    extraHourCharge: extraHoursCharge > 0 ? `₱${extraHoursCharge.toLocaleString()}` : "₱0",
    billedDays: rentalDays,

    // Duration & Price Display - for template
    durationDisplay: durationDisplay,
    priceDisplay: priceDisplay,
    rentalDuration: {
      days: rentalDays,
      extraHours: extraHours,
      isFlatRateSameDay: isFlatRateSameDay,
      actualSeconds: bookingData.rentalDuration?.actualSeconds || 0,
    },

    // Driving option
    drivingOption: bookingData.drivingOption || "",
    pickupOption: bookingData.pickupOption || "",
  };
};

export const generateDocument = async (bookingData, documentType) => {
  // documentType: "invoice" or "quotation"
  const templateName = documentType === "invoice" ? "invoice-template.docx" : "quotation-template.docx";
  const fileSuffix = documentType === "invoice" ? "Invoice" : "Quotation";

  const response = await fetch(`/templates/${templateName}`);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();

  const zip = new PizZip(arrayBuffer);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

  // Set the data - docxtemplater ignores unused variables, so no problem!
  doc.setData(prepareDocumentData(bookingData));

  doc.render();

  const out = doc.getZip().generate({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  const fileName = `${bookingData.surname}_${bookingData.firstName}_${fileSuffix}.docx`;
  saveAs(out, fileName);
};

// Convenience functions
export const generateInvoicePDF = (bookingData) => generateDocument(bookingData, "invoice");
export const generateQuotationPDF = (bookingData) => generateDocument(bookingData, "quotation");
