import { useEffect } from "react";
import { db } from "../lib/firebase";
import { doc, setDoc } from "firebase/firestore";

const unitData = [
  // TOYOTA VIOS
  {
    carType: "SEDAN",
    brand: "TOYOTA",
    status: "Vacant",
    image: "/images/vios-white/vios-white.png",
    name: "VIOS WHITE XLE",
    plateNo: "GBK 9490",
    price: 1500,
    extension: 350,
    deliveryFee: 350,
    driverRate: 700,
    rates: {
      daily: 1500,
      discount3Days: 1349,
      discount7Days: 1249,
      discount30Days: 1149,
    },
    reservation: 500,
    ownerShare: 1000,
    owner: "E. Pedazo",
    //FLEETDETAILS.JS
    details: {
      gallery: [
        "/images/vios-white/vios-white.png",
        "/images/vios-white/g1.png",
        "/images/vios-white/g2.png",
        "/images/vios-white/g3.png",
        "/images/vios-white/g4.png",
        "/images/vios-white/g5.png",
        "/images/vios-white/g6.png",
      ],
      introduction:
        "Spacious and reliable van suitable for group travels and logistics.",
      specifications: {
        Type: "Sedan",
        Color: "White",
        Capacity: 15,
        Transmission: "Manual",
        Fuel: "Diesel",
        Trunk: "Large rear cargo area",
        Features: "Air Conditioning, USB Ports, Spacious Interior",
      },
      pricing: {
        selfDrive: 3499,
        withDriver: 4499,
      },
    },
  },
  {
    carType: "SEDAN",
    brand: "TOYOTA",
    status: "Vacant",
    image: "/images/vios-silver/vios-silver.png",
    name: "VIOS SILVER XLE",
    plateNo: "GBA 3360",
    price: 1500,
    extension: 350,
    deliveryFee: 350,
    driverRate: 700,
    rates: {
      daily: 1500,
      discount3Days: 1349,
      discount7Days: 1249,
      discount30Days: 1149,
    },
    reservation: 500,
    ownerShare: 1000,
    owner: "E. Pedazo",
    //FLEETDETAILS.JS
    details: {
      gallery: [
        "/images/vios-silver/vios-silver.png",
        "/images/vios-silver/g1.png",
        "/images/vios-silver/g2.png",
        "/images/vios-silver/g3.png",
        "/images/vios-silver/g4.png",
        "/images/vios-silver/g5.png",
        "/images/vios-silver/g6.png",
      ],
      introduction:
        "Spacious and reliable van suitable for group travels and logistics.",
      specifications: {
        Type: "Sedan",
        Color: "Silver",
        Capacity: 15,
        Transmission: "Manual",
        Fuel: "Diesel",
        Trunk: "Large rear cargo area",
        Features: "Air Conditioning, USB Ports, Spacious Interior",
      },
      pricing: {
        selfDrive: 3499,
        withDriver: 4499,
      },
    },
  },
  {
    carType: "SEDAN",
    brand: "TOYOTA",
    status: "Vacant",
    image: "/images/vios1-blue/vios1-blue.png",
    name: "VIOS BLUE XLE",
    plateNo: "GBE 5231",
    price: 1500,
    extension: 350,
    deliveryFee: 350,
    driverRate: 700,
    rates: {
      daily: 1500,
      discount3Days: 1349,
      discount7Days: 1249,
      discount30Days: 1149,
    },
    reservation: 500,
    ownerShare: 1000,
    owner: "J. Rosa",
    //FLEETDETAILS.JS
    details: {
      gallery: [
        "/images/vios1-blue/vios1-blue.png",
        "/images/vios1-blue/g1.png",
        "/images/vios1-blue/g2.png",
        "/images/vios1-blue/g3.png",
        "/images/vios1-blue/g4.png",
        "/images/vios1-blue/g5.png",
        "/images/vios1-blue/g6.png",
      ],
      introduction:
        "Spacious and reliable van suitable for group travels and logistics.",
      specifications: {
        Type: "Sedan",
        Color: "Blue",
        Capacity: 15,
        Transmission: "Manual",
        Fuel: "Diesel",
        Trunk: "Large rear cargo area",
        Features: "Air Conditioning, USB Ports, Spacious Interior",
      },
      pricing: {
        selfDrive: 3499,
        withDriver: 4499,
      },
    },
  },
  {
    carType: "SEDAN",
    brand: "TOYOTA",
    status: "Vacant",
    image: "/images/vios2-blue/vios2-blue.png",
    name: "VIOS BLUE XLE",
    plateNo: "GBG 4488",
    price: 1500,
    extension: 350,
    deliveryFee: 350,
    driverRate: 700,
    rates: {
      daily: 1500,
      discount3Days: 1349,
      discount7Days: 1249,
      discount30Days: 1149,
    },
    reservation: 500,
    ownerShare: 1000,
    owner: "E. Pedazo",
    //FLEETDETAILS.JS
    details: {
      gallery: [
        "/images/vios2-blue/vios2-blue.png",
        "/images/vios2-blue/g1.png",
        "/images/vios2-blue/g2.png",
        "/images/vios2-blue/g3.png",
        "/images/vios2-blue/g4.png",
        "/images/vios2-blue/g5.png",
        "/images/vios2-blue/g6.png",
      ],
      introduction:
        "Spacious and reliable van suitable for group travels and logistics.",
      specifications: {
        Type: "Sedan",
        Color: "Blue",
        Capacity: 15,
        Transmission: "Manual",
        Fuel: "Diesel",
        Trunk: "Large rear cargo area",
        Features: "Air Conditioning, USB Ports, Spacious Interior",
      },
      pricing: {
        selfDrive: 3499,
        withDriver: 4499,
      },
    },
  },
  {
    carType: "SEDAN",
    brand: "TOYOTA",
    status: "Vacant",
    image: "/images/vios-red/vios-red.png",
    name: "VIOS RED XLE",
    plateNo: "NHQ 5858",
    price: 1500,
    extension: 350,
    deliveryFee: 350,
    driverRate: 700,
    rates: {
      daily: 1500,
      discount3Days: 1349,
      discount7Days: 1249,
      discount30Days: 1149,
    },
    reservation: 500,
    ownerShare: 1000,
    owner: "A. Caadan",
    //FLEETDETAILS.JS
    details: {
      gallery: [
        "/images/vios-red/vios-red.png",
        "/images/vios-red/g1.png",
        "/images/vios-red/g2.png",
        "/images/vios-red/g3.png",
        "/images/vios-red/g4.png",
        "/images/vios-red/g5.png",
        "/images/vios-red/g6.png",
      ],
      introduction:
        "Spacious and reliable van suitable for group travels and logistics.",
      specifications: {
        Type: "Sedan",
        Color: "Red",
        Capacity: 15,
        Transmission: "Manual",
        Fuel: "Diesel",
        Trunk: "Large rear cargo area",
        Features: "Air Conditioning, USB Ports, Spacious Interior",
      },
      pricing: {
        selfDrive: 3499,
        withDriver: 4499,
      },
    },
  },
  {
    carType: "SEDAN",
    brand: "TOYOTA",
    status: "Vacant",
    image: "/images/vios-maroon/vios-maroon.png",
    name: "VIOS MAROON XLE",
    plateNo: "GBH 2871",
    price: 1500,
    extension: 350,
    deliveryFee: 350,
    driverRate: 700,
    rates: {
      daily: 1500,
      discount3Days: 1349,
      discount7Days: 1249,
      discount30Days: 1149,
    },
    reservation: 500,
    ownerShare: 1000,
    owner: "J. Dayuday",
    //FLEETDETAILS.JS
    details: {
      gallery: [
        "/images/vios-maroon/vios-maroon.png",
        "/images/vios-maroon/g1.png",
        "/images/vios-maroon/g2.png",
        "/images/vios-maroon/g3.png",
        "/images/vios-maroon/g4.png",
        "/images/vios-maroon/g5.png",
        "/images/vios-maroon/g6.png",
      ],
      introduction:
        "Spacious and reliable van suitable for group travels and logistics.",
      specifications: {
        Type: "Sedan",
        Color: "Maroon",
        Capacity: 15,
        Transmission: "Manual",
        Fuel: "Diesel",
        Trunk: "Large rear cargo area",
        Features: "Air Conditioning, USB Ports, Spacious Interior",
      },
      pricing: {
        selfDrive: 3499,
        withDriver: 4499,
      },
    },
  },
  {
    carType: "SEDAN",
    brand: "TOYOTA",
    status: "Vacant",
    image: "/images/wigo-red/wigo-red.png",
    name: "WIGO RED",
    plateNo: "GBE 6419",
    price: 1500,
    extension: 350,
    deliveryFee: 350,
    driverRate: 700,
    rates: {
      daily: 1500,
      discount3Days: 1349,
      discount7Days: 1249,
      discount30Days: 1149,
    },
    reservation: 500,
    ownerShare: 1000,
    owner: "E. Pedazo",
    //FLEETDETAILS.JS
    details: {
      gallery: [
        "/images/wigo-red/wigo-red.png",
        "/images/wigo-red/g1.png",
        "/images/wigo-red/g2.png",
        "/images/wigo-red/g3.png",
        "/images/wigo-red/g4.png",
        "/images/wigo-red/g5.png",
        "/images/wigo-red/g6.png",
      ],
      introduction:
        "Spacious and reliable van suitable for group travels and logistics.",
      specifications: {
        Type: "Sedan",
        Color: "Red",
        Capacity: 15,
        Transmission: "Manual",
        Fuel: "Diesel",
        Trunk: "Large rear cargo area",
        Features: "Air Conditioning, USB Ports, Spacious Interior",
      },
      pricing: {
        selfDrive: 3499,
        withDriver: 4499,
      },
    },
  },

  // MITSUBISHI MIRAGE
  {
    carType: "SEDAN",
    brand: "MITSUBISHI",
    status: "Vacant",
    image: "/images/mirage-silver/mirage-silver.png",
    name: "MIRAGE SILVER",
    plateNo: "HAG 9094",
    price: 1500,
    extension: 350,
    deliveryFee: 350,
    driverRate: 700,
    rates: {
      daily: 1500,
      discount3Days: 1349,
      discount7Days: 1249,
      discount30Days: 1149,
    },
    reservation: 500,
    ownerShare: 1000,
    owner: "J. Dayuday",
    //FLEETDETAILS.JS
    details: {
      gallery: [
        "/images/mirage-silver/mirage-silver.png",
        "/images/mirage-silver/g1.png",
        "/images/mirage-silver/g2.png",
        "/images/mirage-silver/g3.png",
        "/images/mirage-silver/g4.png",
        "/images/mirage-silver/g5.png",
        "/images/mirage-silver/g6.png",
      ],
      introduction:
        "Spacious and reliable van suitable for group travels and logistics.",
      specifications: {
        Type: "Sedan",
        Color: "Silver",
        Capacity: 15,
        Transmission: "Manual",
        Fuel: "Diesel",
        Trunk: "Large rear cargo area",
        Features: "Air Conditioning, USB Ports, Spacious Interior",
      },
      pricing: {
        selfDrive: 3499,
        withDriver: 4499,
      },
    },
  },
  {
    carType: "SEDAN",
    brand: "MITSUBISHI",
    status: "Vacant",
    image: "/images/mirage-gray/mirage-gray.png",
    name: "MIRAGE GRAY",
    plateNo: "HAG 3219",
    price: 1500,
    extension: 350,
    deliveryFee: 350,
    driverRate: 700,
    rates: {
      daily: 1500,
      discount3Days: 1349,
      discount7Days: 1249,
      discount30Days: 1149,
    },
    reservation: 500,
    ownerShare: 1000,
    owner: "E. Pedazo",
    //FLEETDETAILS.JS
    details: {
      gallery: [
        "/images/mirage-gray/mirage-gray.png",
        "/images/mirage-gray/g1.png",
        "/images/mirage-gray/g2.png",
        "/images/mirage-gray/g3.png",
        "/images/mirage-gray/g4.png",
        "/images/mirage-gray/g5.png",
        "/images/mirage-gray/g6.png",
      ],
      introduction:
        "Spacious and reliable van suitable for group travels and logistics.",
      specifications: {
        Type: "Sedan",
        Color: "Gray",
        Capacity: 15,
        Transmission: "Manual",
        Fuel: "Diesel",
        Trunk: "Large rear cargo area",
        Features: "Air Conditioning, USB Ports, Spacious Interior",
      },
      pricing: {
        selfDrive: 3499,
        withDriver: 4499,
      },
    },
  },
  {
    carType: "SEDAN",
    brand: "MITSUBISHI",
    status: "Vacant",
    image: "/images/mirage-keyless/mirage-keyless.png",
    name: "MIRAGE KEYLESS",
    plateNo: "HAG 1057",
    price: 1500,
    extension: 350,
    deliveryFee: 350,
    driverRate: 700,
    rates: {
      daily: 1500,
      discount3Days: 1349,
      discount7Days: 1249,
      discount30Days: 1149,
    },
    reservation: 500,
    ownerShare: 1000,
    owner: "E. Pedazo",
    //FLEETDETAILS.JS
    details: {
      gallery: [
        "/images/mirage-keyless/mirage-keyless.png",
        "/images/mirage-keyless/g1.png",
        "/images/mirage-keyless/g2.png",
        "/images/mirage-keyless/g3.png",
        "/images/mirage-keyless/g4.png",
        "/images/mirage-keyless/g5.png",
        "/images/mirage-keyless/g6.png",
      ],
      introduction:
        "Spacious and reliable van suitable for group travels and logistics.",
      specifications: {
        Type: "Sedan",
        Color: "Gray",
        Capacity: 15,
        Transmission: "Manual",
        Fuel: "Diesel",
        Trunk: "Large rear cargo area",
        Features: "Air Conditioning, USB Ports, Spacious Interior",
      },
      pricing: {
        selfDrive: 3499,
        withDriver: 4499,
      },
    },
  },

  // TOYOTA INNOVA & NISSAN LIVINA
  {
    carType: "MPV",
    brand: "TOYOTA",
    status: "Vacant",
    image: "/images/innova-silver/innova-silver.png",
    name: "INNOVA SILVER",
    plateNo: "HAG 4965",
    price: 3000,
    extension: 350,
    deliveryFee: 350,
    driverRate: 700,
    rates: {
      daily: 3000,
      discount3Days: 2649,
      discount7Days: 2549,
      discount30Days: 2449,
    },
    reservation: 500,
    ownerShare: 1500,
    owner: "K. Obeda",
    //FLEETDETAILS.JS
    details: {
      gallery: [
        "/images/innova-silver/innova-silver.png",
        "/images/innova-silver/g1.png",
        "/images/innova-silver/g2.png",
        "/images/innova-silver/g3.png",
        "/images/innova-silver/g4.png",
        "/images/innova-silver/g5.png",
        "/images/innova-silver/g6.png",
      ],
      introduction:
        "Spacious and reliable van suitable for group travels and logistics.",
      specifications: {
        Type: "MPV",
        Color: "Silver",
        Capacity: 15,
        Transmission: "Manual",
        Fuel: "Diesel",
        Trunk: "Large rear cargo area",
        Features: "Air Conditioning, USB Ports, Spacious Interior",
      },
      pricing: {
        selfDrive: 3499,
        withDriver: 4499,
      },
    },
  },
  {
    carType: "MPV",
    brand: "NISSAN",
    status: "Vacant",
    image: "/images/livina-red/livina-red.png",
    name: "LIVINA RED",
    plateNo: "HAH 1110",
    price: 3000,
    extension: 350,
    deliveryFee: 350,
    driverRate: 700,
    rates: {
      daily: 3000,
      discount3Days: 2649,
      discount7Days: 2549,
      discount30Days: 2449,
    },
    reservation: 500,
    ownerShare: 1500,
    owner: "E. Pedazo",
    //FLEETDETAILS.JS
    details: {
      gallery: [
        "/images/livina-red/livina-red.png",
        "/images/livina-red/g1.png",
        "/images/livina-red/g2.png",
        "/images/livina-red/g3.png",
        "/images/livina-red/g4.png",
        "/images/livina-red/g5.png",
        "/images/livina-red/g6.png",
      ],
      introduction:
        "Spacious and reliable van suitable for group travels and logistics.",
      specifications: {
        Type: "MPV",
        Color: "Red",
        Capacity: 15,
        Transmission: "Manual",
        Fuel: "Diesel",
        Trunk: "Large rear cargo area",
        Features: "Air Conditioning, USB Ports, Spacious Interior",
      },
      pricing: {
        selfDrive: 3499,
        withDriver: 4499,
      },
    },
  },
  {
    carType: "MPV",
    brand: "SUZUKI",
    status: "Vacant",
    image: "/images/xl7-hybrid/xl7-hybrid.png",
    name: "XL7 HYBRID",
    plateNo: "HAH 4244",
    price: 3000,
    extension: 350,
    deliveryFee: 350,
    driverRate: 700,
    rates: {
      daily: 3000,
      discount3Days: 2649,
      discount7Days: 2549,
      discount30Days: 2449,
    },
    reservation: 500,
    ownerShare: 1500,
    owner: "R. Misa",
    //FLEETDETAILS.JS
    details: {
      gallery: [
        "/images/xl7-hybrid/xl7-hybrid.png",
        "/images/xl7-hybrid/g1.png",
        "/images/xl7-hybrid/g2.png",
        "/images/xl7-hybrid/g3.png",
        "/images/xl7-hybrid/g4.png",
        "/images/xl7-hybrid/g5.png",
        "/images/xl7-hybrid/g6.png",
      ],
      introduction:
        "Spacious and reliable van suitable for group travels and logistics.",
      specifications: {
        Type: "MPV",
        Color: "Red",
        Capacity: 15,
        Transmission: "Manual",
        Fuel: "Diesel",
        Trunk: "Large rear cargo area",
        Features: "Air Conditioning, USB Ports, Spacious Interior",
      },
      pricing: {
        selfDrive: 3499,
        withDriver: 4499,
      },
    },
  },

  // TOYOTA HIACE
  {
    carType: "VAN",
    brand: "TOYOTA",
    status: "Vacant",
    image: "/images/hiace1-white/hiace1-white.png",
    name: "HIACE WHITE",
    plateNo: "GAD 1075",
    price: 3500,
    extension: 350,
    deliveryFee: 350,
    driverRate: 700,
    rates: {
      daily: 3500,
      discount3Days: 3349,
      discount7Days: 3249,
      discount30Days: 3149,
    },
    reservation: 500,
    ownerShare: 1500,
    owner: "A. Apas",
    //FLEETDETAILS.JS
    details: {
      gallery: [
        "/images/hiace1-white/hiace1-white.png",
        "/images/hiace1-white/g1.png",
        "/images/hiace1-white/g2.png",
        "/images/hiace1-white/g3.png",
        "/images/hiace1-white/g4.png",
        "/images/hiace1-white/g5.png",
        "/images/hiace1-white/g6.png",
      ],
      introduction:
        "Spacious and reliable van suitable for group travels and logistics.",
      specifications: {
        Type: "VAN",
        Color: "White",
        Capacity: 15,
        Transmission: "Manual",
        Fuel: "Diesel",
        Trunk: "Large rear cargo area",
        Features: "Air Conditioning, USB Ports, Spacious Interior",
      },
      pricing: {
        selfDrive: 3499,
        withDriver: 4499,
      },
    },
  },
  {
    carType: "VAN",
    brand: "TOYOTA",
    status: "Vacant",
    image: "/images/hiace2-white/hiace2-white.png",
    name: "HIACE WHITE",
    plateNo: "GAH 7607",
    price: 3500,
    extension: 350,
    deliveryFee: 350,
    driverRate: 700,
    rates: {
      daily: 3499,
      discount3Days: 3349,
      discount7Days: 3249,
      discount30Days: 3149,
    },
    reservation: 500,
    ownerShare: 1500,
    owner: "A. Apas",
    //FLEETDETAILS.JS
    details: {
      gallery: [
        "/images/hiace2-white/hiace2-white.png",
        "/images/hiace2-white/g1.png",
        "/images/hiace2-white/g2.png",
        "/images/hiace2-white/g3.png",
        "/images/hiace2-white/g4.png",
        "/images/hiace2-white/g5.png",
        "/images/hiace2-white/g6.png",
      ],
      introduction:
        "Spacious and reliable van suitable for group travels and logistics.",
      specifications: {
        Type: "VAN",
        Color: "White",
        Capacity: 15,
        Transmission: "Manual",
        Fuel: "Diesel",
        Trunk: "Large rear cargo area",
        Features: "Air Conditioning, USB Ports, Spacious Interior",
      },
      pricing: {
        selfDrive: 3499,
        withDriver: 4499,
      },
    },
  },
  {
    carType: "VAN",
    brand: "NISSAN",
    status: "Vacant",
    image: "/images/urvan-white/urvan-white.png",
    name: "URVAN WHITE",
    plateNo: "GBO 7879",
    price: 3500,
    extension: 350,
    deliveryFee: 350,
    driverRate: 700,
    rates: {
      daily: 3499,
      discount3Days: 3349,
      discount7Days: 3249,
      discount30Days: 3149,
    },
    reservation: 500,
    ownerShare: 1500,
    owner: "E. Pedazo",
    //FLEETDETAILS.JS
    details: {
      gallery: [
        "/images/urvan-white/urvan-white.png",
        "/images/urvan-white/g1.png",
        "/images/urvan-white/g2.png",
        "/images/urvan-white/g3.png",
        "/images/urvan-white/g4.png",
        "/images/urvan-white/g5.png",
        "/images/urvan-white/g6.png",
      ],
      introduction:
        "Spacious and reliable van suitable for group travels and logistics.",
      specifications: {
        Type: "VAN",
        Color: "White",
        Capacity: 15,
        Transmission: "Manual",
        Fuel: "Diesel",
        Trunk: "Large rear cargo area",
        Features: "Air Conditioning, USB Ports, Spacious Interior",
      },
      pricing: {
        selfDrive: 3499,
        withDriver: 4499,
      },
    },
  },

  // NISSAN NAVARA & MITSUBISHI STRADA
  {
    carType: "PICKUP",
    brand: "NISSAN",
    status: "Vacant",
    image: "/images/navara-brown/navara-brown.png",
    name: "NAVARA BROWN",
    plateNo: "HAH 9254",
    price: 3000,
    extension: 350,
    deliveryFee: 350,
    driverRate: 700,
    rates: {
      daily: 3000,
      discount3Days: 2849,
      discount7Days: 2749,
      discount30Days: 2649,
    },
    reservation: 500,
    ownerShare: 1500,
    owner: "F. Abarre",
    //FLEETDETAILS.JS
    details: {
      gallery: [
        "/images/navara-brown/navara-brown.png",
        "/images/navara-brown/g1.png",
        "/images/navara-brown/g2.png",
        "/images/navara-brown/g3.png",
        "/images/navara-brown/g4.png",
        "/images/navara-brown/g5.png",
        "/images/navara-brown/g6.png",
      ],
      introduction:
        "Spacious and reliable van suitable for group travels and logistics.",
      specifications: {
        Type: "PICKUP",
        Color: "Brown",
        Capacity: 15,
        Transmission: "Manual",
        Fuel: "Diesel",
        Trunk: "Large rear cargo area",
        Features: "Air Conditioning, USB Ports, Spacious Interior",
      },
      pricing: {
        selfDrive: 3499,
        withDriver: 4499,
      },
    },
  },

  // FORD EVEREST
  {
    carType: "SUV",
    brand: "FORD",
    status: "Vacant",
    image: "/images/everest-black/everest-black.png",
    name: "EVEREST BLACK",
    plateNo: "HCT 1944",
    price: 3000,
    extension: 350,
    deliveryFee: 350,
    driverRate: 700,
    rates: {
      daily: 3000,
      discount3Days: 2849,
      discount7Days: 2749,
      discount30Days: 2649,
    },
    reservation: 500,
    ownerShare: 1500,
    owner: "C. Pedazo",
    //FLEETDETAILS.JS
    details: {
      gallery: [
        "/images/everest-black/everest-black.png",
        "/images/everest-black/g1.png",
        "/images/everest-black/g2.png",
        "/images/everest-black/g3.png",
        "/images/everest-black/g4.png",
        "/images/everest-black/g5.png",
        "/images/everest-black/g6.png",
      ],
      introduction:
        "Spacious and reliable van suitable for group travels and logistics.",
      specifications: {
        Type: "SUV",
        Color: "Black",
        Capacity: 15,
        Transmission: "Manual",
        Fuel: "Diesel",
        Trunk: "Large rear cargo area",
        Features: "Air Conditioning, USB Ports, Spacious Interior",
      },
      pricing: {
        selfDrive: 3499,
        withDriver: 4499,
      },
    },
  },
];

const ImportData = () => {
  useEffect(() => {
    const uploadToRootUnitsCollection = async () => {
      try {
        for (const unit of unitData) {
          await setDoc(
            doc(db, "units", unit.plateNo),
            {
              ...unit,
              hidden: false,
            },
            { merge: true },
          );
        }
        console.log("✅ IMPORTDATA.JS");
      } catch (error) {
        console.error("❌ Error uploading units:", error);
      }
    };

    uploadToRootUnitsCollection();
  }, []);

  return null;
};

export default ImportData;
