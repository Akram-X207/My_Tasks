# 📝 My Tasks - A Modern Full-Stack Todo Application

A sleek, modern, and fully responsive Todo application built with an emphasis on clean UI/UX, robust backend architecture, and secure user data isolation.

![Application Preview](https://via.placeholder.com/800x400?text=My+Tasks+Preview) *(Replace with actual screenshot later)*

## ✨ Key Features

- **Secure Authentication:** Complete Email & Password authentication flow powered by Supabase Auth.
- **Unique Usernames:** Users create personalized `@usernames` during sign-up.
- **Profile Management:** A dedicated settings panel allowing users to update their username (with live uniqueness validation) and change their password.
- **Cloud Task Persistence:** Tasks are securely stored in a PostgreSQL database in real-time, meaning your list is always exactly as you left it, across any device.
- **User Data Isolation:** Implemented strict Row Level Security (RLS) policies at the database level to guarantee that users can *only* access their own task data.
- **Dark Mode UI:** A gorgeous, eye-friendly dark theme with vibrant yellow accents, smooth micro-interactions, and a fully responsive design for mobile and desktop.

---

## 🛠️ Tech Stack

This project was built to demonstrate proficiency across the entire web stack, deliberately avoiding heavy frontend frameworks to showcase a deep understanding of core web technologies.

**Frontend:**
- **HTML5 & CSS3:** Vanilla CSS with custom properties (variables) for consistent theming and flexbox/grid for responsive layouts.
- **Vanilla JavaScript (ES6+):** Complete state management, DOM manipulation, and asynchronous API communication built entirely from scratch.

**Backend:**
- **Node.js & Express.js:** A streamlined, serverless-ready REST API that handles secure communication between the client and the database.
- **JSON Web Tokens (JWT):** Custom Express middleware to intercept, decode, and validate Supabase JWTs attached to requests, ensuring every API call is strictly authenticated.

**Database & Auth:**
- **Supabase (PostgreSQL):** Used for robust user authentication and relational data storage.
- **Row Level Security (RLS):** Enforced at the SQL level to prevent data leakage between accounts.

---

## 🎯 Architectural Highlights (For Reviewers & Interviewers)

- **Separation of Concerns:** The project is cleanly separated into a static `public/` directory for the presentation layer, and an `api/` directory containing the modular Express backend.
- **Serverless Ready:** The backend is configured to run effortlessly as stateless AWS Lambda functions via Vercel, allowing for infinite scaling and zero cold-boot delays on static asset delivery.
- **Security First:** The frontend uses a public `anon` key, while sensitive database operations on the backend use a tightly scoped Service Role Key. Passwords and sensitive data are actively excluded from the repository.

---

## 🚀 Live Demo

**[Click here to view the live application on Vercel](#)** *(Add your Vercel link here once deployed!)*

---

## 💻 Local Development (Quick Start)

If you'd like to run this project locally:

1. Clone the repository.
2. Ensure you have Node.js installed.
3. Add your Supabase credentials to `public/js/config.js` (`URL` and `Anon Key`) and the root `.env` file (`URL`, `Service Role Key`, and `PORT`).
4. Install dependencies and start the server:

```bash
npm install
npm start
```

5. The app will be running at `http://localhost:3001`.
