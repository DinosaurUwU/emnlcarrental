import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Format date for display
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${month}-${day}-${year} | ${hours}:${minutes} ${ampm}`;
};

const formatDisplayDate = (value) => {
  if (!value) return "";

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${month}/${day}/${year}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = String(date.getFullYear());

  return `${month}/${day}/${year}`;
};

const formatDisplayTime = (value) => {
  if (value === null || value === undefined || value === "") return "";

  if (typeof value === "string" && /^\d{1,2}:\d{2}(\s?[AP]M)?$/i.test(value)) {
    const raw = value.trim().toUpperCase();

    if (raw.includes("AM") || raw.includes("PM")) {
      return raw.replace(/\s+/g, " ");
    }

    const [hourStr, minuteStr] = raw.split(":");
    let hour = Number(hourStr);
    const minute = String(minuteStr).padStart(2, "0");
    const suffix = hour >= 12 ? "PM" : "AM";

    hour = hour % 12;
    hour = hour || 12;

    return `${hour}:${minute} ${suffix}`;
  }

  const numericValue = Number(value);
  if (!Number.isNaN(numericValue) && String(value).length >= 12) {
    const date = new Date(numericValue);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
  }

  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  return String(value);
};

const formatRentalPeriod = (startDate, startTime, endDate, endTime) =>
  `${formatDisplayDate(startDate)} | ${formatDisplayTime(startTime)}\nto\n${formatDisplayDate(endDate)} | ${formatDisplayTime(endTime)}`;

const peso = (value) => `PHP ${Number(value || 0).toLocaleString("en-PH")}`;

const sanitizeFilePart = (value, fallback) =>
  String(value || fallback)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const prepareDocumentData = (bookingData, documentType) => {
  const rentalDays =
    bookingData.rentalDuration?.days ?? bookingData.billedDays ?? 1;

  const fallbackStart =
    bookingData.startDate && bookingData.startTime
      ? new Date(`${bookingData.startDate} ${bookingData.startTime}`)
      : null;

  const fallbackEnd =
    bookingData.endDate && bookingData.endTime
      ? new Date(`${bookingData.endDate} ${bookingData.endTime}`)
      : null;

  const totalDurationSeconds =
    bookingData.rentalDuration?.actualSeconds ??
    (fallbackStart &&
    fallbackEnd &&
    !Number.isNaN(fallbackStart.getTime()) &&
    !Number.isNaN(fallbackEnd.getTime())
      ? Math.max(
          0,
          Math.floor((fallbackEnd.getTime() - fallbackStart.getTime()) / 1000),
        )
      : 0);

  const extraHoursFromDuration =
    bookingData.rentalDuration?.extraHour ??
    bookingData.rentalDuration?.extraHours ??
    bookingData.extraHour ??
    bookingData.extraHours ??
    0;

  const extraHoursFromActualSeconds =
    totalDurationSeconds > 0
      ? Math.max(0, Math.round(totalDurationSeconds / 3600) - rentalDays * 24)
      : 0;

  const isFlatRateSameDay =
    bookingData.rentalDuration?.isFlatRateSameDay || false;

  const extension = bookingData.extension ?? 0;
  const rawExtraHoursCharge = bookingData.extraHourCharge ?? 0;
  // const baseRentalAmount = (bookingData.discountedRate ?? 0) * rentalDays;
  const baseRentalAmount = isFlatRateSameDay
    ? (bookingData.discountedRate ?? 0)
    : (bookingData.discountedRate ?? 0) * rentalDays;
  const drivingTotalAmount = (bookingData.drivingPrice ?? 0) * rentalDays;
  const pickupTotalAmount = bookingData.pickupPrice ?? 0;

  const extraHoursFromPricing =
    extension > 0 && bookingData.totalPrice != null
      ? Math.max(
          0,
          Math.round(
            (Number(bookingData.totalPrice) -
              baseRentalAmount -
              drivingTotalAmount -
              pickupTotalAmount) /
              extension,
          ),
        )
      : 0;

  const extraHoursFromCharge =
    rawExtraHoursCharge > 0 && extension > 0
      ? Math.round(rawExtraHoursCharge / extension)
      : 0;

  const extraHours = Math.max(
    Number(extraHoursFromDuration) || 0,
    Number(extraHoursFromActualSeconds) || 0,
    Number(extraHoursFromPricing) || 0,
    Number(extraHoursFromCharge) || 0,
  );

  const extraHoursCharge =
    bookingData.extraHourCharge ?? extraHours * extension;

  const drivingPrice = bookingData.drivingPrice || 0;
  const pickupPrice = bookingData.pickupPrice || 0;
  const totalPrice = bookingData.totalPrice || 0;

  const paymentEntries = bookingData.paymentEntries || [];
  const totalPaid = paymentEntries.reduce(
    (sum, entry) => sum + Number(entry.amount || 0),
    0,
  );
  const balanceDue = Math.max(0, totalPrice - totalPaid);

  const baseHours = rentalDays * 24;
  const extraHrWord = extraHours === 1 ? "hr" : "hrs";
  const dayWord = rentalDays === 1 ? "Day" : "Days";

  // const rentalDurationDisplay =
  //   extraHours > 0
  //     ? `(${rentalDays} Day / ${baseHours} hrs)\n(+${extraHours} ${extraHrWord} | ${peso(extraHoursCharge)})`
  //     : `(${rentalDays} Day / ${baseHours} hrs)`;

  const rentalDurationDisplay = isFlatRateSameDay
    ? extraHours > 0
      ? `(1 Day / for ${extraHours} hr only)\n(Flat rate applies for same-day rental)`
      : `(1 Day / for up to 1 hr only)\n(Flat rate applies for same-day rental)`
    : extraHours > 0
      ? `(${rentalDays} Day / ${baseHours} hrs)\n(+${extraHours} ${extraHrWord} | ${peso(extraHoursCharge)})`
      : `(${rentalDays} Day / ${baseHours} hrs)`;

  const paymentCount = String(paymentEntries.length).padStart(2, "0");
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const year = String(now.getFullYear()).slice(-2);
  const hours24 = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const time24 = `${hours24}${minutes}`;

  const surnameInitial = (bookingData.surname || "").charAt(0).toUpperCase();
  const firstNameInitial = (bookingData.firstName || "")
    .charAt(0)
    .toUpperCase();
  const middleInitial =
    (bookingData.middleName || "").charAt(0).toUpperCase() || "0";

  let docNo;
  let docDate;
  let docTime;

  if (documentType === "invoice") {
    docNo = `INV-${surnameInitial}${firstNameInitial}${middleInitial}-${paymentCount}-${month}${day}${year}`;
  } else {
    docNo = `QTN-${surnameInitial}${firstNameInitial}${middleInitial}-${time24}-${month}${day}${year}`;
  }

  docDate = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  docTime = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const validUntil = new Date(now);
  validUntil.setDate(validUntil.getDate() + 7);

  return {
    documentLabel: documentType === "invoice" ? "INVOICE" : "QUOTATION",
    docNo,
    docDate,
    docTime,
    validUntil:
      documentType === "quotation"
        ? validUntil.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "",
    customerName:
      `${bookingData.surname || ""}, ${bookingData.firstName || ""} ${bookingData.middleName || ""}`
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase(),
    fullName:
      `${bookingData.firstName || ""} ${bookingData.middleName || ""} ${bookingData.surname || ""}`
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase(),
    email: bookingData.email || "",
    occupation: (bookingData.occupation || "").toUpperCase(),
    contact: bookingData.contact || "",
    address: (bookingData.address || "").toUpperCase(),
    carName: (bookingData.carName || "").toUpperCase(),
    plateNo: (bookingData.plateNo || "").toUpperCase(),
    startDate: bookingData.startDate || "",
    startTime: bookingData.startTime || "",
    endDate: bookingData.endDate || "",
    endTime: bookingData.endTime || "",
    location: (bookingData.location || "").toUpperCase(),
    purpose: (bookingData.purpose || "").toUpperCase(),
    rentalDays,
    extraHours,
    extraHoursCharge,
    drivingPrice,
    pickupPrice,
    totalPrice,
    totalPaid,
    balanceDue,
    paymentEntries,
    isFlatRateSameDay,
    // unitItem: bookingData.carName
    //   ? `${bookingData.carName.toUpperCase()} (${peso(
    //       bookingData.discountedRate || 0,
    //     )} x ${rentalDays} ${dayWord})`
    //   : "",
    unitItem: bookingData.carName
      ? isFlatRateSameDay
        ? `${bookingData.carName.toUpperCase()} (${peso(bookingData.discountedRate || 0)} Flat Rate)`
        : `${bookingData.carName.toUpperCase()} (${peso(bookingData.discountedRate || 0)} x ${rentalDays} ${dayWord})`
      : "",
    unitPrice: baseRentalAmount,
    drivingItem:
      bookingData.drivingOption === "With Driver"
        ? `(${peso(drivingPrice)} x ${rentalDays} ${dayWord})`
        : bookingData.drivingOption || "",
    drivingTotal: drivingPrice * rentalDays,
    pickupItem: bookingData.pickupOption || "",
    pickupTotal: pickupPrice,
    // extraHourItem: extraHours > 0 ? `+${extraHours} ${extraHrWord}` : "0",
        extraHourItem: isFlatRateSameDay 
      ? "(1 Day / for 1 hr only)\n(Flat rate applies for same-day rental)" 
      : extraHours > 0 
        ? `+${extraHours} ${extraHrWord}` 
        : "0",
    rentalDurationDisplay,
  };
};

const generatePdfFileName = (bookingData, documentType) => {
  const fileSuffix = documentType === "invoice" ? "INV" : "QUO";
  const safeSurname = sanitizeFilePart(bookingData.surname, "CLIENT");
  const safeFirstName = sanitizeFilePart(bookingData.firstName, "NAME");
  const safeCarName = sanitizeFilePart(bookingData.carName, "UNIT");

  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const year = String(now.getFullYear());
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${fileSuffix}_${safeSurname}_${safeFirstName}_${safeCarName}_${month}${day}${year}_${hours}${minutes}.pdf`;
};

const addHeader = (doc, data) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(`EMNL CAR RENTAL ${data.documentLabel}`, 105, 18, {
    align: "center",
  });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Document No: ${data.docNo}`, 14, 28);
  doc.text(`Date: ${data.docDate}`, 14, 34);
  doc.text(`Time: ${data.docTime}`, 14, 40);

  if (data.validUntil) {
    doc.text(`Valid Until: ${data.validUntil}`, 14, 46);
  }
};

