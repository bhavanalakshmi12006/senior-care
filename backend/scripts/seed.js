import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import * as XLSX from "xlsx";
import path from "node:path";
import { fileURLToPath } from "node:url";

import User from "../models/User.js";
import Senior from "../models/Senior.js";
import Caregiver from "../models/Caregiver.js";
import FamilyMember from "../models/FamilyMember.js";
import Volunteer from "../models/Volunteer.js";
import Checkin from "../models/Checkin.js";
import Emergency from "../models/Emergency.js";
import Appointment from "../models/Appointment.js";
import AssistanceRequest from "../models/AssistanceRequest.js";
import Fee from "../models/Fee.js";
import Payment from "../models/Payment.js";
import Notification from "../models/Notification.js";
import NotificationPreference from "../models/NotificationPreference.js";
import RecentlyAccessed from "../models/RecentlyAccessed.js";
import AuditLog from "../models/AuditLog.js";
import CareData from "../models/CareData.js";
import ModuleRecord from "../models/ModuleRecord.js";
import Review from "../models/Review.js";
import Video from "../models/Video.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "senior_care";
const password = process.env.TESTER_PASSWORD || "SeniorCare@2026!";

async function seed() {
  console.log(`Connecting to MongoDB: ${MONGODB_URI} (${MONGODB_DB_NAME})...`);
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB_NAME });
  console.log("Connected to MongoDB!");

  const passwordHash = await bcrypt.hash(password, 10);

  // 1. Seed Users with Official Accounts and Contact Numbers
  const userSeeds = [
    { email: "admin.test@seniorcare.local", displayName: "Administrator Rajesh", firstName: "Rajesh", lastName: "Sharma", role: "admin", phone: "+91 98765 00001", address: "Anna Nagar, Chennai" },
    { email: "staff.test@seniorcare.local", displayName: "Staff Murugan", firstName: "Murugan", lastName: "Pillai", role: "staff", phone: "+91 98765 00002", address: "T. Nagar, Chennai" },
    
    // Senior Citizens
    { email: "senior.test@seniorcare.local", displayName: "Kalyani Ammal", firstName: "Kalyani", lastName: "Ammal", role: "senior_citizen", phone: "+91 9080578504", address: "Door No. 14, 2nd Cross Street, Kasturibai Nagar, Adyar, Chennai" },
    { email: "senior2.test@seniorcare.local", displayName: "Ramasamy Sundaram", firstName: "Ramasamy", lastName: "Sundaram", role: "senior_citizen", phone: "+91 98765 43211", address: "Flat 2A, Anandam Apts, 4th Main Road, Gandhi Nagar, Adyar, Chennai" },
    { email: "senior3.test@seniorcare.local", displayName: "Meenakshi Ammal", firstName: "Meenakshi", lastName: "Ammal", role: "senior_citizen", phone: "+91 98765 43212", address: "Old No. 45, New No. 22, South Mada Street, Mylapore, Chennai" },
    { email: "senior4.test@seniorcare.local", displayName: "Gopalakrishnan V", firstName: "Gopalakrishnan", lastName: "V", role: "senior_citizen", phone: "+91 98765 43213", address: "Plot 88, 3rd Seaward Road, Valmiki Nagar, Thiruvanmiyur, Chennai" },
    { email: "senior5.test@seniorcare.local", displayName: "Dr. K. S. Ramanathan", firstName: "Ramanathan", lastName: "K S", role: "senior_citizen", phone: "+91 98765 43215", address: "Door No. 28, 4th Seaward Road, Valmiki Nagar, Thiruvanmiyur, Chennai" },
    { email: "senior6.test@seniorcare.local", displayName: "Rajalakshmi Narayanan", firstName: "Rajalakshmi", lastName: "Narayanan", role: "senior_citizen", phone: "+91 98765 43216", address: "Flat 3B, Brindavan Apts, 3rd Cross Street, Mandaveli, Chennai" },

    // Family Members for Senior 1 (Kalyani Ammal - 3 Children)
    { email: "family.test@seniorcare.local", displayName: "Bhavana Lakshmi (Daughter)", firstName: "Bhavana", lastName: "Lakshmi", role: "family_member", phone: "+91 9345403336", address: "Velachery, Chennai" },
    { email: "bhavanalakshmi12006@gmail.com", displayName: "Bhavana Lakshmi (Daughter)", firstName: "Bhavana", lastName: "Lakshmi", role: "family_member", phone: "+91 9345403336", address: "Velachery, Chennai" },
    { email: "arun.kumar@seniorcare.local", displayName: "Arun Kumar (Son)", firstName: "Arun", lastName: "Kumar", role: "family_member", phone: "+91 98765 77771", address: "Velachery, Chennai" },
    { email: "pooja.lakshmi@seniorcare.local", displayName: "Pooja Lakshmi (Daughter)", firstName: "Pooja", lastName: "Lakshmi", role: "family_member", phone: "+91 98765 77772", address: "Velachery, Chennai" },

    // Family Members for Senior 2 (Ramasamy Sundaram - 2 Children)
    { email: "family2.test@seniorcare.local", displayName: "Suresh Sundaram (Son)", firstName: "Suresh", lastName: "Sundaram", role: "family_member", phone: "+91 98765 11111", address: "Adyar, Chennai" },
    { email: "suresh.sundaram@seniorcare.local", displayName: "Suresh Sundaram (Son)", firstName: "Suresh", lastName: "Sundaram", role: "family_member", phone: "+91 98765 11111", address: "Adyar, Chennai" },
    { email: "kavitha.sundaram@seniorcare.local", displayName: "Kavitha Sundaram (Daughter)", firstName: "Kavitha", lastName: "Sundaram", role: "family_member", phone: "+91 98765 11112", address: "Adyar, Chennai" },

    // Family Members for Senior 3 (Meenakshi Ammal - 2 Children)
    { email: "family3.test@seniorcare.local", displayName: "Geetha Mohan (Daughter-in-law)", firstName: "Geetha", lastName: "Mohan", role: "family_member", phone: "+91 98765 22222", address: "Mylapore, Chennai" },
    { email: "geetha.mohan@seniorcare.local", displayName: "Geetha Mohan (Daughter-in-law)", firstName: "Geetha", lastName: "Mohan", role: "family_member", phone: "+91 98765 22222", address: "Mylapore, Chennai" },
    { email: "mohan.narayanan@seniorcare.local", displayName: "Mohan Narayanan (Son)", firstName: "Mohan", lastName: "Narayanan", role: "family_member", phone: "+91 98765 22223", address: "Mylapore, Chennai" },

    // Family Members for Senior 4 (Gopalakrishnan V - 2 Children)
    { email: "family4.test@seniorcare.local", displayName: "Venkat Gopal (Son-in-law)", firstName: "Venkat", lastName: "Gopal", role: "family_member", phone: "+91 98765 33333", address: "Thiruvanmiyur, Chennai" },
    { email: "venkat.gopal@seniorcare.local", displayName: "Venkat Gopal (Son-in-law)", firstName: "Venkat", lastName: "Gopal", role: "family_member", phone: "+91 98765 33333", address: "Thiruvanmiyur, Chennai" },
    { email: "shanthi.gopal@seniorcare.local", displayName: "Shanthi Gopal (Daughter)", firstName: "Shanthi", lastName: "Gopal", role: "family_member", phone: "+91 98765 33334", address: "Thiruvanmiyur, Chennai" },

    // Family Members for Senior 5 (Dr. K. S. Ramanathan - 3 Children)
    { email: "family5.test@seniorcare.local", displayName: "Dr. Karthik Ramanathan (Son)", firstName: "Karthik", lastName: "Ramanathan", role: "family_member", phone: "+91 98765 55551", address: "Thiruvanmiyur, Chennai" },
    { email: "karthik.ramanathan@seniorcare.local", displayName: "Dr. Karthik Ramanathan (Son)", firstName: "Karthik", lastName: "Ramanathan", role: "family_member", phone: "+91 98765 55551", address: "Thiruvanmiyur, Chennai" },
    { email: "priya.ramanathan@seniorcare.local", displayName: "Priya Ramanathan (Daughter)", firstName: "Priya", lastName: "Ramanathan", role: "family_member", phone: "+91 98765 55552", address: "Besant Nagar, Chennai" },
    { email: "ashwin.ramanathan@seniorcare.local", displayName: "Ashwin Ramanathan (Son)", firstName: "Ashwin", lastName: "Ramanathan", role: "family_member", phone: "+91 98765 55553", address: "OMR, Chennai" },

    // Family Members for Senior 6 (Rajalakshmi Narayanan - 3 Children)
    { email: "family6.test@seniorcare.local", displayName: "Deepa Narayanan (Daughter)", firstName: "Deepa", lastName: "Narayanan", role: "family_member", phone: "+91 98765 66661", address: "Mandaveli, Chennai" },
    { email: "deepa.narayanan@seniorcare.local", displayName: "Deepa Narayanan (Daughter)", firstName: "Deepa", lastName: "Narayanan", role: "family_member", phone: "+91 98765 66661", address: "Mandaveli, Chennai" },
    { email: "vijay.narayanan@seniorcare.local", displayName: "Vijay Narayanan (Son)", firstName: "Vijay", lastName: "Narayanan", role: "family_member", phone: "+91 98765 66662", address: "Alwarpet, Chennai" },
    { email: "swetha.narayanan@seniorcare.local", displayName: "Swetha Narayanan (Daughter)", firstName: "Swetha", lastName: "Narayanan", role: "family_member", phone: "+91 98765 66663", address: "RA Puram, Chennai" },

    // Care Staff & Volunteers
    { email: "caretaker.test@seniorcare.local", displayName: "Anitha Krishnan", firstName: "Anitha", lastName: "Krishnan", role: "caretaker", phone: "+91 6382598599", address: "Mylapore, Chennai" },
    { email: "caregiver.test@seniorcare.local", displayName: "Anitha Krishnan", firstName: "Anitha", lastName: "Krishnan", role: "caretaker", phone: "+91 6382598599", address: "Mylapore, Chennai" },
    { email: "volunteer.test@seniorcare.local", displayName: "Karthik Raman", firstName: "Karthik", lastName: "Raman", role: "volunteer", phone: "+91 9443327744", address: "Thiruvanmiyur, Chennai" }
  ];

  const createdUsers = {};
  for (const u of userSeeds) {
    const user = await User.findOneAndUpdate(
      { email: u.email },
      { ...u, passwordHash, status: "active", preferredLanguage: "en", themePreference: "light" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    createdUsers[u.role] = user;
    createdUsers[u.email] = user;
    if (u.email.includes("senior.test")) createdUsers.seniorUser = user;
    if (u.email.includes("caretaker") || u.email.includes("caregiver")) createdUsers.caretakerUser = user;
    if (u.email.includes("family.") || u.email.includes("bhavana")) createdUsers.family_member = user;
    if (u.email.includes("volunteer")) createdUsers.volunteerUser = user;
  }
  console.log("✓ Users seeded with official accounts and phone numbers");

  // 2. Seed Seniors with Family Member Linkages
  await Senior.deleteMany({});
  const seniorDocs = await Senior.insertMany([
    {
      userId: createdUsers["senior.test@seniorcare.local"]._id,
      name: "Kalyani Ammal",
      age: 72,
      gender: "Female",
      phone: "+91 9080578504",
      address: "Door No. 14, 2nd Cross Street, Kasturibai Nagar, Adyar, Chennai",
      emergencyContactName: "Bhavana Lakshmi (Daughter)",
      emergencyContactPhone: "+91 9345403336",
      emergencyContactRelation: "Daughter",
      bloodGroup: "O+",
      medicalNotes: "Hypertension, Mild Type-2 Diabetes. Monthly routine checkup cycle scheduled.",
      roomNumber: "Independent Home Residence",
      assignedCaregiverId: createdUsers.caretakerUser._id,
      assignedCaregiverName: "Anitha Krishnan",
      familyMemberUserIds: [
        createdUsers["family.test@seniorcare.local"]._id,
        createdUsers["bhavanalakshmi12006@gmail.com"]._id,
        createdUsers["arun.kumar@seniorcare.local"]._id,
        createdUsers["pooja.lakshmi@seniorcare.local"]._id
      ],
      safetyStatus: "safe",
      lastCheckinAt: new Date(),
      checkinStreak: 14,
      status: "active"
    },
    {
      userId: createdUsers["senior2.test@seniorcare.local"]._id,
      name: "Ramasamy Sundaram",
      age: 78,
      gender: "Male",
      phone: "+91 98765 43211",
      address: "Flat 2A, Anandam Apts, 4th Main Road, Gandhi Nagar, Adyar, Chennai",
      emergencyContactName: "Suresh Sundaram (Son)",
      emergencyContactPhone: "+91 98765 11111",
      emergencyContactRelation: "Son",
      bloodGroup: "B+",
      medicalNotes: "Post knee replacement recovery, requires cane assistance.",
      roomNumber: "Independent Residence",
      assignedCaregiverId: createdUsers.caretakerUser._id,
      assignedCaregiverName: "Anitha Krishnan",
      familyMemberUserIds: [
        createdUsers["family2.test@seniorcare.local"]._id,
        createdUsers["suresh.sundaram@seniorcare.local"]._id,
        createdUsers["kavitha.sundaram@seniorcare.local"]._id
      ],
      safetyStatus: "safe",
      lastCheckinAt: new Date(Date.now() - 3600000 * 2),
      checkinStreak: 9,
      status: "active"
    },
    {
      userId: createdUsers["senior3.test@seniorcare.local"]._id,
      name: "Meenakshi Ammal",
      age: 81,
      gender: "Female",
      phone: "+91 98765 43212",
      address: "Old No. 45, New No. 22, South Mada Street, Mylapore, Chennai",
      emergencyContactName: "Geetha Mohan (Daughter-in-law)",
      emergencyContactPhone: "+91 98765 22222",
      emergencyContactRelation: "Daughter-in-law",
      bloodGroup: "A+",
      medicalNotes: "Mild memory lapses, arthritis, cataract surgery scheduled.",
      roomNumber: "Independent Residence",
      assignedCaregiverId: createdUsers.caretakerUser._id,
      assignedCaregiverName: "Anitha Krishnan",
      familyMemberUserIds: [
        createdUsers["family3.test@seniorcare.local"]._id,
        createdUsers["geetha.mohan@seniorcare.local"]._id,
        createdUsers["mohan.narayanan@seniorcare.local"]._id
      ],
      safetyStatus: "safe",
      lastCheckinAt: new Date(Date.now() - 3600000 * 4),
      checkinStreak: 5,
      status: "active"
    },
    {
      userId: createdUsers["senior4.test@seniorcare.local"]._id,
      name: "Gopalakrishnan V",
      age: 75,
      gender: "Male",
      phone: "+91 98765 43213",
      address: "Plot 88, 3rd Seaward Road, Valmiki Nagar, Thiruvanmiyur, Chennai",
      emergencyContactName: "Venkat Gopal (Son-in-law)",
      emergencyContactPhone: "+91 98765 33333",
      emergencyContactRelation: "Son-in-law",
      bloodGroup: "AB+",
      medicalNotes: "Pacemaker implanted 2022, routine cardiac review.",
      roomNumber: "Independent Residence",
      assignedCaregiverId: createdUsers.caretakerUser._id,
      assignedCaregiverName: "Anitha Krishnan",
      familyMemberUserIds: [
        createdUsers["family4.test@seniorcare.local"]._id,
        createdUsers["venkat.gopal@seniorcare.local"]._id,
        createdUsers["shanthi.gopal@seniorcare.local"]._id
      ],
      safetyStatus: "safe",
      lastCheckinAt: new Date(Date.now() - 3600000 * 26),
      checkinStreak: 12,
      status: "active"
    },
    {
      userId: createdUsers["senior5.test@seniorcare.local"]._id,
      name: "Dr. K. S. Ramanathan",
      age: 76,
      gender: "Male",
      phone: "+91 98765 43215",
      address: "Door No. 28, 4th Seaward Road, Valmiki Nagar, Thiruvanmiyur, Chennai",
      emergencyContactName: "Dr. Karthik Ramanathan (Son)",
      emergencyContactPhone: "+91 98765 55551",
      emergencyContactRelation: "Son",
      bloodGroup: "A+",
      medicalNotes: "Chronic hypertension, diabetic neuropathy, needs monthly cardiology review.",
      roomNumber: "Villa 12, Senior Care Haven",
      assignedCaregiverId: createdUsers.caretakerUser._id,
      assignedCaregiverName: "Anitha Krishnan",
      familyMemberUserIds: [
        createdUsers["family5.test@seniorcare.local"]._id,
        createdUsers["karthik.ramanathan@seniorcare.local"]._id,
        createdUsers["priya.ramanathan@seniorcare.local"]._id,
        createdUsers["ashwin.ramanathan@seniorcare.local"]._id
      ],
      safetyStatus: "safe",
      lastCheckinAt: new Date(),
      checkinStreak: 18,
      status: "active"
    },
    {
      userId: createdUsers["senior6.test@seniorcare.local"]._id,
      name: "Rajalakshmi Narayanan",
      age: 74,
      gender: "Female",
      phone: "+91 98765 43216",
      address: "Flat 3B, Brindavan Apts, 3rd Cross Street, Mandaveli, Chennai",
      emergencyContactName: "Deepa Narayanan (Daughter)",
      emergencyContactPhone: "+91 98765 66661",
      emergencyContactRelation: "Daughter",
      bloodGroup: "B+",
      medicalNotes: "Osteoarthritis, mild glaucoma, routine eye drops & physiotherapy.",
      roomNumber: "Suite 104, Senior Care Haven",
      assignedCaregiverId: createdUsers.caretakerUser._id,
      assignedCaregiverName: "Anitha Krishnan",
      familyMemberUserIds: [
        createdUsers["family6.test@seniorcare.local"]._id,
        createdUsers["deepa.narayanan@seniorcare.local"]._id,
        createdUsers["vijay.narayanan@seniorcare.local"]._id,
        createdUsers["swetha.narayanan@seniorcare.local"]._id
      ],
      safetyStatus: "safe",
      lastCheckinAt: new Date(),
      checkinStreak: 15,
      status: "active"
    },
    {
      name: "Saraswathi Natarajan",
      age: 69,
      gender: "Female",
      phone: "+91 98765 43214",
      address: "Door No. 12, 11th Avenue, Harrington Road, Chetpet, Chennai",
      emergencyContactName: "Natarajan S (Husband)",
      emergencyContactPhone: "+91 98765 44444",
      emergencyContactRelation: "Spouse",
      bloodGroup: "O-",
      medicalNotes: "Asthma, inhaler on bedside table.",
      roomNumber: "Independent Residence",
      assignedCaregiverId: createdUsers.caretakerUser._id,
      assignedCaregiverName: "Anitha Krishnan",
      familyMemberUserIds: [],
      safetyStatus: "safe",
      lastCheckinAt: new Date(Date.now() - 3600000 * 1),
      checkinStreak: 21,
      status: "active"
    }
  ]);
  console.log(`✓ Seniors seeded (${seniorDocs.length})`);
  const primarySenior = seniorDocs[0];

  // 3. Seed Caregiver & FamilyMember & Volunteer profiles
  await Caregiver.deleteMany({});
  await Caregiver.create({
    userId: createdUsers.caretakerUser._id,
    name: "Anitha Krishnan",
    phone: "+91 6382598599",
    email: "caretaker.test@seniorcare.local",
    specialization: "Geriatric Nursing & Medication Supervision",
    assignedSeniorIds: seniorDocs.map(s => s._id),
    shift: "Morning",
    rating: 4.9,
    status: "active"
  });

  await FamilyMember.deleteMany({});
  await FamilyMember.insertMany([
    // Children for Kalyani Ammal
    {
      userId: createdUsers["bhavanalakshmi12006@gmail.com"]._id,
      name: "Bhavana Lakshmi (Daughter)",
      phone: "+91 9345403336",
      email: "bhavanalakshmi12006@gmail.com",
      relation: "Daughter",
      linkedSeniorIds: [seniorDocs[0]._id],
      emergencyContact: true
    },
    {
      userId: createdUsers["family.test@seniorcare.local"]._id,
      name: "Bhavana Lakshmi (Daughter)",
      phone: "+91 9345403336",
      email: "family.test@seniorcare.local",
      relation: "Daughter",
      linkedSeniorIds: [seniorDocs[0]._id],
      emergencyContact: true
    },
    {
      userId: createdUsers["arun.kumar@seniorcare.local"]._id,
      name: "Arun Kumar (Son)",
      phone: "+91 98765 77771",
      email: "arun.kumar@seniorcare.local",
      relation: "Son",
      linkedSeniorIds: [seniorDocs[0]._id],
      emergencyContact: false
    },
    {
      userId: createdUsers["pooja.lakshmi@seniorcare.local"]._id,
      name: "Pooja Lakshmi (Daughter)",
      phone: "+91 98765 77772",
      email: "pooja.lakshmi@seniorcare.local",
      relation: "Daughter",
      linkedSeniorIds: [seniorDocs[0]._id],
      emergencyContact: false
    },

    // Children for Ramasamy Sundaram
    {
      userId: createdUsers["family2.test@seniorcare.local"]._id,
      name: "Suresh Sundaram (Son)",
      phone: "+91 98765 11111",
      email: "family2.test@seniorcare.local",
      relation: "Son",
      linkedSeniorIds: [seniorDocs[1]._id],
      emergencyContact: true
    },
    {
      userId: createdUsers["kavitha.sundaram@seniorcare.local"]._id,
      name: "Kavitha Sundaram (Daughter)",
      phone: "+91 98765 11112",
      email: "kavitha.sundaram@seniorcare.local",
      relation: "Daughter",
      linkedSeniorIds: [seniorDocs[1]._id],
      emergencyContact: false
    },

    // Children for Meenakshi Ammal
    {
      userId: createdUsers["family3.test@seniorcare.local"]._id,
      name: "Geetha Mohan (Daughter-in-law)",
      phone: "+91 98765 22222",
      email: "family3.test@seniorcare.local",
      relation: "Daughter-in-law",
      linkedSeniorIds: [seniorDocs[2]._id],
      emergencyContact: true
    },
    {
      userId: createdUsers["mohan.narayanan@seniorcare.local"]._id,
      name: "Mohan Narayanan (Son)",
      phone: "+91 98765 22223",
      email: "mohan.narayanan@seniorcare.local",
      relation: "Son",
      linkedSeniorIds: [seniorDocs[2]._id],
      emergencyContact: false
    },

    // Children for Gopalakrishnan V
    {
      userId: createdUsers["family4.test@seniorcare.local"]._id,
      name: "Venkat Gopal (Son-in-law)",
      phone: "+91 98765 33333",
      email: "family4.test@seniorcare.local",
      relation: "Son-in-law",
      linkedSeniorIds: [seniorDocs[3]._id],
      emergencyContact: true
    },
    {
      userId: createdUsers["shanthi.gopal@seniorcare.local"]._id,
      name: "Shanthi Gopal (Daughter)",
      phone: "+91 98765 33334",
      email: "shanthi.gopal@seniorcare.local",
      relation: "Daughter",
      linkedSeniorIds: [seniorDocs[3]._id],
      emergencyContact: false
    },

    // Children for Dr. K. S. Ramanathan (Senior 5)
    {
      userId: createdUsers["family5.test@seniorcare.local"]._id,
      name: "Dr. Karthik Ramanathan (Son)",
      phone: "+91 98765 55551",
      email: "family5.test@seniorcare.local",
      relation: "Son",
      linkedSeniorIds: [seniorDocs[4]._id],
      emergencyContact: true
    },
    {
      userId: createdUsers["karthik.ramanathan@seniorcare.local"]._id,
      name: "Dr. Karthik Ramanathan (Son)",
      phone: "+91 98765 55551",
      email: "karthik.ramanathan@seniorcare.local",
      relation: "Son",
      linkedSeniorIds: [seniorDocs[4]._id],
      emergencyContact: true
    },
    {
      userId: createdUsers["priya.ramanathan@seniorcare.local"]._id,
      name: "Priya Ramanathan (Daughter)",
      phone: "+91 98765 55552",
      email: "priya.ramanathan@seniorcare.local",
      relation: "Daughter",
      linkedSeniorIds: [seniorDocs[4]._id],
      emergencyContact: false
    },
    {
      userId: createdUsers["ashwin.ramanathan@seniorcare.local"]._id,
      name: "Ashwin Ramanathan (Son)",
      phone: "+91 98765 55553",
      email: "ashwin.ramanathan@seniorcare.local",
      relation: "Son",
      linkedSeniorIds: [seniorDocs[4]._id],
      emergencyContact: false
    },

    // Children for Rajalakshmi Narayanan (Senior 6)
    {
      userId: createdUsers["family6.test@seniorcare.local"]._id,
      name: "Deepa Narayanan (Daughter)",
      phone: "+91 98765 66661",
      email: "family6.test@seniorcare.local",
      relation: "Daughter",
      linkedSeniorIds: [seniorDocs[5]._id],
      emergencyContact: true
    },
    {
      userId: createdUsers["deepa.narayanan@seniorcare.local"]._id,
      name: "Deepa Narayanan (Daughter)",
      phone: "+91 98765 66661",
      email: "deepa.narayanan@seniorcare.local",
      relation: "Daughter",
      linkedSeniorIds: [seniorDocs[5]._id],
      emergencyContact: true
    },
    {
      userId: createdUsers["vijay.narayanan@seniorcare.local"]._id,
      name: "Vijay Narayanan (Son)",
      phone: "+91 98765 66662",
      email: "vijay.narayanan@seniorcare.local",
      relation: "Son",
      linkedSeniorIds: [seniorDocs[5]._id],
      emergencyContact: false
    },
    {
      userId: createdUsers["swetha.narayanan@seniorcare.local"]._id,
      name: "Swetha Narayanan (Daughter)",
      phone: "+91 98765 66663",
      email: "swetha.narayanan@seniorcare.local",
      relation: "Daughter",
      linkedSeniorIds: [seniorDocs[5]._id],
      emergencyContact: false
    }
  ]);

  await Volunteer.deleteMany({});
  await Volunteer.create({
    userId: createdUsers.volunteerUser?._id || createdUsers.volunteer?._id,
    name: "Karthik Raman",
    phone: "+91 9443327744",
    email: "volunteer.test@seniorcare.local",
    skills: ["Medicine Pickup", "Grocery Shopping", "Tech Assistance", "Wheelchair Support"],
    availability: "Weekdays 8am - 6pm",
    tasksCompleted: 18,
    status: "active"
  });

  // Seed Reviews for Leaderboard & Login Page Showcase
  await Review.deleteMany({});
  await Review.insertMany([
    {
      targetType: "caregiver",
      targetId: createdUsers.caretakerUser._id,
      targetName: "Anitha Krishnan",
      targetRole: "caretaker",
      seniorId: primarySenior._id,
      seniorName: primarySenior.name,
      reviewerId: createdUsers.family_member._id,
      reviewerName: "Bhavana Lakshmi (Daughter)",
      reviewerRole: "family_member",
      rating: 5,
      feedback: "Nurse Anitha has been exceptionally caring and attentive to my mother Kalyani Ammal in Adyar. Her daily morning vitals tracking, BP monitoring, and warm companionship give our family total reassurance and peace of mind.",
      tags: ["Punctual & Reliable", "Gentle & Compassionate", "Attentive to Vitals", "Highly Recommended"],
      isComplaint: false,
      status: "active"
    },
    {
      targetType: "volunteer",
      targetId: createdUsers.volunteerUser?._id || createdUsers.volunteer?._id,
      targetName: "Karthik Raman",
      targetRole: "volunteer",
      seniorId: primarySenior._id,
      seniorName: primarySenior.name,
      reviewerId: createdUsers.seniorUser._id,
      reviewerName: "Kalyani Ammal",
      reviewerRole: "senior_citizen",
      rating: 5,
      feedback: "Karthik helped me promptly with picking up my cardiac medications from Apollo Pharmacy and doorstep grocery assistance in Adyar. Very polite, trustworthy, and respectful young man.",
      tags: ["Trustworthy & Safe", "Punctual & Reliable", "Excellent Communication"],
      isComplaint: false,
      status: "active"
    },
    {
      targetType: "caregiver",
      targetId: createdUsers.caretakerUser._id,
      targetName: "Anitha Krishnan",
      targetRole: "caretaker",
      seniorId: seniorDocs[1]._id,
      seniorName: seniorDocs[1].name,
      reviewerId: createdUsers.adminUser?._id || createdUsers.admin?._id,
      reviewerName: "Suresh Sundaram (Family)",
      reviewerRole: "family_member",
      rating: 5,
      feedback: "Very dedicated nurse. Managed post-surgery recovery with regular physiotherapy exercises and compassionate care.",
      tags: ["Gentle & Compassionate", "Highly Recommended"],
      isComplaint: false,
      status: "active"
    },
    {
      targetType: "volunteer",
      targetId: createdUsers.volunteerUser?._id || createdUsers.volunteer?._id,
      targetName: "Karthik Raman",
      targetRole: "volunteer",
      seniorId: seniorDocs[4]._id,
      seniorName: seniorDocs[4].name,
      reviewerId: createdUsers.staffUser?._id || createdUsers.staff?._id,
      reviewerName: "Saraswathi Natarajan",
      reviewerRole: "senior_citizen",
      rating: 5,
      feedback: "Assisted me with wheelchair mobility during hospital visit and library books return. Excellent service!",
      tags: ["Trustworthy & Safe", "Highly Recommended"],
      isComplaint: false,
      status: "active"
    }
  ]);
  console.log("✓ Caregiver, Family & Volunteer profiles and reviews seeded");

  // 4. Seed Checkins
  await Checkin.deleteMany({});
  const checkins = [
    { seniorId: primarySenior._id, seniorName: primarySenior.name, userId: createdUsers.seniorUser._id, status: "safe", mood: "good", notes: "Feeling great today, completed morning walk.", method: "self", timestamp: new Date() },
    { seniorId: primarySenior._id, seniorName: primarySenior.name, userId: createdUsers.seniorUser._id, status: "safe", mood: "good", notes: "Took morning medications on time.", method: "self", timestamp: new Date(Date.now() - 86400000) },
    { seniorId: primarySenior._id, seniorName: primarySenior.name, userId: createdUsers.seniorUser._id, status: "safe", mood: "okay", notes: "Slight joint ache, applied ointment.", method: "self", timestamp: new Date(Date.now() - 86400000 * 2) },
    { seniorId: seniorDocs[1]._id, seniorName: seniorDocs[1].name, status: "safe", mood: "good", notes: "Physiotherapy exercises done.", method: "caregiver", timestamp: new Date() },
    { seniorId: seniorDocs[2]._id, seniorName: seniorDocs[2].name, status: "safe", mood: "good", notes: "All good, had breakfast.", method: "caregiver", timestamp: new Date() },
    { seniorId: seniorDocs[3]._id, seniorName: seniorDocs[3].name, status: "safe", mood: "okay", notes: "Resting comfortably.", method: "self", timestamp: new Date(Date.now() - 86400000) },
    { seniorId: seniorDocs[4]._id, seniorName: seniorDocs[4].name, userId: createdUsers["senior5.test@seniorcare.local"]._id, status: "safe", mood: "good", notes: "Morning vitals stable, blood pressure 125/82 mmHg.", method: "self", timestamp: new Date() },
    { seniorId: seniorDocs[5]._id, seniorName: seniorDocs[5].name, userId: createdUsers["senior6.test@seniorcare.local"]._id, status: "safe", mood: "good", notes: "Eye drops taken and morning prayers done.", method: "self", timestamp: new Date() }
  ];
  await Checkin.insertMany(checkins);
  console.log("✓ Check-ins seeded");

  // 5. Seed Emergencies
  await Emergency.deleteMany({});
  const emergencies = [
    {
      emergencyCode: "EMG-1024",
      seniorId: primarySenior._id,
      seniorName: primarySenior.name,
      triggeredBy: createdUsers.seniorUser._id,
      triggeredRole: "senior_citizen",
      status: "active",
      severity: "critical",
      location: "Home Residence - Bedside (Adyar)",
      notes: "Severe shortness of breath reported. Caregiver dispatched to home.",
      acknowledgedBy: "Anitha Krishnan (Caregiver)",
      acknowledgedAt: new Date(Date.now() - 600000),
      actionsTaken: [
        { note: "Emergency triggered via mobile dashboard from home residence", actionTime: new Date(Date.now() - 900000), by: "Kalyani Ammal" },
        { note: "Caregiver Anitha acknowledged alert and reached elder's residence", actionTime: new Date(Date.now() - 600000), by: "Anitha Krishnan" }
      ]
    },
    {
      emergencyCode: "EMG-1022",
      seniorId: seniorDocs[1]._id,
      seniorName: seniorDocs[1].name,
      triggeredBy: createdUsers.caretakerUser._id,
      triggeredRole: "caretaker",
      status: "resolved",
      severity: "high",
      location: "Garden Walking Track",
      notes: "Mild dizziness during morning walk. Vitals checked, blood pressure 130/85. Resolved with rest and glucose water.",
      acknowledgedBy: "Anitha Krishnan",
      acknowledgedAt: new Date(Date.now() - 86400000 * 3),
      resolvedBy: "Anitha Krishnan",
      resolvedAt: new Date(Date.now() - 86400000 * 3 + 3600000)
    }
  ];
  await Emergency.insertMany(emergencies);
  console.log("✓ Emergencies seeded");

  // 6. Seed Appointments
  await Appointment.deleteMany({});
  const appointments = [
    {
      appointmentCode: "APT-201",
      seniorId: primarySenior._id,
      seniorName: primarySenior.name,
      doctorName: "Dr. S. Kumar, MD (Geriatric Cardiology)",
      department: "Geriatric Medicine",
      hospital: "Apollo Senior Health Center",
      appointmentDate: new Date(Date.now() + 86400000 * 1), // Tomorrow
      timeSlot: "10:00 AM",
      status: "Upcoming",
      notes: "Monthly Routine Geriatric Checkup Cycle - October 2026. Follow-up review on adjusted Amlodipine 10mg and BP check.",
      reminderSent: true
    },
    {
      appointmentCode: "APT-195",
      seniorId: primarySenior._id,
      seniorName: primarySenior.name,
      doctorName: "Dr. S. Kumar, MD (Geriatric Cardiology)",
      department: "Geriatric Medicine",
      hospital: "Apollo Senior Health Center",
      appointmentDate: new Date(Date.now() - 86400000 * 2),
      timeSlot: "09:30 AM",
      status: "Completed",
      notes: "Quarterly geriatric health examination & review.",
      doctorFeedback: "Consultation completed. Patient reported mild evening headaches. Blood pressure recorded at 145/90 mmHg, Pulse 76 bpm. Dr. S. Kumar increased Amlodipine dosage from 5mg to 10mg once daily in morning. Maintained Metformin at 500mg twice daily with meals. Added Atorvastatin 10mg at bedtime for lipid control. Advised low salt diet, daily 20-min walking, and repeat BP check in next monthly cycle.",
      vitalSigns: { bp: "145/90", pulse: 76, bloodSugar: "138 mg/dL", spo2: 98 },
      medicationChanges: [
        {
          medicineName: "Amlodipine",
          dosage: "10mg",
          previousDosage: "5mg",
          changeType: "increased",
          timing: "Morning after breakfast",
          instructions: "Dosage increased from 5mg to 10mg for blood pressure regulation."
        },
        {
          medicineName: "Metformin",
          dosage: "500mg",
          previousDosage: "500mg",
          changeType: "continued",
          timing: "Morning & Night after meals",
          instructions: "Maintained unchanged. Monitor fasting glucose."
        },
        {
          medicineName: "Atorvastatin",
          dosage: "10mg",
          previousDosage: "None",
          changeType: "new",
          timing: "Bedtime (Night)",
          instructions: "New prescription started for cardiovascular protection."
        }
      ],
      completedAt: new Date(Date.now() - 86400000 * 2)
    },
    {
      appointmentCode: "APT-202",
      seniorId: seniorDocs[1]._id,
      seniorName: seniorDocs[1].name,
      doctorName: "Dr. R. Malathi, MS (Ophthalmology)",
      department: "Ophthalmology",
      hospital: "Sankara Nethralaya",
      appointmentDate: new Date(Date.now() + 86400000 * 3),
      timeSlot: "02:00 PM",
      status: "Upcoming",
      notes: "Post-op cataract check."
    },
    {
      appointmentCode: "APT-203",
      seniorId: seniorDocs[2]._id,
      seniorName: seniorDocs[2].name,
      doctorName: "Dr. P. Vijay, MS (Orthopedics)",
      department: "Orthopedics",
      hospital: "Fortis Malar Hospital",
      appointmentDate: new Date(Date.now() + 86400000 * 5),
      timeSlot: "11:15 AM",
      status: "Upcoming",
      notes: "Knee arthritis assessment."
    },
    {
      appointmentCode: "APT-204",
      seniorId: seniorDocs[4]._id,
      seniorName: seniorDocs[4].name,
      doctorName: "Dr. S. Kumar, MD (Geriatric Cardiology)",
      department: "Cardiology",
      hospital: "Apollo Senior Health Center",
      appointmentDate: new Date(Date.now() + 86400000 * 2),
      timeSlot: "10:30 AM",
      status: "Upcoming",
      notes: "Quarterly cardiac pacemaker & hypertension checkup."
    },
    {
      appointmentCode: "APT-205",
      seniorId: seniorDocs[5]._id,
      seniorName: seniorDocs[5].name,
      doctorName: "Dr. R. Malathi, MS (Ophthalmology)",
      department: "Ophthalmology",
      hospital: "Sankara Nethralaya",
      appointmentDate: new Date(Date.now() + 86400000 * 4),
      timeSlot: "03:30 PM",
      status: "Upcoming",
      notes: "Glaucoma intraocular pressure follow-up examination."
    }
  ];
  await Appointment.insertMany(appointments);
  console.log("✓ Appointments seeded with doctor feedback and medication changes");

  // 7. Seed Assistance Requests
  await AssistanceRequest.deleteMany({});
  const assistanceRequests = [
    {
      seniorId: primarySenior._id,
      seniorName: primarySenior.name,
      category: "Medicine Pickup",
      title: "Prescription Refill for BP & Diabetes",
      description: "Needs 1 month supply of Amlodipine 5mg and Metformin 500mg from Apollo Pharmacy.",
      priority: "High",
      status: "In Progress",
      requestedBy: createdUsers.seniorUser._id,
      assignedTo: createdUsers.volunteerUser._id,
      assignedToName: "Karthik Raman (Volunteer)",
      assignedRole: "volunteer",
      notes: "Volunteer picked up prescription from pharmacy, delivered to senior residence."
    },
    {
      seniorId: primarySenior._id,
      seniorName: primarySenior.name,
      category: "Food Assistance",
      title: "Low-Sodium Diabetic Lunch Delivery",
      description: "Special diet meal box from Care Nutrition Center.",
      priority: "Normal",
      status: "Completed",
      requestedBy: createdUsers.seniorUser._id,
      assignedTo: createdUsers.caretakerUser._id,
      assignedToName: "Anitha Krishnan (Caregiver)",
      assignedRole: "caretaker",
      completedAt: new Date(Date.now() - 3600000 * 3),
      notes: "Nutritious home-cooked lunch delivered to senior's home residence in Adyar by volunteer."
    },
    {
      seniorId: seniorDocs[1]._id,
      seniorName: seniorDocs[1].name,
      category: "Travel Assistance",
      title: "Wheelchair escort to Eye Clinic",
      description: "Needs escort for appointment on Thursday afternoon.",
      priority: "Normal",
      status: "Accepted",
      assignedTo: createdUsers.volunteerUser._id,
      assignedToName: "Karthik Raman",
      assignedRole: "volunteer"
    },
    {
      seniorId: seniorDocs[2]._id,
      seniorName: seniorDocs[2].name,
      category: "Home Assistance",
      title: "Bathroom Anti-slip Mat Installation",
      description: "Install safety grip mats in shower area.",
      priority: "High",
      status: "Requested",
      requestedBy: createdUsers.staff._id
    },
    {
      seniorId: seniorDocs[4]._id,
      seniorName: seniorDocs[4].name,
      category: "Medicine Pickup",
      title: "Monthly Cardiac Medications Refill & Glucometer Strips",
      description: "Pick up monthly Telmisartan 40mg and Accu-Chek test strips from Apollo Pharmacy Thiruvanmiyur.",
      priority: "High",
      status: "In Progress",
      requestedBy: createdUsers["senior5.test@seniorcare.local"]._id,
      assignedTo: createdUsers.volunteerUser._id,
      assignedToName: "Karthik Raman (Volunteer)",
      assignedRole: "volunteer",
      notes: "Volunteer dispatched and medicines handed over to Dr. K. S. Ramanathan."
    },
    {
      seniorId: seniorDocs[5]._id,
      seniorName: seniorDocs[5].name,
      category: "Food Assistance",
      title: "Low-Salt Herbal Soup & Diabetic Dinner Delivery",
      description: "Organic hot nutritional dinner pack delivery to flat in Mandaveli.",
      priority: "Normal",
      status: "In Progress",
      requestedBy: createdUsers["senior6.test@seniorcare.local"]._id,
      assignedTo: createdUsers.caretakerUser._id,
      assignedToName: "Anitha Krishnan (Caregiver)",
      assignedRole: "caretaker",
      notes: "Caregiver Anitha prepared soup and delivered to Rajalakshmi Narayanan."
    }
  ];
  await AssistanceRequest.insertMany(assistanceRequests);
  console.log("✓ Assistance Requests seeded");

  // 8. Seed Fees & Payments
  await Fee.deleteMany({});
  const feeDocs = await Fee.insertMany([
    {
      feeCode: "FEE-301",
      seniorId: primarySenior._id,
      seniorName: primarySenior.name,
      title: "October 2026 Monthly Care & Assisted Living Package",
      category: "Monthly Care",
      totalAmount: 12000,
      paidAmount: 12000,
      remainingAmount: 0,
      dueDate: new Date(Date.now() + 86400000 * 10),
      status: "Paid",
      notes: "24/7 Assisted Living, Daily Nurse Vital Monitoring & Routine Care."
    },
    {
      feeCode: "FEE-304",
      seniorId: primarySenior._id,
      seniorName: primarySenior.name,
      title: "Dr. S. Kumar Geriatric Consultation & 12-Lead ECG",
      category: "Doctor Consultation",
      totalAmount: 1500,
      paidAmount: 1500,
      remainingAmount: 0,
      dueDate: new Date(Date.now() - 86400000 * 2),
      status: "Paid",
      notes: "Comprehensive Geriatric Review & 12-Lead ECG Screening."
    },
    {
      feeCode: "FEE-305",
      seniorId: primarySenior._id,
      seniorName: primarySenior.name,
      title: "Apollo Pharmacy Monthly Tablets Refill (BP & Sugar)",
      category: "Pharmacy & Medicine",
      totalAmount: 2450,
      paidAmount: 2450,
      remainingAmount: 0,
      dueDate: new Date(Date.now() - 86400000 * 3),
      status: "Paid",
      notes: "Amlodipine 10mg (increased dosage), Metformin 500mg, Atorvastatin 10mg (30-day supply)."
    },
    {
      feeCode: "FEE-306",
      seniorId: primarySenior._id,
      seniorName: primarySenior.name,
      title: "Diagnostics: Complete Blood Count & Fasting Lipid Profile",
      category: "Lab Diagnostics",
      totalAmount: 1800,
      paidAmount: 1800,
      remainingAmount: 0,
      dueDate: new Date(Date.now() - 86400000 * 4),
      status: "Paid",
      notes: "Home blood sample collection by certified phlebotomist."
    },
    {
      feeCode: "FEE-307",
      seniorId: primarySenior._id,
      seniorName: primarySenior.name,
      title: "Physiotherapy & Mobility Rehabilitation (5 Sessions)",
      category: "Physiotherapy",
      totalAmount: 3000,
      paidAmount: 3000,
      remainingAmount: 0,
      dueDate: new Date(Date.now() - 86400000 * 5),
      status: "Paid",
      notes: "Geriatric knee strengthening & balance training with Senior Therapist."
    },
    {
      feeCode: "FEE-302",
      seniorId: seniorDocs[1]._id,
      seniorName: seniorDocs[1].name,
      title: "Post-op Knee Rehabilitation (10 Sessions)",
      category: "Physiotherapy",
      totalAmount: 5000,
      paidAmount: 5000,
      remainingAmount: 0,
      dueDate: new Date(Date.now() - 86400000 * 2),
      status: "Paid",
      notes: "Post knee surgery rehabilitation sessions."
    }
  ]);
  console.log("✓ Fees seeded with itemized medical categories");

  await Payment.deleteMany({});
  await Payment.insertMany([
    {
      paymentCode: "RCP-1041",
      feeId: feeDocs[0]._id,
      seniorId: primarySenior._id,
      seniorName: primarySenior.name,
      amount: 12000,
      paymentMethod: "UPI",
      transactionRef: "UPI/20261001/99281726",
      paidAt: new Date(Date.now() - 86400000 * 5),
      recordedBy: createdUsers.staff._id,
      recordedByName: "SeniorCare Accounts Desk",
      notes: "Monthly Assisted Living Package paid via UPI (GPay - Ashmitha)."
    },
    {
      paymentCode: "RCP-1042",
      feeId: feeDocs[1]._id,
      seniorId: primarySenior._id,
      seniorName: primarySenior.name,
      amount: 1500,
      paymentMethod: "UPI",
      transactionRef: "UPI/20261004/77481923",
      paidAt: new Date(Date.now() - 86400000 * 2),
      recordedBy: createdUsers.staff._id,
      recordedByName: "SeniorCare Accounts Desk",
      notes: "Doctor consultation fee settled."
    },
    {
      paymentCode: "RCP-1043",
      feeId: feeDocs[2]._id,
      seniorId: primarySenior._id,
      seniorName: primarySenior.name,
      amount: 2450,
      paymentMethod: "UPI",
      transactionRef: "UPI/20261003/66381029",
      paidAt: new Date(Date.now() - 86400000 * 3),
      recordedBy: createdUsers.staff._id,
      recordedByName: "Apollo Pharmacy Desk",
      notes: "Prescription refill (Amlodipine 10mg, Metformin, Atorvastatin) paid."
    },
    {
      paymentCode: "RCP-1044",
      feeId: feeDocs[3]._id,
      seniorId: primarySenior._id,
      seniorName: primarySenior.name,
      amount: 1800,
      paymentMethod: "UPI",
      transactionRef: "UPI/20261002/55192837",
      paidAt: new Date(Date.now() - 86400000 * 4),
      recordedBy: createdUsers.staff._id,
      recordedByName: "SeniorCare Diagnostics",
      notes: "Lab tests (CBC, Lipid profile) settled."
    },
    {
      paymentCode: "RCP-1045",
      feeId: feeDocs[4]._id,
      seniorId: primarySenior._id,
      seniorName: primarySenior.name,
      amount: 3000,
      paymentMethod: "UPI",
      transactionRef: "UPI/20261001/44192830",
      paidAt: new Date(Date.now() - 86400000 * 5),
      recordedBy: createdUsers.staff._id,
      recordedByName: "SeniorCare Rehab Clinic",
      notes: "Physiotherapy rehab 5 sessions package settled."
    }
  ]);
  console.log("✓ Payments & Official Receipts seeded");

  // 9. Seed Notifications
  await Notification.deleteMany({});
  await Notification.insertMany([
    {
      recipientUserId: createdUsers.seniorUser._id,
      recipientRole: "senior_citizen",
      type: "emergency",
      title: "🚨 Emergency Alert Active",
      message: "Emergency assistance EMG-1024 has been acknowledged by Caregiver Anitha.",
      priority: "critical",
      link: "/emergencies",
      createdAt: new Date(Date.now() - 600000)
    },
    {
      recipientUserId: createdUsers.seniorUser._id,
      recipientRole: "senior_citizen",
      type: "checkin",
      title: "✓ Safety Check-in Recorded",
      message: "Your daily check-in was successfully recorded. Keep up the streak!",
      priority: "normal",
      link: "/safety",
      createdAt: new Date(Date.now() - 3600000 * 2)
    },
    {
      recipientUserId: createdUsers.seniorUser._id,
      recipientRole: "senior_citizen",
      type: "appointment",
      title: "📅 Appointment Tomorrow",
      message: "Dr. S. Kumar at Apollo Senior Health Center at 10:30 AM.",
      priority: "high",
      link: "/appointments",
      createdAt: new Date(Date.now() - 3600000 * 5)
    },
    {
      recipientUserId: createdUsers.family_member._id,
      recipientRole: "family_member",
      type: "emergency",
      title: "🚨 Emergency Notification",
      message: "Lakshmi Devi has triggered emergency alert EMG-1024. Caregiver is attending.",
      priority: "critical",
      link: "/emergencies",
      createdAt: new Date(Date.now() - 900000)
    },
    {
      recipientUserId: createdUsers.caretakerUser._id,
      recipientRole: "caretaker",
      type: "emergency",
      title: "🚨 Emergency Alert: Lakshmi Devi",
      message: "Immediate attention requested at Adyar home residence. Shortness of breath.",
      priority: "critical",
      link: "/emergencies",
      createdAt: new Date(Date.now() - 900000)
    },
    {
      recipientUserId: createdUsers.volunteer._id,
      recipientRole: "volunteer",
      type: "assistance",
      title: "🤝 Assistance Request Assigned",
      message: "You have been assigned to medicine pickup for Lakshmi Devi.",
      priority: "high",
      link: "/assistance",
      createdAt: new Date(Date.now() - 3600000 * 6)
    }
  ]);
  console.log("✓ Notifications seeded");

  // 10. Seed Notification Preferences
  await NotificationPreference.deleteMany({});
  for (const r of Object.keys(createdUsers)) {
    const user = createdUsers[r];
    if (user?._id) {
      await NotificationPreference.findOneAndUpdate(
        { userId: user._id },
        {
          userId: user._id,
          emergency: { inApp: true, email: true, sms: true, whatsapp: true },
          appointments: { inApp: true, email: true, sms: true, whatsapp: false },
          checkins: { inApp: true, email: false, sms: false, whatsapp: false },
          fees: { inApp: true, email: true, sms: false, whatsapp: false }
        },
        { upsert: true }
      );
    }
  }

  // 11. Seed Recently Accessed
  await RecentlyAccessed.deleteMany({});
  await RecentlyAccessed.insertMany([
    {
      userId: createdUsers.admin._id,
      itemType: "senior",
      itemId: primarySenior._id.toString(),
      title: primarySenior.name,
      subtitle: "Independent Home Residence · Adyar, Chennai",
      accessedAt: new Date(Date.now() - 120000)
    },
    {
      userId: createdUsers.admin._id,
      itemType: "emergency",
      itemId: "EMG-1024",
      title: "EMG-1024 · Lakshmi Devi",
      subtitle: "Critical Emergency Alert",
      accessedAt: new Date(Date.now() - 300000)
    },
    {
      userId: createdUsers.admin._id,
      itemType: "appointment",
      itemId: "APT-201",
      title: "APT-201 · Dr. S. Kumar",
      subtitle: "Cardiology · Tomorrow 10:30 AM",
      accessedAt: new Date(Date.now() - 600000)
    }
  ]);

  // 12. Seed Audit Log
  await AuditLog.deleteMany({});
  await AuditLog.insertMany([
    { action: "EMERGENCY_TRIGGERED", performedBy: createdUsers.seniorUser._id, performedByName: "Kalyani Ammal", performedByRole: "senior_citizen", targetEntity: "Emergency", targetId: "EMG-1024", details: "Emergency alert triggered from Adyar home residence", timestamp: new Date(Date.now() - 900000) },
    { action: "EMERGENCY_ACKNOWLEDGED", performedBy: createdUsers.caretakerUser._id, performedByName: "Anitha Krishnan", performedByRole: "caretaker", targetEntity: "Emergency", targetId: "EMG-1024", details: "Caregiver acknowledged and attended", timestamp: new Date(Date.now() - 600000) },
    { action: "CHECKIN_RECORDED", performedBy: createdUsers.seniorUser._id, performedByName: "Lakshmi Devi", performedByRole: "senior_citizen", targetEntity: "Checkin", targetId: "CHECK-01", details: "Daily wellness check-in completed", timestamp: new Date(Date.now() - 3600000 * 2) },
    { action: "PAYMENT_RECORDED", performedBy: createdUsers.staff._id, performedByName: "Staff Murugan", performedByRole: "staff", targetEntity: "Payment", targetId: "PAY-901", details: "Recorded ₹8,000 via UPI for FEE-301", timestamp: new Date(Date.now() - 86400000 * 3) }
  ]);
  console.log("✓ Audit Logs seeded");

  // 13. Seed Videos
  await Video.deleteMany({});
  await Video.insertMany([
    {
      title: "Gentle Morning Chair Yoga for Seniors",
      category: "Yoga",
      videoUrl: "https://www.youtube.com/watch?v=kFhG-ZzLNN4",
      embedUrl: "https://www.youtube.com/embed/kFhG-ZzLNN4",
      thumbnailUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500",
      duration: "15 mins",
      instructor: "Dr. Lakshmi Yoga Master",
      description: "Safe, seated gentle stretching movements to awaken joints and boost morning energy.",
      tags: ["Yoga", "Joints", "Morning Routine"],
      addedByRole: "admin",
      status: "active"
    },
    {
      title: "Guided Deep Breathing & Mind Relaxation",
      category: "Meditation",
      videoUrl: "https://www.youtube.com/watch?v=inpok4MKVLM",
      embedUrl: "https://www.youtube.com/embed/inpok4MKVLM",
      thumbnailUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500",
      duration: "10 mins",
      instructor: "Guruji Ramanathan",
      description: "Pranayama and mindful breathing exercises to reduce anxiety and regulate blood pressure.",
      tags: ["Meditation", "Breathing", "Peace"],
      addedByRole: "admin",
      status: "active"
    },
    {
      title: "Active Balance & Fall Prevention Exercises",
      category: "Physiotherapy",
      videoUrl: "https://www.youtube.com/watch?v=gC_L9qAHVJ8",
      embedUrl: "https://www.youtube.com/embed/gC_L9qAHVJ8",
      thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500",
      duration: "18 mins",
      instructor: "Physio Dr. Anand",
      description: "Strengthen leg core muscles and improve stability to safely prevent accidental falls.",
      tags: ["Balance", "Fall Prevention", "Mobility"],
      addedByRole: "admin",
      status: "active"
    },
    {
      title: "Laughter Therapy & Emotional Upliftment",
      category: "Recreation",
      videoUrl: "https://www.youtube.com/watch?v=4pLUleLdwY4",
      embedUrl: "https://www.youtube.com/embed/4pLUleLdwY4",
      thumbnailUrl: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=500",
      duration: "12 mins",
      instructor: "Sister Malathi",
      description: "Hearty joyful laughter sessions that stimulate blood circulation and bring cheerful smiles.",
      tags: ["Laughter", "Joy", "Heart Health"],
      addedByRole: "admin",
      status: "active"
    }
  ]);
  console.log("✓ Videos seeded");

  // 14. Seed Reviews & Ratings
  await Review.deleteMany({});
  const dineshUser = await User.findOne({ email: "temp.caregiver@seniorcare.local" });
  await Review.insertMany([
    {
      targetType: "caregiver",
      targetId: createdUsers.caretakerUser._id,
      targetName: "Anitha Krishnan",
      targetRole: "caregiver",
      seniorId: primarySenior._id,
      seniorName: primarySenior.name,
      reviewerId: createdUsers.seniorUser._id,
      reviewerName: createdUsers.seniorUser.displayName,
      reviewerRole: "senior_citizen",
      rating: 5,
      feedback: "Sister Anitha is so caring and patient. She checks my blood pressure and medication on exact time every morning.",
      tags: ["Punctual", "Compassionate", "Medical Care"],
      isComplaint: false,
      status: "active"
    },
    {
      targetType: "caregiver",
      targetId: createdUsers.caretakerUser._id,
      targetName: "Anitha Krishnan",
      targetRole: "caregiver",
      seniorId: primarySenior._id,
      seniorName: primarySenior.name,
      reviewerId: createdUsers.family_member._id,
      reviewerName: createdUsers.family_member.displayName,
      reviewerRole: "family_member",
      rating: 5,
      feedback: "We live in another area and Anitha gives us complete peace of mind with timely daily updates and medication care.",
      tags: ["Highly Reliable", "Kind & Patient", "Regular Updates"],
      isComplaint: false,
      status: "active"
    },
    {
      targetType: "volunteer",
      targetId: createdUsers.volunteer._id,
      targetName: "Karthik Raman",
      targetRole: "volunteer",
      seniorId: primarySenior._id,
      seniorName: primarySenior.name,
      reviewerId: createdUsers.seniorUser._id,
      reviewerName: createdUsers.seniorUser.displayName,
      reviewerRole: "senior_citizen",
      rating: 5,
      feedback: "Karthik bought my blood pressure medicines from Apollo pharmacy and helped set up video call with my grandson.",
      tags: ["Helpful", "Medicine Delivery", "Tech Friendly"],
      isComplaint: false,
      status: "active"
    },
    {
      targetType: "volunteer",
      targetId: createdUsers.volunteer._id,
      targetName: "Karthik Raman",
      targetRole: "volunteer",
      seniorId: seniorDocs[1]._id,
      seniorName: seniorDocs[1].name,
      reviewerId: createdUsers.family_member._id,
      reviewerName: createdUsers.family_member.displayName,
      reviewerRole: "family_member",
      rating: 4.8,
      feedback: "Very enthusiastic volunteer who assists seniors with hospital rides and banking errands cheerfully.",
      tags: ["Quick Response", "Courteous"],
      isComplaint: false,
      status: "active"
    },
    ...(dineshUser ? [{
      targetType: "caregiver",
      targetId: dineshUser._id,
      targetName: "Dinesh Kumar (Probation)",
      targetRole: "caregiver",
      seniorId: seniorDocs[1]._id,
      seniorName: seniorDocs[1].name,
      reviewerId: createdUsers.family_member._id,
      reviewerName: createdUsers.family_member.displayName,
      reviewerRole: "family_member",
      rating: 2,
      feedback: "Arrived 45 minutes late for afternoon medication distribution and did not respond to phone calls.",
      tags: ["Delayed Arrival", "Unresponsive"],
      isComplaint: true,
      status: "active"
    }] : [])
  ]);
  console.log("✓ Reviews seeded");

  // 15. Generate sample_data.xlsx in project root
  const wb = XLSX.utils.book_new();

  // Users sheet
  const usersSheetData = [
    ["Email", "Full Name", "Role", "Phone", "Address"],
    ...userSeeds.map(u => [u.email, u.displayName, u.role, u.phone, u.address])
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(usersSheetData), "Users");

  // Seniors sheet
  const seniorsSheetData = [
    ["Name", "Age", "Gender", "Phone", "Room", "Blood Group", "Medical Notes", "Emergency Contact", "Emergency Phone"],
    ...seniorDocs.map(s => [s.name, s.age, s.gender, s.phone, s.roomNumber, s.bloodGroup, s.medicalNotes, s.emergencyContactName, s.emergencyContactPhone])
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(seniorsSheetData), "Seniors");

  // Family Members sheet
  const familyMembers = await FamilyMember.find().lean();
  const familySheetData = [
    ["Name", "Phone", "Email", "Relation", "Linked Senior"],
    ...familyMembers.map(f => {
      const matchedSenior = seniorDocs.find(s => f.linkedSeniorIds && f.linkedSeniorIds.some(sid => sid.toString() === s._id.toString()));
      return [f.name, f.phone, f.email, f.relation, matchedSenior ? matchedSenior.name : "Unlinked"];
    })
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(familySheetData), "Family Members");

  // Caregivers sheet
  const caregiverSheetData = [
    ["Name", "Phone", "Email", "Specialization", "Shift", "Rating"],
    ["Anitha Krishnan", "+91 98765 00004", "caretaker.test@seniorcare.local", "Geriatric Care", "Morning", 4.9]
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(caregiverSheetData), "Caregivers");

  // Volunteers sheet
  const volunteerSheetData = [
    ["Name", "Phone", "Email", "Skills", "Availability", "Tasks Completed"],
    ["Karthik Raman", "+91 98765 00005", "volunteer.test@seniorcare.local", "Medicine, Grocery, Tech", "Weekdays 8am - 6pm", 42]
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(volunteerSheetData), "Volunteers");

  // Check-ins sheet
  const checkinsSheetData = [
    ["Senior Name", "Status", "Mood", "Notes", "Timestamp"],
    ...checkins.map(c => [c.seniorName, c.status, c.mood, c.notes, c.timestamp.toISOString()])
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(checkinsSheetData), "Check-ins");

  // Emergencies sheet
  const emergenciesSheetData = [
    ["Emergency Code", "Senior Name", "Status", "Severity", "Location", "Notes"],
    ...emergencies.map(e => [e.emergencyCode, e.seniorName, e.status, e.severity, e.location, e.notes])
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(emergenciesSheetData), "Emergencies");

  // Appointments sheet
  const appointmentsSheetData = [
    ["Appointment Code", "Senior Name", "Doctor", "Department", "Hospital", "Date/Time", "Status"],
    ...appointments.map(a => [a.appointmentCode, a.seniorName, a.doctorName, a.department, a.hospital, `${a.appointmentDate.toISOString().split("T")[0]} ${a.timeSlot}`, a.status])
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(appointmentsSheetData), "Appointments");

  // Assistance Requests sheet
  const assistanceSheetData = [
    ["Senior Name", "Category", "Title", "Priority", "Status", "Assigned To"],
    ...assistanceRequests.map(r => [r.seniorName, r.category, r.title, r.priority, r.status, r.assignedToName || "Unassigned"])
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(assistanceSheetData), "Assistance Requests");

  // Fees sheet
  const feesSheetData = [
    ["Fee Code", "Senior Name", "Title", "Category", "Total", "Paid", "Remaining", "Status"],
    ...feeDocs.map(f => [f.feeCode, f.seniorName, f.title, f.category, f.totalAmount, f.paidAmount, f.remainingAmount, f.status])
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(feesSheetData), "Fees");

  // Payments sheet
  const paymentsSheetData = [
    ["Payment Code", "Senior Name", "Amount", "Method", "Transaction Ref", "Recorded By"],
    ["PAY-901", "Lakshmi Devi", 8000, "UPI", "UPI/20261001/99281726", "Staff Murugan"],
    ["PAY-902", "Ramasamy Sundaram", 5000, "Credit/Debit Card", "TXN-8827361", "Admin Rajesh"],
    ["PAY-903", "Lakshmi Devi", 4500, "Net Banking", "NEFT-HDFC-9921", "Staff Murugan"]
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(paymentsSheetData), "Payments");

  const excelPath = path.resolve(__dirname, "../../sample_data.xlsx");
  XLSX.writeFile(wb, excelPath);
  console.log(`✓ Generated realistic Excel sample file: ${excelPath}`);

  await mongoose.disconnect();
  console.log("\n=======================================================");
  console.log("SEEDED ALL DATA SUCCESSFULLY INTO MONGODB COMPASS!");
  console.log("Database: senior_care");
  console.log("Collections: users, seniors, caregivers, familymembers,");
  console.log("             volunteers, checkins, emergencies, appointments,");
  console.log("             assistancerequests, fees, payments, notifications,");
  console.log("             notificationpreferences, recentlyaccesseds, auditlogs");
  console.log("Password for all test accounts: SeniorCare@2026!");
  console.log("=======================================================\n");
}

seed().catch(err => {
  console.error("Seed error:", err);
  process.exit(1);
});
