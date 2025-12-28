const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// 1. Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://job-portal-client-rana.vercel.app",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// 2. Custom Verify Token Middleware
const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  
  if (!token) {
    return res.status(401).send({ message: "Unauthorized access: No token found" });
  }

  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized access: Invalid token" });
    }
    req.user = decoded; // টোকেন থেকে পাওয়া ডেটা রিকোয়েস্টে সেট করা
    next();
  });
};

// MongoDB Connection URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@mordancluster.s5spyh0.mongodb.net/?appName=MordanCluster`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect to MongoDB
    // await client.connect(); // প্রোডাকশনে এটি অনেক সময় দরকার হয় না

    const db = client.db("careerCode");
    const jobCollection = db.collection("jobs");
    const applicationCollection = db.collection("job_applications");
    const jobPostCollection = db.collection("job_post");

    // --- Auth Related APIs (JWT) ---
    app.post("/jwt", async (req, res) => {
      const { email } = req.body;
      const user = { email };
      const token = jwt.sign(user, process.env.JWT_ACCESS_SECRET, {
        expiresIn: "1h",
      });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // প্রোডাকশনে শুধু true হবে
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 3600000, // 1 hour
      })
      .send({ success: true });
    });

    app.post("/logout", (req, res) => {
      res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      })
      .send({ success: true });
    });

    // --- Job Related APIs ---
    app.get("/jobs", async (req, res) => {
      const result = await jobCollection.find().toArray();
      res.send(result);
    });

    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) return res.status(400).send({ error: "Invalid ID" });
      const result = await jobCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // --- Job Application APIs (Secured) ---
    app.post("/job-applications", async (req, res) => {
      const application = req.body;
      const result = await applicationCollection.insertOne(application);
      res.send(result);
    });

    // নির্দিষ্ট ইউজারের আবেদনগুলো দেখার এপিআই (Verify Token যুক্ত)
    app.get("/job-applications", verifyToken, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.user?.email;

      // সিকিউরিটি চেক: টোকেনের ইমেইল আর কুয়েরি ইমেইল এক কি না
      if (email !== decodedEmail) {
        return res.status(403).send({ message: "Forbidden access" });
      }

      const query = { email: email };
      const result = await applicationCollection.find(query).toArray();
      
      // ডাটা এনরিচমেন্ট: প্রতিটি অ্যাপ্লিকেশনের সাথে জবের নাম ও ডিটেইলস যোগ করা
      for(const application of result){
         const query2 = { _id: new ObjectId(application.job_id) };
         const job = await jobCollection.findOne(query2);
         if(job){
            application.title = job.title;
            application.company = job.company;
            application.location = job.location;
            application.company_logo = job.company_logo;
         }
      }

      res.send(result);
    });

    app.delete("/job-applications/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const result = await applicationCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // --- Job Post APIs (Admin/Recruiter) ---
    app.post("/job-post", verifyToken, async (req, res) => {
      const result = await jobPostCollection.insertOne(req.body);
      res.send(result);
    });

    app.get("/job-post", async (req, res) => {
      const result = await jobPostCollection.find().toArray();
      res.send(result);
    });

    app.get("/job-post/:id", async (req, res) => {
      const id = req.params.id;
      const result = await jobPostCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.patch("/job-post/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = { $set: updatedData };
      const result = await jobPostCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete("/job-post/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const result = await jobPostCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // MongoDB Connection Confirmation
    // await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");
  } catch (error) {
    console.error("MongoDB Error:", error);
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Job Portal Server is Running...");
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});