const generateDocument = async (bookingData, documentType) => {
  const data = prepareDocumentData(bookingData, documentType);
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  addHeader(doc, data);

  autoTable(doc, {
    startY: data.validUntil ? 54 : 48,
    theme: "grid",
    head: [["CUSTOMER DETAILS", "VALUE"]],
    body: [
      ["Customer Name", data.customerName],
      ["Full Name", data.fullName],
      ["Email", data.email],
      ["Occupation", data.occupation],
      ["Contact", data.contact],
      ["Address", data.address],
    ],
    headStyles: { fillColor: [34, 139, 34] },
    styles: { fontSize: 9, cellPadding: 2.5 },
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 6,
    theme: "grid",
    head: [["BOOKING DETAILS", "VALUE"]],
    body: [
      ["Car", data.carName],
      [
        "Rental Period",
        formatRentalPeriod(
          data.startDate,
          data.startTime,
          data.endDate,
          data.endTime,
        ),
      ],
      ["Location", data.location],
      ["Purpose", data.purpose],
      ["Rental Duration", data.rentalDurationDisplay],
    ],
    headStyles: { fillColor: [34, 139, 34] },
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: {
      1: { cellWidth: 120 },
    },
    bodyStyles: { valign: "middle" },
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 6,
    theme: "grid",
    head: [["DESCRIPTION", "ITEM", "PRICE"]],
    body: [
      ["UNIT", data.unitItem, peso(data.unitPrice)],
      ["DRIVE TYPE", data.drivingItem, peso(data.drivingTotal)],
      ["DELIVERY TYPE", data.pickupItem, peso(data.pickupTotal)],
      ["EXTRA HOUR", data.extraHourItem, peso(data.extraHoursCharge)],
      ["TOTAL", "", peso(data.totalPrice)],
      ["TOTAL PAID", "", peso(data.totalPaid)],
      ["BALANCE DUE", "", peso(data.balanceDue)],
    ],
    headStyles: { fillColor: [34, 139, 34] },
    styles: { fontSize: 9, cellPadding: 2.5 },
    bodyStyles: { valign: "middle" },
    didParseCell: (hookData) => {
      if (hookData.section !== "body") return;
      if (
        hookData.row.index === 4 ||
        hookData.row.index === 5 ||
        hookData.row.index === 6
      ) {
        hookData.cell.styles.fontStyle = "bold";
      }
      if (hookData.row.index === 6 && hookData.column.index === 2) {
        hookData.cell.styles.textColor = [220, 53, 69];
      }
    },
  });

  if (data.paymentEntries.length > 0) {
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 6,
      theme: "grid",
      head: [["PAYMENT DATE", "MODE", "POP", "AMOUNT"]],
      body: data.paymentEntries.map((entry) => [
        formatDate(entry.date),
        entry.mop || "",
        entry.pop || "",
        peso(entry.amount || 0),
      ]),
      headStyles: { fillColor: [34, 139, 34] },
      styles: { fontSize: 9, cellPadding: 2.5 },
    });
  }

  const fileName = generatePdfFileName(bookingData, documentType);
  doc.save(fileName);
};

