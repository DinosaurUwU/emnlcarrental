// generateDocument.js
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";

// Common data preparation for both invoice and quotation
const prepareDocumentData = (bookingData) => {
  return {
    // Customer info
    customerName: `${bookingData.firstName} ${bookingData.surname}`.toUpperCase(),
    fullName: `${bookingData.firstName} ${bookingData.middleName || ""} ${bookingData.surname}`.trim().toUpperCase(),
    firstName: bookingData.firstName?.toUpperCase() || "",
    surname: bookingData.surname?.toUpperCase() || "",
    email: bookingData.email || "",
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
    extraHours: bookingData.rentalDuration?.extraHours || 0,
    extraHourCharge: bookingData.extraHourCharge ? `₱${bookingData.extraHourCharge.toLocaleString()}` : "₱0",
    billedDays: bookingData.billedDays || 1,
    
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
