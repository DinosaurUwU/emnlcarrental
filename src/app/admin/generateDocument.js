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

  // Driving price calculation
  const drivingPrice = bookingData.drivingPrice || 0;
  
  // Pickup price calculation  
  const pickupPrice = bookingData.pickupPrice || 0;

  // Total price (from booking)
  const totalPrice = bookingData.totalPrice || 0;

  // ========== PAYMENT ENTRIES ==========
  const paymentEntries = bookingData.paymentEntries || [];
  
  // Calculate total paid from entries
  const totalPaid = paymentEntries.reduce((sum, entry) => {
    return sum + Number(entry.amount || 0);
  }, 0);
  
  // Calculate balance due
  const balanceDue = Math.max(0, totalPrice - totalPaid);

  // Format payment entries for template
  const paymentEntriesFormatted = paymentEntries.map((entry) => ({
    paymentDate: entry.date || "",
    paymentMop: entry.mop || "",
    paymentPop: entry.pop || "",
    paymentAmount: entry.amount ? `₱${Number(entry.amount).toLocaleString()}` : "₱0",
  }));

  // ========== DURATION DISPLAY ==========
  let totalHours = 0;
  if (bookingData.rentalDuration?.actualSeconds) {
    totalHours = Math.floor(bookingData.rentalDuration.actualSeconds / 3600);
  } else {
    totalHours = rentalDays * 24 + extraHours;
  }
  
  // THIS IS THE KEY FIX - make rentalDuration a string, not an object
  const rentalDurationDisplay = `${rentalDays} Day / ${totalHours} hrs`;
  
  // ========== DURATION CALCULATION ==========
  const dailyRate = bookingData.discountedRate || 0;
  
  let durationCalculation = "";
  if (extraHours > 0) {
    durationCalculation = `(${dailyRate.toLocaleString()} x ${rentalDays} Days + ${extraHours} hrs) ₱${totalPrice.toLocaleString()}`;
  } else {
    durationCalculation = `(${dailyRate.toLocaleString()} x ${rentalDays} Days) ₱${totalPrice.toLocaleString()}`;
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

    // Pricing - INDIVIDUAL PRICES
    dailyRate: bookingData.discountedRate ? `₱${bookingData.discountedRate.toLocaleString()}` : "₱0",
    drivingPrice: drivingPrice > 0 ? `₱${drivingPrice.toLocaleString()}` : "₱0",
    pickupPrice: pickupPrice > 0 ? `₱${pickupPrice.toLocaleString()}` : "₱0",
    extraHoursCharge: extraHoursCharge > 0 ? `₱${extraHoursCharge.toLocaleString()}` : "₱0",
    totalPrice: totalPrice > 0 ? `₱${totalPrice.toLocaleString()}` : "₱0",
    billedDays: rentalDays,

    // Payment Entries
    hasPaymentEntries: paymentEntries.length > 0,
    paymentEntries: paymentEntriesFormatted,
    totalPaid: totalPaid > 0 ? `₱${totalPaid.toLocaleString()}` : "₱0",
    balanceDue: balanceDue > 0 ? `₱${balanceDue.toLocaleString()}` : "₱0",

    // Duration - as STRING for template
    rentalDuration: rentalDurationDisplay,
    durationDisplay: rentalDurationDisplay,
    durationCalculation: durationCalculation,


    // Driving option
    drivingOption: bookingData.drivingOption || "",
    pickupOption: bookingData.pickupOption || "",
  };
};

export const generateDocument = async (bookingData, documentType) => {
  const templateName = documentType === "invoice" ? "invoice-template.docx" : "quotation-template.docx";
  const fileSuffix = documentType === "invoice" ? "Invoice" : "Quotation";

  const response = await fetch(`/templates/${templateName}`);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();

  const zip = new PizZip(arrayBuffer);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

  doc.setData(prepareDocumentData(bookingData));

  doc.render();

  const out = doc.getZip().generate({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  const fileName = `${bookingData.surname}_${bookingData.firstName}_${fileSuffix}.docx`;
  saveAs(out, fileName);
};

export const generateInvoicePDF = (bookingData) => generateDocument(bookingData, "invoice");
export const generateQuotationPDF = (bookingData) => generateDocument(bookingData, "quotation");