export const generateInvoicePDF = (bookingData) =>
  generateDocument(bookingData, "invoice");

export const generateQuotationPDF = (bookingData) =>
  generateDocument(bookingData, "quotation");

/////////////////////////////////////////////////////////////////////////////////////////////////////

// // generateDocument.js
// import PizZip from "pizzip";
// import Docxtemplater from "docxtemplater";
// import { saveAs } from "file-saver";

// // Format date for display
// const formatDate = (dateStr) => {
//   if (!dateStr) return "";
//   const date = new Date(dateStr);
//   if (isNaN(date.getTime())) return dateStr;

//   const month = String(date.getMonth() + 1).padStart(2, "0");
//   const day = String(date.getDate()).padStart(2, "0");
//   const year = String(date.getFullYear()).slice(-2);

//   let hours = date.getHours();
//   const minutes = String(date.getMinutes()).padStart(2, "0");
//   const ampm = hours >= 12 ? "PM" : "AM";
//   hours = hours % 12;
//   hours = hours ? hours : 12;

//   return `${month}-${day}-${year} | ${hours}:${minutes} ${ampm}`;
// };

// // Common data preparation for both invoice and quotation
// const prepareDocumentData = (bookingData, documentType) => {
// const rentalDays =
//     bookingData.rentalDuration?.days ?? bookingData.billedDays ?? 1;

