# BildyApp API

Backend REST API for managing construction delivery notes between companies, clients, and projects. Built with Node.js, Express, and MongoDB.

---

## Tech Stack

| Category       | Technology                          |
|----------------|-------------------------------------|
| Runtime        | Node.js (ES Modules)                |
| Framework      | Express 4                           |
| Database       | MongoDB + Mongoose                  |
| Auth           | JWT (jsonwebtoken) + bcryptjs       |
| Validation     | Zod                                 |
| Real-time      | Socket.IO (WebSockets)              |
| PDF Generation | PDFKit                              |
| Email          | Nodemailer                          |
| Monitoring     | Slack Incoming Webhooks (5XX alerts)|
| Security       | Helmet, CORS, express-rate-limit, express-mongo-sanitize |
| Testing        | Jest + Supertest + mongodb-memory-server |
| Documentation  | Swagger / OpenAPI 3.0               |

---

## Prerequisites

- Node.js v18 or higher
- A MongoDB Atlas account (free tier is enough)
- A Gmail or Mailtrap account for email sending
- A Slack workspace with an Incoming Webhook (optional but recommended)
- Postman (for manual testing)

---

# Setup

# 1. Clone and install

```bash
git clone <repository-url>
cd bildyapp-api
npm install
```

# 2. Configure environment variables
Copy the example file and fill in your values:

```bash
cp .env.example .env
```
Open .env and set the following:
```bash
PORT=3000
```

## MongoDB Atlas connection string
### Get this from: Atlas dashboard → Connect → Drivers → Node.js
```bash
DBURI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/bildyapp?retryWrites=true&w=majority
```

### Secret key for signing JWT tokens — any long random string works
```bash
JWT_SECRET=your_super_secret_key_here_make_it_long
```

### Email credentials (Mailtrap recommended for testing, Gmail for production)
```bash
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=587
EMAIL_USER=your_mailtrap_user
EMAIL_PASS=your_mailtrap_password
```
```bash
NODE_ENV=development
```

# 3. Set up MongoDB Atlas
Go to cloud.mongodb.com and create a free account
Create a new Free Tier cluster (M0)
Under Database Access, create a user with read/write permissions
Under Network Access, add 0.0.0.0/0 to allow connections from anywhere
Click Connect → Drivers → Node.js and copy the connection string into DBURI
Running the server
### Development (auto-restarts on changes)
```bash
npm run dev
```

# Production
```bash
npm start
```
The server starts at http://localhost:3000.

Running the tests
### Run all tests
```bash
npm test
```

### Run tests with coverage report
```bash
npm run test:coverage
```

### Watch mode (re-runs on file changes)
```bash
npm run test:watch
```
Test results
The test suite covers 34 integration tests across 4 test files:

Test Suites: 4 passed, 4 total
Tests:       34 passed, 34 total
Test Suite	Tests	What it covers
auth.test.js	6	Register, email validation, login, profile, company, delete
client.test.js	10	Full CRUD, archive/restore, pagination, auth guard
project.test.js	9	Full CRUD, archive/restore, pagination, auth guard
deliverynote.test.js	9	Create (hours + material), list, sign, PDF, delete rules
Coverage report
All files  |  72.59% Stmts  |  76.92% Lines
Passes the ≥70% requirement. Tests run against an isolated in-memory MongoDB instance (mongodb-memory-server) — no real database is touched during testing.
API Documentation (Swagger)
With the server running, open:
```bash
http://localhost:3000/api-docs
```

The interactive Swagger UI documents all endpoints with:

Request body schemas and examples
Required vs optional fields
All possible response codes (200, 201, 400, 401, 404, 409)
Built-in "Try it out" for manual testing directly from the browser
You can authorize with your JWT token by clicking the Authorize button (top right) and entering <your_token>.

# Manual testing with Postman
Step 1: Import the collection
Open Postman
Click Import → drag and drop postman/BildyApp_API.postman_collection.json
The collection BildyApp API will appear in your sidebar with 4 folders
The collection is pre-configured with:

{{baseUrl}} pointing to http://localhost:3000/api
Bearer token auth inherited by all requests
Automatic variable saving (token, clientId, projectId, noteId) via test scripts
Step 2: Full walkthrough (run in order)
Phase 1 — Register and authenticate
1. Register User (Auth & User → 1. Register User)

