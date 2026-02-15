# Extra-To-Essential

## Introduction

Extra-To-Essential is a real-time resource redistribution platform designed to connect people who have surplus essentials with verified NGOs that need them. The system focuses on reducing waste and improving access to food, clothing, and other necessities through a coordinated digital network.

The platform enables donors, NGOs, volunteers, and administrators to work together efficiently. By using geolocation, live updates, and role-based workflows, Extra-To-Essential ensures that resources move quickly from availability to delivery.

---

## Core Idea

The main idea behind the platform is simple:

Surplus resources should not be wasted when they can help someone in need.

Extra-To-Essential solves the logistical gap between donors and NGOs by providing a system where donations can be listed, accepted, tracked, and delivered in real time.

---

## Platform Roles

The system operates through four primary roles.

### Donor
The donor provides surplus items such as food or clothing.  
Responsibilities:
- Create donation listings  
- Provide location details  
- Monitor donation status  
- Track delivery progress  

---

### NGO
NGOs act as receivers and coordinators of donations.  
Responsibilities:
- View nearby donations  
- Accept listings  
- Assign volunteers  
- Confirm successful delivery  

---

### Volunteer
Volunteers handle the physical movement of donations.  
Responsibilities:
- Receive assigned pickups  
- Navigate to donor location  
- Deliver items to NGO  
- Update delivery status  

---

### Admin
Administrators maintain system integrity.  
Responsibilities:
- Verify NGOs  
- Monitor activity  
- Resolve issues  
- Manage platform data  

---

## System Workflow

1. Donor creates a listing.
2. Nearby NGOs receive notification.
3. NGO accepts listing.
4. Volunteer is assigned.
5. Volunteer picks up donation.
6. Delivery is completed.
7. Status updates in real time.

---

## Features

- Real-time donation tracking  
- Geolocation-based matching  
- Verified NGO system  
- Live notifications  
- Role-based dashboards  
- Impact monitoring metrics  
- Secure authentication  
- Scalable architecture  

---

## Frontend Dependencies

Install inside `e-to-e_frontend`:

```

react
react-router-dom
gsap
framer-motion
leaflet
react-leaflet
@supabase/supabase-js
lucide-react
lenis

```

Install command:

```

npm install react react-router-dom gsap framer-motion leaflet react-leaflet @supabase/supabase-js lucide-react lenis

```

---

## Backend Dependencies

Install inside `E-to-E_backend`:

```

express
socket.io
firebase-admin
nodemailer
dotenv
cors
nodemon

```

Install command:

```

npm install express socket.io firebase-admin nodemailer dotenv cors nodemon

```

---

## Installation Guide

Clone repository:

```

git clone https://github.com/Yash-Javnjal/Extra-To-Essential.git
cd Extra-To-Essential

```

Start backend:

```

cd E-to-E_backend
npm install nodemon express socket.io firebase-admin nodemailer dotenv cors
npm start

```

Start frontend:

```

cd ../e-to-e_frontend
npm install react react-router-dom gsap framer-motion leaflet react-leaflet @supabase/supabase-js lucide-react lenis
npm run dev

```

---

## Technology Stack

Frontend:
- React
- GSAP
- Framer Motion
- Leaflet
- Supabase
- Lenis

Backend:
- Node.js
- Express
- Socket.IO
- Firebase Admin
- Nodemailer


---

## Developers
- Yash Javanjal  
- Tanishq Shivsharan  
- Vinayak Sonawane  
- Venkatesh Soma  
- Vinay Maheshwaram  

---

## Summary

Extra-To-Essential is a logistics-driven platform built to eliminate the disconnect between surplus and need. It combines real-time systems, role-based workflows, and geolocation intelligence to ensure that essential resources reach the right place at the right time.
