# Installation & Setup
Follow these steps to get your local environment ready:
Clone the Repository Open your terminal and run:
`git clone <your-repo-url>`
`cd bildy-app-api`

Install Dependencies Install all required specialized packages (Express, Mongoose, JWT, Zod, etc.):
`npm install`

Configure Environment Variables Create your local environment file by copying the template:
`cp .env.example .env`
CRITICAL: Open the new .env file and fill in your DBURI (MongoDB Atlas connection string) and a secure JWT_SECRET.

## Execution Guide
# Phase 1: Identity & Security
Register & Validate:
- Run Register User

- Check Terminal: Copy the 6-digit code and paste it into Validate Email.

## Global Auth:
Run Login User to get an accessToken.
CRITICAL: Paste this token into the Collection-level Authorization tab in Postman. All subsequent requests are set to "Inherit auth from parent."

## Profile & Company:
- Run Update Profile and then Update Company to establish your Admin status and link your business details.

# Phase 2: Business Logic & "Populate"
- Create Client: Run Create Client in the Client folder. Copy the _id from the JSON response.

- Create Project: Run Create Project in the Project folder. Replace "clientId": "..." with the ID you just copied.

## The Populate Check (Rubric Highlight):
- Run Get All Projects.
Note: Observe that clientId is a full object (Name, CIF, Address), proving Mongoose .populate() is correctly implemented.

# Phase 3: Advanced Logic
- Soft Delete: Run Delete User Soft
Result: User is flagged as deleted in DB. Subsequent requests will return 401 Unauthorized, proving security middleware checks user status.

- Hard Delete: Run Delete User Hard on a test user to verify complete record removal from MongoDB.

- Logout: Run Logout to invalidate the current session.