//   const fallbackStart =
//     bookingData.startDate && bookingData.startTime
//       ? new Date(`${bookingData.startDate} ${bookingData.startTime}`)
//       : null;

//   const fallbackEnd =
//     bookingData.endDate && bookingData.endTime
//       ? new Date(`${bookingData.endDate} ${bookingData.endTime}`)
//       : null;

//   const totalDurationSeconds =
//     bookingData.rentalDuration?.actualSeconds ??
//     (fallbackStart &&
//     fallbackEnd &&
//     !Number.isNaN(fallbackStart.getTime()) &&
//     !Number.isNaN(fallbackEnd.getTime())
//       ? Math.max(
//           0,
//           Math.floor((fallbackEnd.getTime() - fallbackStart.getTime()) / 1000),
//         )
//       : 0);

//   const extraHoursFromDuration =
//     bookingData.rentalDuration?.extraHour ??
//     bookingData.rentalDuration?.extraHours ??
//     bookingData.extraHour ??
//     bookingData.extraHours ??
//     0;

//   const extraHoursFromActualSeconds =
//     totalDurationSeconds > 0
//       ? Math.max(0, Math.round(totalDurationSeconds / 3600) - rentalDays * 24)
//       : 0;

//   const isFlatRateSameDay =
//     bookingData.rentalDuration?.isFlatRateSameDay || false;

