// Seed script - run with: node seed/seedData.js
// This creates a fresh dataset in the MongoDB database
import mongoose from "mongoose";
import User from "../models/User.js";
import Ward from "../models/Ward.js";
import Property from "../models/Property.js";
import Tax from "../models/Tax.js";
import Payment from "../models/Payment.js";
import Grievance from "../models/Grievance.js";
import Rate from "../models/Rate.js";

const MONGO_URI = "mongodb://127.0.0.1:27017/property_tax_db";

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Clear all existing data
    await User.deleteMany({});
    await Ward.deleteMany({});
    await Property.deleteMany({});
    await Tax.deleteMany({});
    await Payment.deleteMany({});
    await Grievance.deleteMany({});
    await Rate.deleteMany({});
    console.log("Cleared old data");

    // --- Create default tax rates ---
    const rates = await Rate.create({
      baseRate: 2.0,
      residentialFactor: 1.0,
      commercialFactor: 1.7,
      industrialFactor: 2.2,
      rebatePercent: 5,
      penaltyPercent: 1,
      penaltyCap: 1500,
    });
    console.log("Created default tax rates");

    // --- Create 1 admin account ---
    const admin = await User.create({
      name: "Shahid Shaikh",
      email: "admin@np.in",
      password: "admin123",
      role: "admin",
      phone: "9876543210",
      status: "active",
    });
    console.log("Created admin account");

    // --- Create 3 officers ---
    const officer1 = await User.create({
      name: "Rayyan Shaikh",
      email: "officer1@np.in",
      password: "officer123",
      role: "officer",
      phone: "9876543211",
      status: "active",
    });

    const officer2 = await User.create({
      name: "Samir Shaikh",
      email: "officer2@np.in",
      password: "officer123",
      role: "officer",
      phone: "9876543212",
      status: "active",
    });

    const officer3 = await User.create({
      name: "Jenul Saiyyed",
      email: "officer3@np.in",
      password: "officer123",
      role: "officer",
      phone: "9876543213",
      status: "active",
    });
    console.log("Created 3 officer accounts");

    // --- Create 3 wards, each assigned to a different officer ---
    const ward1 = await Ward.create({
      wardNumber: 1,
      zone: "Central",
      officerId: officer1._id,
    });

    const ward2 = await Ward.create({
      wardNumber: 2,
      zone: "Market Road",
      officerId: officer2._id,
    });

    const ward3 = await Ward.create({
      wardNumber: 3,
      zone: "Shivaji Nagar",
      officerId: officer3._id,
    });
    console.log("Created 3 wards (each with an assigned officer)");

    // --- Create 6 citizens (2 per ward) ---
    const citizen1 = await User.create({
      name: "Aarav Kulkarni",
      email: "aarav@example.com",
      password: "citizen123",
      role: "citizen",
      phone: "9876541001",
      status: "active",
    });

    const citizen2 = await User.create({
      name: "Meera Joshi",
      email: "meera@example.com",
      password: "citizen123",
      role: "citizen",
      phone: "9876541002",
      status: "active",
    });

    const citizen3 = await User.create({
      name: "Karan Patel",
      email: "karan@example.com",
      password: "citizen123",
      role: "citizen",
      phone: "9876541003",
      status: "active",
    });

    const citizen4 = await User.create({
      name: "Sneha Rao",
      email: "sneha@example.com",
      password: "citizen123",
      role: "citizen",
      phone: "9876541004",
      status: "active",
    });

    const citizen5 = await User.create({
      name: "Aditya Verma",
      email: "aditya@example.com",
      password: "citizen123",
      role: "citizen",
      phone: "9876541005",
      status: "active",
    });

    const citizen6 = await User.create({
      name: "Divya Iyer",
      email: "divya@example.com",
      password: "citizen123",
      role: "citizen",
      phone: "9876541006",
      status: "active",
    });
    console.log("Created 6 citizen accounts (2 per ward)");

    // --- Create 12 properties (2 per citizen: 1 verified + 1 pending) ---
    // Citizen 1 - Ward 1 (Officer 1)
    const prop1 = await Property.create({
      ownerId: citizen1._id,
      tenementNumber: "NPM/01/1001",
      address: "12, Central Avenue",
      wardId: ward1._id,
      area: 1200,
      propertyType: "residential",
      constructionYear: 2015,
      status: "verified",
    });

    const prop2 = await Property.create({
      ownerId: citizen1._id,
      tenementNumber: "NPM/01/1002",
      address: "45, Station Road",
      wardId: ward1._id,
      area: 850,
      propertyType: "commercial",
      constructionYear: 2020,
      status: "pending",
    });

    // Citizen 2 - Ward 1 (Officer 1)
    const prop3 = await Property.create({
      ownerId: citizen2._id,
      tenementNumber: "NPM/01/1003",
      address: "8, Lake View Apartments",
      wardId: ward1._id,
      area: 1500,
      propertyType: "residential",
      constructionYear: 2010,
      status: "verified",
    });

    const prop4 = await Property.create({
      ownerId: citizen2._id,
      tenementNumber: "NPM/01/1004",
      address: "22, Garden Layout",
      wardId: ward1._id,
      area: 3000,
      propertyType: "industrial",
      constructionYear: 2018,
      status: "pending",
    });

    // Citizen 3 - Ward 2 (Officer 2)
    const prop5 = await Property.create({
      ownerId: citizen3._id,
      tenementNumber: "NPM/02/1005",
      address: "5, Market Road",
      wardId: ward2._id,
      area: 2000,
      propertyType: "commercial",
      constructionYear: 2008,
      status: "verified",
    });

    const prop6 = await Property.create({
      ownerId: citizen3._id,
      tenementNumber: "NPM/02/1006",
      address: "19, Bazaar Street",
      wardId: ward2._id,
      area: 1100,
      propertyType: "residential",
      constructionYear: 2019,
      status: "pending",
    });

    // Citizen 4 - Ward 2 (Officer 2)
    const prop7 = await Property.create({
      ownerId: citizen4._id,
      tenementNumber: "NPM/02/1007",
      address: "33, Heritage Lane",
      wardId: ward2._id,
      area: 950,
      propertyType: "residential",
      constructionYear: 2005,
      status: "verified",
    });

    const prop8 = await Property.create({
      ownerId: citizen4._id,
      tenementNumber: "NPM/02/1008",
      address: "7, Trade Square",
      wardId: ward2._id,
      area: 4000,
      propertyType: "industrial",
      constructionYear: 2021,
      status: "pending",
    });

    // Citizen 5 - Ward 3 (Officer 3)
    const prop9 = await Property.create({
      ownerId: citizen5._id,
      tenementNumber: "NPM/03/1009",
      address: "14, Shivaji Nagar",
      wardId: ward3._id,
      area: 1350,
      propertyType: "residential",
      constructionYear: 2012,
      status: "verified",
    });

    const prop10 = await Property.create({
      ownerId: citizen5._id,
      tenementNumber: "NPM/03/1010",
      address: "29, Park Road",
      wardId: ward3._id,
      area: 1800,
      propertyType: "commercial",
      constructionYear: 2017,
      status: "pending",
    });

    // Citizen 6 - Ward 3 (Officer 3)
    const prop11 = await Property.create({
      ownerId: citizen6._id,
      tenementNumber: "NPM/03/1011",
      address: "3, Green Valley",
      wardId: ward3._id,
      area: 1600,
      propertyType: "residential",
      constructionYear: 2014,
      status: "verified",
    });

    const prop12 = await Property.create({
      ownerId: citizen6._id,
      tenementNumber: "NPM/03/1012",
      address: "18, Industrial Estate",
      wardId: ward3._id,
      area: 5000,
      propertyType: "industrial",
      constructionYear: 2022,
      status: "pending",
    });
    console.log("Created 12 properties (1 verified + 1 pending per citizen)");

    // --- No payments, no tax records, no grievances ---
    // Tax records are created dynamically when a citizen views/pays taxes.
    // Payments start at zero. Dashboard stats are calculated live from the DB.

    console.log("\n=== SEED COMPLETE ===");
    console.log("\nLogin credentials:");
    console.log("  Admin:    admin@np.in / admin123");
    console.log("  Officer1: officer1@np.in / officer123");
    console.log("  Officer2: officer2@np.in / officer123");
    console.log("  Officer3: officer3@np.in / officer123");
    console.log("  Citizen1: aarav@example.com / citizen123");
    console.log("  Citizen2: meera@example.com / citizen123");
    console.log("  Citizen3: karan@example.com / citizen123");
    console.log("  Citizen4: sneha@example.com / citizen123");
    console.log("  Citizen5: aditya@example.com / citizen123");
    console.log("  Citizen6: divya@example.com / citizen123");

    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

seed();