Send the request with any email and a password (min 8 chars, at least one uppercase and one number)
Expected: 201 Created
Check the server terminal — a 6-digit code is printed there (in production it would be sent by email)
2. Validate Email (Auth & User → 2. Validate Email)

Paste the 6-digit code from the terminal into the code field
Expected: 200 OK — "Verified"
3. Login (Auth & User → 3. Login)

Send the request
Expected: 200 OK with a token field
The token is automatically saved to the {{token}} collection variable — you do not need to copy it manually
4. Update Profile (Auth & User → 4. Update Profile)

Fill in your name, last name, and NIF
Expected: 200 OK
5. Update Company (Auth & User → 5. Update Company)

Fill in the company details
Expected: 200 OK
This step is required before creating clients or projects
Phase 2 — Create clients and projects
6. Create Client (Clients → Create Client)

Send with the pre-filled body
Expected: 201 Created
The _id from the response is automatically saved to {{clientId}}
7. Create Project (Projects → Create Project)

The body already references {{clientId}} — it is filled in automatically
Expected: 201 Created
The _id is automatically saved to {{projectId}}
8. Get Project by ID (Projects → Get Project by ID)

Expected: 200 OK
Notice that client is returned as a full object (not just an ID) — this demonstrates Mongoose .populate() working correctly
Phase 3 — Delivery notes and signing
9. Create Delivery Note (Hours) (Delivery Notes → Create Delivery Note (Hours))

Uses {{clientId}} and {{projectId}} automatically
Expected: 201 Created
The _id is automatically saved to {{noteId}}
At this point a deliverynote:new Socket.IO event is emitted to the company room
10. Sign Delivery Note (Delivery Notes → Sign Delivery Note)

The body contains a small Base64-encoded PNG as the signature
Expected: 200 OK with signed: true and a pdfPath
The PDF is generated and saved on the server
A deliverynote:signed Socket.IO event is emitted
11. Download PDF (Delivery Notes → Download PDF)

Click Send and Download (arrow next to Send) to save the PDF file
Expected: a PDF file streams back with the delivery note details and the signature image
Note: returns 404 if the note has not been signed yet
12. Try to delete the signed note (Delivery Notes → Delete Delivery Note (Unsigned Only))

Expected: 400 Bad Request — "Cannot delete a signed delivery note"
This demonstrates that signed notes are immutable
Phase 4 — Archive / restore flow
13. Archive Client (Clients → Archive Client (Soft Delete))

Expected: 200 OK — "Client archived"
The client is not deleted from the database, just flagged
14. List Archived Clients (Clients → List Archived Clients)

Expected: 200 OK — the archived client appears in the list with deleted: true
15. Restore Client (Clients → Restore Archived Client)

Expected: 200 OK with deleted: false
The client is active again
The same archive/restore flow works identically for projects.

Phase 5 — Security checks
16. Duplicate CIF check

Try creating a second client with the same CIF you used in step 6
Expected: 409 Conflict — "A client with this CIF already exists in your company"
17. Rate limiting

The API allows 100 requests per 15 minutes per IP
Exceeding this returns: 429 Too Many Requests
18. Unauthenticated request

Remove the Bearer token from any protected request (e.g., GET /api/client)
Expected: 401 Unauthorized


# Project structure
<img width="519" height="704" alt="image" src="https://github.com/user-attachments/assets/4ad8a62a-421b-4a36-adc5-4712f86a3be6" />


# Key design decisions

Company-scoped data: clients, projects, and delivery notes belong to a company, not just a user. Any user from the same company can access shared resources.

Soft delete by default: archiving sets deleted: true rather than removing the document, allowing recovery.

Immutable signed notes: once a delivery note is signed, it cannot be modified or deleted — the signature and PDF are permanent.

Real-time via Socket.IO rooms: events are only emitted to users in the same company room, identified by company._id.

Test isolation: every test runs against a fresh in-memory MongoDB instance, with all collections cleared between tests.

<br>
</br>

<div align="right">

**Juan Alejandro Ramos Quintás**  
*Web Development II, Server (2602_INSG3_PW2S_A)*


</div>

<br>
</br>
<br>
</br>

<div align="center">
<img width="500" alt="image" src="https://github.com/user-attachments/assets/9c11fe3e-4a9d-4fac-af79-b22a29050066" />

</div>
