### Project Setup Instructions

#### Prerequisites
Before you begin, ensure you have the following installed on your machine:
- **Node.js** (v14 or higher) Recommended to use this "node v20.19.1 (64-bit)" to avoid much Debugging
- **MySQL** (v8 or higher)

#### Step 1: Clone the Repository
Clone the project repository to your local machine:
```bash
git clone https://github.com/2402-XU-CSCC22A/groupI
cd CEDO-Admin-Manager-Student
```

   #### Step 2: Install Dependencies

   ##### Frontend Setup
   1. Navigate to the frontend directory:
      ```bash
      cd frontend
      ```

   2. Install the frontend dependencies:
      ```bash
      npm install
      ```

      **Frontend Dependencies** (from `frontend/package.json`):
      - `@google-recaptcha/react`: For Google reCAPTCHA integration.
      - `@radix-ui/react-*`: Various UI components from Radix UI.
      - `axios`: For making HTTP requests.
      - `lucide-react`: For using icons.
      - `next`: The Next.js framework.
      - `react` and `react-dom`: React library and DOM bindings.
      - `react-hook-form`: For handling forms.
      - `tailwindcss`: For styling.
      - `react-router-dom`: For routing (if needed).

   ##### Backend Setup
   1. Navigate to the backend directory:
      ```bash
      cd ../backend
      ```

   2. Install the backend dependencies:
      ```bash
      npm install
      ```

      **Backend Dependencies** (from `backend/package.json`):
      - `axios`: For making HTTP requests.
      - `bcryptjs`: For hashing passwords.
      - `cors`: For enabling CORS.
      - `dotenv`: For loading environment variables.
      - `express`: The Express.js framework.
      - `express-validator`: For validating request data.
      - `google-auth-library`: For Google authentication.
      - `jsonwebtoken`: For handling JWTs.
      - `mongoose`: For MongoDB object modeling (if using MongoDB).
   - `mysql2`: For MySQL database connection.
   - `nodemailer`: For sending emails.

#### Step 3: Set Up Environment Variables
1. **Backend**:
   - Copy the example environment file:
     ```bash
     cp backend/.env.example backend/.env
     ```
   - Fill in your MySQL credentials and other environment variables in `backend/.env`.

   **Required Environment Variables**:
   - `MYSQL_HOST`: MySQL host (default: localhost)
   - `MYSQL_USER`: MySQL username
   - `MYSQL_PASSWORD`: MySQL password
   - `MYSQL_DATABASE`: MySQL database name
   - `JWT_SECRET`: Secret for JWT signing
   - `GOOGLE_CLIENT_ID`: Google OAuth client ID
   - `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
   - `RECAPTCHA_SECRET_KEY`: Google reCAPTCHA secret key

2. **Frontend**:
   - You may also need to set up environment variables for the frontend if you are using any API keys or secrets.

#### Step 4: Initialize the Database
Run the following command to initialize the database:
```bash
npm run init-db
```

#### Step 5: Start the Development Server
1. **Start the Backend**:
   ```bash
   cd backend
   ```

2. **Start the Frontend**:
   Open a new terminal window, navigate to the frontend directory, and run:
   ```bash
   cd frontend
   npm run dev
   ```

### Accessing the Application
- The frontend will typically be available at `http://localhost:3000`.
- The backend API will typically be available at `http://localhost:4000/api`.

Troubleshoot 


if  message you're encountering indicates that the port 5000 is already in use by another process on your machine 

follow these instructions precisely well 

Open the Command Prompt using command from Keyboard  CTRL + R + ENTER 
then Type 'cmd' and then Enter

CMD Will Appear Precisely!

then Paste this '   netstat -ano | findstr :5000' to Command Prompt and then hit Enter

were these process of troubleshoot may kill the port if still reported as in use, you may need to identify which process is using it and terminate that process.

if you see the PID you must use this Template precisely "   taskkill /PID <PID> /F"

then Hit Enter






### Conclusion
By following these steps, you should be able to set up the CEDO Partnership Management System on your local machine. Ensure that all dependencies are installed correctly and that your environment variables are set up to match your database configuration. If you encounter any issues, check the console for error messages and ensure that your services are running as expected.
