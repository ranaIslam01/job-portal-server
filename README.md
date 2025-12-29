# Job Portal Server

A RESTful API server for a job portal application built with Node.js, Express.js, and MongoDB.

## 📋 Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Running the Server](#running-the-server)
- [Database Structure](#database-structure)

## ✨ Features

- Job listing and retrieval
- Job posting and management
- Job application submission
- Application management (view, delete)
- Email-based filtering for applications and job posts
- Full CRUD operations for job posts
- Error handling with Bengali language support

## 🛠 Technologies Used

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **MongoDB Node.js Driver** - Database connectivity
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management
- **jsonwebtoken** - JWT authentication (for future use)
- **firebase-admin** - Firebase integration (for future use)
- **cookie-parser** - Cookie parsing middleware

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v14 or higher)
- npm (Node Package Manager)
- MongoDB Atlas account or local MongoDB instance

## 🚀 Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd Job-Portal-Server
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory and add your environment variables:

```env
PORT=3000
DB_USER=your_mongodb_username
DB_PASS=your_mongodb_password
```

## 🔐 Environment Variables

Create a `.env` file with the following variables:

| Variable  | Description        | Example         |
| --------- | ------------------ | --------------- |
| `PORT`    | Server port number | `3000`          |
| `DB_USER` | MongoDB username   | `your_username` |
| `DB_PASS` | MongoDB password   | `your_password` |

## 📡 API Endpoints

### Jobs

#### Get All Jobs

```
GET /jobs
```

Returns all jobs sorted by newest first.

**Response:**

```json
[
  {
    "_id": "job_id",
    "title": "Job Title",
    "company": "Company Name",
    ...
  }
]
```

#### Get Single Job

```
GET /jobs/:id
```

Returns a specific job by ID.

**Response:**

```json
{
  "_id": "job_id",
  "title": "Job Title",
  "company": "Company Name",
  ...
}
```

**Error Responses:**

- `400` - Invalid ID format (অবৈধ ID ফরম্যাট)
- `404` - Job not found (জব পাওয়া যায়নি)
- `500` - Server error (সার্ভার ত্রুটি)

### Job Applications

#### Submit Application

```
POST /job-applications
```

Submit a new job application.

**Request Body:**

```json
{
  "applicant_email": "applicant@example.com",
  "job_id": "job_id",
  "name": "Applicant Name",
  ...
}
```

**Error Response:**

- `500` - Failed to submit application (আবেদন জমা দিতে ব্যর্থ)

#### Get Applications

```
GET /job-applications?email=applicant@example.com
```

Get all applications. Optional query parameter `email` to filter by applicant email.

**Response:**

```json
[
  {
    "_id": "application_id",
    "applicant_email": "applicant@example.com",
    ...
  }
]
```

**Error Response:**

- `500` - Failed to fetch application (আবেদন আনতে ব্যর্থ)

#### Delete Application

```
DELETE /job-applications/:id
```

Delete a specific application by ID.

**Error Response:**

- `500` - Failed to delete application (আবেদন মুছতে ব্যর্থ)

### Job Posts

#### Create Job Post

```
POST /job-post
```

Create a new job post.

**Request Body:**

```json
{
  "hr_email": "hr@company.com",
  "title": "Job Title",
  "company": "Company Name",
  ...
}
```

**Error Response:**

- `500` - Failed to submit Job Post (জব পোস্ট জমা দিতে ব্যর্থ)

#### Get All Job Posts

```
GET /job-post?email=hr@company.com
```

Get all job posts. Optional query parameter `email` to filter by HR email.

**Response:**

```json
[
  {
    "_id": "post_id",
    "hr_email": "hr@company.com",
    "title": "Job Title",
    ...
  }
]
```

**Error Response:**

- `500` - Failed to fetch Job Post (জব পোস্ট আনতে ব্যর্থ)

#### Get Single Job Post

```
GET /job-post/:id
```

Get a specific job post by ID.

**Error Responses:**

- `400` - Invalid ID format (অবৈধ ID ফরম্যাট)
- `404` - Job post not found (জব পোস্ট পাওয়া যায়নি)
- `500` - Failed to fetch job post (জব পোস্ট আনতে ব্যর্থ)

#### Update Job Post

```
PATCH /job-post/:id
```

Update a specific job post by ID.

**Request Body:**

```json
{
  "title": "Updated Title",
  "description": "Updated Description",
  ...
}
```

#### Delete Job Post

```
DELETE /job-post/:id
```

Delete a specific job post by ID.

**Error Response:**

- `500` - Failed to delete job post (জব পোস্ট মুছতে ব্যর্থ)

### Root Endpoint

#### Health Check

```
GET /
```

Returns server status message.

**Response:**

```
জব পোর্টাল সার্ভার চলছে...
```

## 🏃 Running the Server

1. Make sure your `.env` file is configured correctly.

2. Start the server:

```bash
npm start
```

Or if you have nodemon installed:

```bash
nodemon index.js
```

3. The server will start on the port specified in your `.env` file (default: 3000).

4. You should see:

```
MongoDB-তে সফলভাবে সংযুক্ত হয়েছে!
সার্ভার 3000 পোর্টে শুনছে
```

## 🗄 Database Structure

The server uses MongoDB with the following collections:

- **jobs** - Main job listings
- **job_applications** - Job application submissions
- **job_post** - Job posts created by HR

### Database Name

`careerCode`

## 🌐 CORS Configuration

The server is configured to allow requests from:

- `http://localhost:5173` (development)
- `https://job-portal-client-rana.vercel.app` (production)

## 📝 Notes

- All error messages are in Bengali (Bangla) language
- The server uses MongoDB Atlas for cloud database hosting
- JWT and Firebase Admin are included for future authentication features
- All API responses are in JSON format

## 📄 License

ISC

## 👤 Author

Job Portal Server - Career Code Project

---

For any issues or questions, please open an issue in the repository.