//   // Extension rate (per hour)
//   const extension = bookingData.extension ?? 0;

//   const rawExtraHoursCharge = bookingData.extraHourCharge ?? 0;

//   const baseRentalAmount =
//     (bookingData.discountedRate ?? 0) * rentalDays;

//   const drivingTotalAmount =
//     (bookingData.drivingPrice ?? 0) * rentalDays;

//   const pickupTotalAmount = bookingData.pickupPrice ?? 0;

//   const extraHoursFromPricing =
//     extension > 0 && bookingData.totalPrice != null
//       ? Math.max(
//           0,
//           Math.round(
//             (Number(bookingData.totalPrice) -
//               baseRentalAmount -
//               drivingTotalAmount -
//               pickupTotalAmount) / extension,
//           ),
//         )
//       : 0;

//   const extraHoursFromCharge =
//     rawExtraHoursCharge > 0 && extension > 0
//       ? Math.round(rawExtraHoursCharge / extension)
//       : 0;

//   const extraHours = Math.max(
//     Number(extraHoursFromDuration) || 0,
//     Number(extraHoursFromActualSeconds) || 0,
//     Number(extraHoursFromPricing) || 0,
//     Number(extraHoursFromCharge) || 0,
//   );

//   // Keep real zero values instead of falling back
//   const extraHoursCharge =
//     bookingData.extraHourCharge ?? extraHours * extension;

//   // Driving price calculation
//   const drivingPrice = bookingData.drivingPrice || 0;

//   // Pickup price calculation
//   const pickupPrice = bookingData.pickupPrice || 0;

//   // Total price (from booking)
//   const totalPrice = bookingData.totalPrice || 0;

//   // ========== PAYMENT ENTRIES ==========
//   const paymentEntries = bookingData.paymentEntries || [];

//   // Calculate total paid from entries
//   const totalPaid = paymentEntries.reduce((sum, entry) => {
//     return sum + Number(entry.amount || 0);
//   }, 0);

//   // Calculate balance due
//   const balanceDue = Math.max(0, totalPrice - totalPaid);

//   //   // Format payment entries for template
//   //   const paymentEntriesFormatted = paymentEntries.map((entry) => ({
//   //     paymentDate: formatDate(entry.date),
//   //     paymentMop: entry.mop || "",
//   //     paymentPop: entry.pop || "",
//   //     paymentAmount: entry.amount
//   //       ? `₱${Number(entry.amount).toLocaleString()}`
//   //       : "₱0",
//   //   }));

//   const paymentEntriesFormatted = paymentEntries.map((entry, index) => ({
//     paymentDate: formatDate(entry.date),
//     paymentMop: entry.mop || "",
//     paymentPop: entry.pop || "",
//     paymentAmount: entry.amount
//       ? `₱${Number(entry.amount).toLocaleString()}`
//       : "₱0",
//     rowColor: index % 2 === 0 ? "#E2EFD9" : "#D9EBCD",
//   }));

//   // ========== DURATION DISPLAY ==========
//  let totalHours = 0;
//   if (totalDurationSeconds > 0) {
//     totalHours = Math.floor(totalDurationSeconds / 3600);
//   } else {
//     totalHours = rentalDays * 24 + extraHours;
//   }

//   const baseHours = rentalDays * 24;
//   const extraHrWord = extraHours === 1 ? "hr" : "hrs";
//   const rentalDurationDisplay =
//     extraHours > 0
//       ? `(${rentalDays} Day / ${baseHours} hrs) +${extraHours} ${extraHrWord}`
//       : `(${rentalDays} Day / ${baseHours} hrs)`;

//   // ========== DURATION CALCULATION ==========
//   const dailyRate = bookingData.discountedRate || 0;

//   // Duration calculation with proper singular/plural
//   const dayWord = rentalDays === 1 ? "Day" : "Days";

