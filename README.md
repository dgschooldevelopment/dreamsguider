# 🎓 DreamsGuider - Production Education Course Platform

> **DreamsGuider** हे एक संपूर्ण, मॉडर्न आणि प्रोडक्शन-ग्रेड एज्युकेशन कोर्स प्लॅटफॉर्म आहे. यामध्ये **Admin Panel** आणि **Student / User Panel** अशा दोन प्रमुख प्रणाली आहेत ज्या रियल-टाइम नोटिफिकेशन (Socket.IO) द्वारे जोडलेल्या आहेत.

---

## 🌟 Key Highlights & Features (वैशिष्ट्ये)

### 👑 1. Admin Panel (प्रशासक पॅनेल)
- **Course & Syllabus Management**:
  - नवीन कोर्सेस तयार करणे, एडिट करणे आणि थंबनेल (Image / URL) अपलोड करणे.
  - **Syllabus Hierarchy**: प्रत्येक कोर्समध्ये Modules / Chapters आणि त्याखाली Topics / Lessons तयार करणे.
  - **Video Lecture Uploading**: प्रत्येक टॉपिकसाठी थेट व्हिडिओ फाइल (MP4, WebM, MOV) अपलोड करणे किंवा URL/YouTube लिंक देणे.
  - नोट्स, कोड स्निपेट्स आणि लेसर ड्युरेशन सेट करणे.
- **User Management & Course Allocation (कोर्स वाटप)**:
  - सर्व नोंदणीकृत विद्यार्थी पाहणे.
  - विद्यार्थ्यांना विशिष्ट कोर्सेस **Allocate / Assign** करणे.
  - आवश्यकता असल्यास ऍक्सेस रिव्होक (Revoke) करणे.
- **Assignment Management & Grading (असाइनमेंट तपासणी)**:
  - प्रत्येक चॅप्टरसाठी गृहपाठ/टास्क तयार करणे (Points, Due Date, Instructions).
  - विद्यार्थ्यांचे सबमिशन्स तपासणे, गुण देणे (Score) आणि रिमार्क/फीडबॅक देणे.
- **Instant Real-Time Notifications**:
  - जसा ॲडमिन नवीन व्हिडिओ लेक्चर अपलोड करतो, तसा तो कोर्स मिळालेल्या **सर्व विद्यार्थ्यांना तत्काळ इन-ॲप आणि रियल-टाइम नोटिफिकेशन जाते!**

---

### 🎓 2. Student / User Panel (विद्यार्थी पॅनेल)
- **Dashboard & Allocated Courses**:
  - ॲडमिनने वाटप (Allocate) केलेलेच कोर्सेस विद्यार्थ्यांना दिसतात.
  - रिअल-टाइम प्रोग्रेस बार आणि पर्सेंटेज (उदा. 45% पूर्ण, 4/9 लेक्चर्स पाहिले).
- **Interactive Course Player (व्हिडिओ प्लेयर)**:
  - आधुनिक HTML5 व्हिडिओ प्लेयर आणि YouTube एम्बेड सपोर्ट.
  - प्लेबॅक स्पीड कंट्रोल्स (0.75x, 1x, 1.25x, 1.5x, 2x).
  - **Mark as Completed** बटण आणि "Next Lesson" नेव्हिगेशन.
  - उजव्या बाजूला सिलॅबस अकॉर्डियन ट्री (हिरवे चेकमार्क्स).
  - लेक्चर नोट्स आणि कोड स्निपेट्स टॅब.
- **Assignment Solver (असाइनमेंट सोडवणे)**:
  - प्रत्येक चॅप्टरची असाइनमेंट पाहणे.
  - उत्तर, GitHub रिपॉझिटरी लिंक किंवा प्रोजेक्ट फाइल (ZIP, PDF, इमेज) सबमिट करणे.
  - ॲडमिनने दिलेले गुण आणि फीडबॅक पाहणे.
- **Live Notification Bell & Popups**:
  - ॲडमिनने नवीन व्हिडिओ टाकला की त्वरित पॉपअप टोस्ट आणि बेल आयकॉनवर अनरीड बॅज दिसतो.

---

## 🛠️ Tech Stack Architecture

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Lucide Icons, React Router v7, Axios, Socket.IO Client |
| **Backend** | Node.js, Express, TypeScript, Prisma ORM, SQLite (`dev.db`), Multer, bcryptjs, jsonwebtoken, Socket.IO |
| **Realtime** | WebSocket via Socket.IO |
| **Media** | Multer file uploads for `/uploads/videos`, `/uploads/thumbnails`, `/uploads/assignments` |

---

## 🚀 Quick Start Guide (कसे चालवायचे)

### पर्याय १: एका क्लिकमध्ये चालवा (PowerShell)
```powershell
./start.ps1
```

### पर्याय २: स्वतंत्रपणे चालवणे

#### १. Backend सुरू करा:
```powershell
cd backend
npm run dev
```
> सर्व्हर `http://127.0.0.1:5050` वर सुरू होईल.

#### २. Frontend सुरू करा:
```powershell
cd frontend
npm run dev
```
> ॲप `http://localhost:5173` वर उघडेल.

---

## 🔑 Demo Accounts (लॉगिन करण्यासाठी तयार खाती)

लॉगिन स्क्रीनवर **"One-Click Demo Accounts"** बटणे दिलेली आहेत, ज्यावर क्लिक करून तुम्ही थेट लॉगिन करू शकता:

| Role | Email | Password | वैशिष्ट्य |
|---|---|---|---|
| 👑 **Admin** | `admin@dreamsguider.com` | `admin123` | कोर्सेस तयार करणे, व्हिडिओ अपलोड करणे, कोर्सेस वाटप करणे, असाइनमेंट तपासणे |
| 🎓 **Student 1** | `rahul@gmail.com` | `student123` | Full Stack Course मधील 2 लेक्चर्स पूर्ण, असाइनमेंट सोडवली |
| 🎓 **Student 2** | `priya@gmail.com` | `student123` | Python Bootcamp आणि Web Dev कोर्सेस ॲलोकेट केलेले |

---

## 📁 Project Structure

```
DreamsGuider/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Database Schema
│   │   └── seed.ts            # Realistic Sample Data Seed Script
│   ├── src/
│   │   ├── config/            # Prisma, JWT Config
│   │   ├── controllers/       # Auth, Course, Topic, Enrollment, Assignment, Notification, Stats
│   │   ├── middleware/        # Auth, Role Guard, Multer Uploads
│   │   ├── routes/            # REST API Endpoints
│   │   ├── services/          # Socket.io notification engine
│   │   └── server.ts          # Express App Entrypoint
│   └── uploads/               # Videos, Thumbnails, Student File Submissions
├── frontend/
│   ├── src/
│   │   ├── components/        # Navbar, Sidebar, NotificationDropdown, ToastNotification
│   │   ├── context/           # AuthContext, NotificationContext
│   │   ├── pages/
│   │   │   ├── admin/         # AdminDashboard, AdminCourses, AdminCurriculum, AdminUsers, AdminAssignments
│   │   │   ├── auth/          # Login, Register
│   │   │   └── student/       # StudentDashboard, MyCourses, CoursePlayer, StudentAssignments
│   │   ├── services/          # Typed API Client Services
│   │   └── App.tsx            # Protected Role-based Routing
│   └── tailwind.config.js
└── package.json
```
