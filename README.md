# Interview Intel / Resume Analyzer

## Project Overview

This project is a full-stack AI interview preparation platform with a Node.js backend and a React frontend. It allows users to register, sign in, upload a resume, provide a self-description and target job description, and generate an AI-powered interview report. The backend stores user and interview report data in MongoDB and uses Google GenAI to generate interview guidance and an optimized resume PDF.

---

## Repository Structure

```
AI Project/
  Backend/
    .env
    package.json
    server.js
    src/
      app.js
      config/
        database.js
      Controllers/
        auth.controller.js
        interview.controller.js
      middleware/
        auth.middleware.js
        file.middleware.js
      models/
        blackList.model.js
        interviewReport.model.js
        user.model.js
      Routes/
        auth.routes.js
        interview.routes.js
      services/
        ai.service.js
        twilio.service.js
        temp.js
  Frontend/
    package.json
    vite.config.js
    index.html
    src/
      App.jsx
      app.routes.jsx
      main.jsx
      style.scss
      features/
        auth/
          Auth.context.jsx
          Hooks/useAuth.jsx
          Services/Auth.api.jsx
          components/Loading.jsx
          components/Protected.jsx
          pages/Login.jsx
          pages/Register.jsx
        interview/
          interview.context.jsx
          Hooks/useInterview.jsx
          services/interview.api.jsx
          pages/Home.jsx
          pages/Interview.jsx
          components/PageNotFound.jsx
          components/ReportNotFound.jsx
          style/error.scss
          style/home.scss
          style/interview.scss
```

---

## Backend Details

### Backend entry point

- `Backend/server.js`
  - Loads environment variables.
  - Connects to MongoDB using `src/config/database.js`.
  - Starts the Express server on the port from `process.env.PORT` or `4000`.

### Backend app setup

- `Backend/src/app.js`
  - Initializes Express.
  - Enables CORS for the configured `FRONTEND_URL`.
  - Enables JSON body parsing and cookie parsing.
  - Registers two route groups: `/api/auth` and `/api/interview`.

### Database connection

- `Backend/src/config/database.js`
  - Uses Mongoose to connect to MongoDB via `process.env.MONGO_URI`.
  - Logs success or errors.

### Auth routes and controllers

- `Backend/src/Routes/auth.routes.js`
  - `POST /api/auth/register` → register user.
  - `POST /api/auth/login` → login user.
  - `POST /api/auth/forgot-password` → send a recovery code to the registered phone.
  - `POST /api/auth/verify-password-reset-code` → verify the SMS code.
  - `POST /api/auth/reset-password` → set a new password with a verified reset token.
  - `GET /api/auth/logout` → logout user.
  - `GET /api/auth/get-me` → retrieve current authenticated user.

- `Backend/src/Controllers/auth.controller.js`
  - `registerUserController`:
    - Validates fields.
    - Checks duplicate email/username.
    - Hashes password with bcrypt.
    - Creates user in MongoDB.
    - Signs JWT, stores it in an HTTP-only cookie.
  - `loginUserController`:
    - Validates credentials.
    - Signs JWT and returns user metadata.
  - Password recovery controllers:
    - Request and verify SMS codes through Twilio Verify.
    - Issue a hashed, single-use reset token that expires after 10 minutes.
    - Reject passwords that match the current password.
  - `logoutUserController`:
    - Reads token from cookies.
    - Stores token in blacklist to invalidate it.
    - Clears the cookie.
  - `getMeController`:
    - Reads user ID from validated token.
    - Returns the current authenticated user's details.

### Interview routes and controllers

- `Backend/src/Routes/interview.routes.js`
  - `POST /api/interview/` → generate a new interview report and save it.
  - `GET /api/interview/report/:interviewId` → read a single report by ID.
  - `GET /api/interview/` → list all reports for the signed-in user.
  - `POST /api/interview/resume/pdf/:interviewReportId` → generate/download a PDF resume for a report.

- `Backend/src/Controllers/interview.controller.js`
  - `generateInterviewReportController`:
    - Accepts resume upload via multer middleware.
    - Extracts text from PDF using `pdf-parse`.
    - Sends resume, self-description, and job description to the AI service.
    - Saves the AI-generated report in MongoDB.
  - `getInterviewReportByIdController`:
    - Fetches a report only if it belongs to the current user.
  - `getAllInterviewReportsController`:
    - Returns all reports belonging to current user.
    - Omits some large or private fields from the response.
  - `generateResumePdfController`:
    - Loads the stored report.
    - Uses the AI service to generate an HTML resume.
    - Converts HTML into PDF with Puppeteer.
    - Sends the PDF back as a downloadable response.

### Backend middleware

- `Backend/src/middleware/auth.middleware.js`
  - Reads the JWT from `req.cookies.token`.
  - Checks blacklist collection to invalidate logged-out tokens.
  - Verifies JWT and attaches decoded user payload to `req.user`.