//   let durationCalculation = "";
//   if (extraHours > 0) {
//     durationCalculation = `(${dailyRate.toLocaleString()} x ${rentalDays} ${dayWord}) +${extraHours} ${extraHrWord}`;
//   } else {
//     durationCalculation = `(${dailyRate.toLocaleString()} x ${rentalDays} ${dayWord})`;
//   }

//   // Invoice number: {S}{F}{M or 0}-{paymentCount}-{MMDDYY}
//   const paymentCount = String(paymentEntries.length).padStart(2, "0");
//   const now = new Date();
//   const month = String(now.getMonth() + 1).padStart(2, "0");
//   const day = String(now.getDate()).padStart(2, "0");
//   const year = String(now.getFullYear()).slice(-2);

//   // Document number based on type

//   const hours24 = String(now.getHours()).padStart(2, "0");
//   const minutes = String(now.getMinutes()).padStart(2, "0");
//   const time24 = `${hours24}${minutes}`;

//   const surnameInitial = (bookingData.surname || "").charAt(0).toUpperCase();
//   const firstNameInitial = (bookingData.firstName || "")
//     .charAt(0)
//     .toUpperCase();
//   const middleInitial =
//     (bookingData.middleName || "").charAt(0).toUpperCase() || "0";

//   // Invoice uses payment count, Quotation uses time
//   let docNo, docDate, docTime;

//   if (documentType === "invoice") {
//     docNo = `INV-${surnameInitial}${firstNameInitial}${middleInitial}-${paymentCount}-${month}${day}${year}`;
//     docDate = now.toLocaleDateString("en-US", {
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//     });
//     docTime = now.toLocaleTimeString("en-US", {
//       hour: "numeric",
//       minute: "2-digit",
//       hour12: true,
//     });
//   } else {
//     // Quotation uses 24hr time instead of payment count
//     docNo = `QTN-${surnameInitial}${firstNameInitial}${middleInitial}-${time24}-${month}${day}${year}`;
//     docDate = now.toLocaleDateString("en-US", {
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//     });
//     docTime = now.toLocaleTimeString("en-US", {
//       hour: "numeric",
//       minute: "2-digit",
//       hour12: true,
//     });
//   }

//   // Valid Until (default 7 days from now for quotations)
//   const validDays = 7;
//   const validUntil = new Date(now);
//   validUntil.setDate(validUntil.getDate() + validDays);

//   const validUntilDate = validUntil.toLocaleDateString("en-US", {
//     year: "numeric",
//     month: "long",
//     day: "numeric",
//   });

//   return {
//     invoiceNo: docNo,
//     quotationNo: docNo,
//     invoiceDate: docDate,
//     quotationDate: docDate,
//     invoiceTime: docTime,
//     quotationTime: docTime,
//     validUntil: documentType === "quotation" ? validUntilDate : "",

//     // Customer info
//     customerName:
//       `${bookingData.surname}, ${bookingData.firstName} ${bookingData.middleName || ""}`.toUpperCase(),
//     fullName:
//       `${bookingData.firstName} ${bookingData.middleName || ""} ${bookingData.surname}`
//         .trim()
//         .toUpperCase(),
//     firstName: bookingData.firstName?.toUpperCase() || "",
//     surname: bookingData.surname?.toUpperCase() || "",
//     email: bookingData.email || "",
//     occupation: bookingData.occupation?.toUpperCase() || "",
//     contact: bookingData.contact?.toUpperCase() || "",
//     address: bookingData.address?.toUpperCase() || "",

//     // Vehicle info
//     carName: bookingData.carName?.toUpperCase()
//       ? `${bookingData.carName.toUpperCase()} (₱${bookingData.discountedRate?.toLocaleString() || 0} x ${rentalDays} ${dayWord})`
//       : "",

//     plateNo: bookingData.plateNo?.toUpperCase() || "",

//     // Dates & Times
//     startDate: bookingData.startDate || "",
//     startTime: bookingData.startTime || "",
//     endDate: bookingData.endDate || "",
//     endTime: bookingData.endTime || "",

//     // Location
//     location: bookingData.location?.toUpperCase() || "",
//     purpose: bookingData.purpose?.toUpperCase() || "",

//     // Pricing - INDIVIDUAL PRICES
//     dailyRate: bookingData.discountedRate
//       ? `₱${bookingData.discountedRate.toLocaleString()}`
//       : "₱0",

//     // Full calculation line
//     dailyRateCalc: `${bookingData.discountedRate * rentalDays > 0 ? `₱${(bookingData.discountedRate * rentalDays).toLocaleString()}` : "₱0"}`,

//         drivingPrice:
//       drivingPrice > 0
//         ? `₱${(drivingPrice * rentalDays).toLocaleString()}`
//         : "₱0",
//     pickupPrice: pickupPrice > 0 ? `₱${pickupPrice.toLocaleString()}` : "₱0",
//     extraHoursCharge:
//       extraHoursCharge > 0 ? `₱${extraHoursCharge.toLocaleString()}` : "₱0",
//     extraHours:
//       Number(extraHours) > 0
//         ? `+${Number(extraHours)} ${Number(extraHours) === 1 ? "hr" : "hrs"}`
//         : "0",
//     totalPrice: totalPrice > 0 ? `₱${totalPrice.toLocaleString()}` : "₱0",
//     billedDays: rentalDays,

//     // Payment Entries
//     showPaymentSection: paymentEntries.length > 0,
//     hasPaymentEntries: paymentEntries.length > 0,
//     paymentEntries: paymentEntriesFormatted,
//     totalPaid: totalPaid > 0 ? `₱${totalPaid.toLocaleString()}` : "₱0",
//     balanceDue: balanceDue > 0 ? `₱${balanceDue.toLocaleString()}` : "₱0",

//     // Duration - as STRING for template
//     rentalDuration: rentalDurationDisplay,
//     durationDisplay: rentalDurationDisplay,
//     durationCalculation: durationCalculation,

//     // Driving option
//     drivingOption:
//     bookingData.drivingOption === "With Driver"
//       ? `(₱${drivingPrice.toLocaleString()} x ${rentalDays} ${
//           rentalDays === 1 ? "Day" : "Days"
//         })`
//       : bookingData.drivingOption || "",

//   pickupOption: bookingData.pickupOption || "",
//   };
// };

// export const generateDocument = async (bookingData, documentType) => {
//   const templateName =
//     documentType === "invoice"
//       ? "invoice-template.docx"
//       : "quotation-template.docx";
//   const fileSuffix = documentType === "invoice" ? "INV" : "QUO";

//   const response = await fetch(`/templates/${templateName}`);
//   const blob = await response.blob();
//   const arrayBuffer = await blob.arrayBuffer();

//   const zip = new PizZip(arrayBuffer);
//   const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

//   doc.setData(prepareDocumentData(bookingData, documentType));

//   doc.render();

//   const out = doc.getZip().generate({
//     type: "blob",
//     mimeType:
//       "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//   });

//   const safeSurname = (bookingData.surname || "CLIENT")
//     .toUpperCase()
//     .replace(/[^A-Z0-9]+/g, "_");
//   const safeFirstName = (bookingData.firstName || "NAME")
//     .toUpperCase()
//     .replace(/[^A-Z0-9]+/g, "_");
//   const safeCarName = (bookingData.carName || "UNIT")
//     .toUpperCase()
//     .replace(/[^A-Z0-9]+/g, "_");

//   const now = new Date();
//   const month = String(now.getMonth() + 1).padStart(2, "0");
//   const day = String(now.getDate()).padStart(2, "0");
//   const year = String(now.getFullYear());
//   const hours = String(now.getHours()).padStart(2, "0");
//   const minutes = String(now.getMinutes()).padStart(2, "0");

//   const fileDate = `${month}${day}${year}`;
//   const fileTime = `${hours}${minutes}`;
//   const fileName = `${fileSuffix}_${safeSurname}_${safeFirstName}_${safeCarName}_${fileDate}_${fileTime}.docx`;

//   saveAs(out, fileName);
// };

// export const generateInvoicePDF = (bookingData) =>
//   generateDocument(bookingData, "invoice");
// export const generateQuotationPDF = (bookingData) =>
//   generateDocument(bookingData, "quotation");