- `Backend/src/middleware/file.middleware.js`
  - Configures multer to store uploads in memory.
  - Restricts file uploads to 3 MB.

### Backend models

- `Backend/src/models/user.model.js`
  - Stores `username`, `email`, Indian mobile `contact`, and hashed `password`.
  - Stores only the hash and expiry of an active password-reset token.
  - Requires both username and email to be unique.

- `Backend/src/services/twilio.service.js`
  - Sends SMS verification codes and validates them using Twilio Verify.

- `Backend/src/models/interviewReport.model.js`
  - Stores the interview report content generated by the AI service.
  - Includes `jobDescription`, `resume`, `selfDescription`, `matchScore`, `technicalQuestions`, `behavioralQuestions`, `skillGaps`, `preparationPlan`, `user`, and `title`.
  - Uses embedded sub-schemas for structured arrays.

- `Backend/src/models/blackList.model.js`
  - Stores JWT tokens that have been invalidated on logout.

### Backend AI integration

- `Backend/src/services/ai.service.js`
  - Uses `@google/genai` with `process.env.GOOGLE_GENAI_API_KEY`.
  - `generateInterviewReport()`:
    - Builds a prompt from resume text, self description, and job description.
    - Uses a Zod schema to request a structured JSON response.
    - Returns a parsed interview report object.
  - `generateResumePdf()`:
    - Prompts the AI to generate a complete ATS-friendly resume HTML document.
    - Uses Puppeteer and Chromium to render that HTML as a PDF buffer.

---

## Frontend Details

### Frontend entry point

- `Frontend/src/main.jsx`
  - Renders the root React app.
  - Wraps the app with browser router and application providers.

- `Frontend/src/App.jsx`
  - Wraps all pages with `AuthProvider` and `InterviewProvider`.
  - Provides authentication and report-related global state.

### Routing

- `Frontend/src/app.routes.jsx`
  - `/register` → `Register` page.
  - `/login` → `Login` page.
  - `/forgot-password` → request an SMS code, verify it, and reset a password.
  - `/` → `Home` page (protected).
  - `/interview/:interviewId` → `Interview` detail page (protected).
  - `*` → `PageNotFound` fallback.

### Authentication flow

- `Frontend/src/features/auth/Auth.context.jsx`
  - Creates `AuthContext` for authenticated user state.
  - Fetches current user with `getMe()` on app start.

- `Frontend/src/features/auth/Hooks/useAuth.jsx`
  - Exposes `handleLogin`, `handleRegister`, `handleLogout`.
  - Reads and updates user state.
  - Uses `axios` with `withCredentials: true` so cookies are sent to the backend.

- `Frontend/src/features/auth/Services/Auth.api.jsx`
  - Implements API calls for authentication:
    - `/api/auth/register`
    - `/api/auth/login`
    - `/api/auth/forgot-password`
    - `/api/auth/verify-password-reset-code`
    - `/api/auth/reset-password`
    - `/api/auth/logout`
    - `/api/auth/get-me`

- `Frontend/src/features/auth/components/Protected.jsx`
  - Guards protected routes by redirecting unauthenticated users to `/login`.
  - Shows a loading screen while auth state loads.

### Authentication UI pages

- `Frontend/src/features/auth/pages/Register.jsx`
  - Renders username, email, and password registration form.
  - Calls `handleRegister()` and redirects to `/` on success.

- `Frontend/src/features/auth/pages/Login.jsx`
  - Renders email + password login form.
  - Calls `handleLogin()` and redirects to `/` on success.

- `Frontend/src/features/auth/pages/ForgotPassword.jsx`
  - Requests a code for the account email and verifies the SMS code.
  - Shows new-password fields only after the code is verified.
  - Confirms the password before submitting the one-time reset token.

- `Frontend/src/features/auth/components/Loading.jsx`
  - Displays a simple loading indicator used across auth and interview pages.

### Interview feature flow

- `Frontend/src/features/interview/interview.context.jsx`
  - Exposes state for report generation, selected report, and report list.

- `Frontend/src/features/interview/Hooks/useInterview.jsx`
  - Defines hooks to call report-related API endpoints.
  - `generateReport()` uploads resume and details to the backend.
  - `getReportById()` loads a single report.
  - `getReports()` fetches the current user’s saved reports.
  - `getResumePdf()` downloads a generated resume PDF.

- `Frontend/src/features/interview/services/interview.api.jsx`
  - Implements interview-related API calls:
    - `POST /api/interview/` to generate a report.
    - `GET /api/interview/report/:interviewId` to fetch one report.
    - `GET /api/interview/` to fetch all reports.
    - `POST /api/interview/resume/pdf/:interviewReportId` to generate/download a PDF.

### Interview pages

- `Frontend/src/features/interview/pages/Home.jsx`
  - Landing page for authenticated users.
  - Lets users paste a job description and upload a resume.
  - Lets users include a self description.
  - Submits a report generation request to the backend.
  - Displays a list of recent interview reports.

- `Frontend/src/features/interview/pages/Interview.jsx`
  - Shows detailed report content for a selected report.
  - Allows switching between technical questions, behavioral questions, and a preparation roadmap.
  - Shows match score and skill gaps.
  - Provides a button to download the AI-generated resume PDF.

- `Frontend/src/features/interview/components/ReportNotFound.jsx`
  - Shown when no report exists for the requested ID.

- `Frontend/src/features/interview/components/PageNotFound.jsx`
  - Shown for unmatched routes.

---

## Data / Request Flow

### Authentication flow

1. The user registers or logs in from the frontend.
2. The frontend calls the backend auth endpoints.
3. On success, backend sets a JWT cookie and returns user data.
4. The frontend stores the authenticated user in context.
5. Protected pages require the cookie-based JWT and use `getMe()` to confirm identity.

### Forgot password flow

1. The user enters their account email on `/forgot-password`.
2. `POST /api/auth/forgot-password` sends a Twilio Verify SMS to the contact number saved for that account. The response does not reveal whether the email is registered.
3. The user enters the SMS code. `POST /api/auth/verify-password-reset-code` validates it with Twilio.
4. After successful verification, the backend returns a random reset token. Only its SHA-256 hash is stored, and it expires after 10 minutes.
5. The frontend then displays the new-password and confirmation fields. `POST /api/auth/reset-password` accepts the reset token and new password; the token is single-use and a new OTP request invalidates any previous reset token.

Passwords must be at least 6 characters and cannot match the current password. Registration accepts a 10-digit Indian mobile number, optionally entered with the `91` or `+91` country prefix; the backend stores it in Twilio-compatible `+91` format.

### Interview generation flow

1. The authenticated user fills in a job description, optional self description, and uploads a resume PDF.
2. `Home.jsx` calls `useInterview().generateReport()`.
3. The frontend sends a multipart form request to `POST /api/interview/`.
4. `auth.middleware.js` validates the JWT cookie.
5. `file.middleware.js` parses the uploaded resume into memory.
6. `interview.controller.generateInterviewReportController()` converts PDF to text and calls `generateInterviewReport()`.
7. `ai.service.js` sends a prompt to Google GenAI with a Zod schema and returns structured JSON.
8. The backend saves the report in `InterviewReport`.
9. The frontend navigates to `/interview/:interviewId` and displays the report details.

### Report retrieval flow

1. The interview detail page loads and calls `getReportById()`.
2. The backend validates the user and returns the stored report.
3. The page renders questions, answers, roadmap, match score, and skill gaps.

### Resume PDF download flow

1. The user clicks the resume download button on `/interview/:interviewId`.
2. The frontend calls `POST /api/interview/resume/pdf/:interviewReportId`.
3. The backend retrieves the report and asks AI to generate resume HTML.
4. The backend renders HTML to PDF with Puppeteer.
5. The browser downloads the PDF file.

---

## Environment Variables

The backend expects the following variables in `Backend/.env`:

- `MONGO_URI` — MongoDB connection string.
- `SECRET_KEY` — JWT signing secret.
- `FRONTEND_URL` — allowed frontend origin for CORS.
- `GOOGLE_GENAI_API_KEY` — API key for Google GenAI.
- `TWILIO_ACCOUNT_SID` — Twilio account SID (`AC...`).
- `TWILIO_AUTH_TOKEN` — Twilio account auth token. Keep this secret and never commit it.
- `TWILIO_VERIFY_SERVICE_SID` — SID of a Verify Service (`VA...`). Create one in Twilio Console under **Verify → Services**.
- `PORT` — optional server port (defaults to 4000).

Password recovery requires all three Twilio variables. Create a Verify Service in the same Twilio account as the account SID and auth token, then add its SID and credentials to `Backend/.env`. Twilio Verify manages code generation, delivery, and expiration; the application does not store OTP codes.

The frontend expects the following in `Frontend/.env` or Vite environment config:

- `VITE_API_URL` — base URL for the backend API, such as `http://localhost:4000`.

---

## How to Run

### Backend

1. Open `Backend/`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` with the required keys.
4. Start the backend:
   ```bash
   npm run dev
   ```

### Frontend

1. Open `Frontend/`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` with `VITE_API_URL`.
4. Start the frontend:
   ```bash
   npm run dev
   ```

---

## Notes

- The backend stores the auth token in an HTTP-only cookie and protects private API routes with `auth.middleware.js`.
- Uploaded resumes are parsed from PDF to plain text before being sent to the AI.
- The AI service uses a strict response schema to ensure the backend receives valid JSON.
- The frontend uses React Router v7 and context providers to manage auth and interview data.
- The app currently assumes a resume upload is a PDF file; additional file support may require further parsing.
