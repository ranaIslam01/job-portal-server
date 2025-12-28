const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// --- middleware ---
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

// --- verify token middleware ---
const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized access" });
    }
    req.user = decoded;
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
    await client.connect();

    // ডাটবেজ এবং কালেকশন
    const db = client.db("careerCode");
    const jobCollection = db.collection("jobs");
    const applicationCollection = db.collection("job_applications");
    const jobPostCollection = db.collection("job_post");

    // --- jwt token related api ---
    app.post("/jwt", async (req, res) => {
      const { email } = req.body;
      const user = { email };
      const token = jwt.sign(user, process.env.JWT_ACCESS_SECRET, {
        expiresIn: "1h",
      });

      res.cookie("token", token, {
        httpOnly: true,
        secure: true, // true for production/render
        sameSite: "None",
        maxAge: 60 * 60 * 1000, // 1 hour
      });

      res.send({ success: true });
    });

    // --- logout api ---
    app.post("/logout", (req, res) => {
      res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "None",
      }).send({ success: true });
    });

    // --- Job Application APIs (Protected) ---
    app.get("/job-applications", verifyToken, async (req, res) => {
      try {
        const email = req.query.email;
        // চেক করা হচ্ছে টোকেনের ইমেইল আর রিকোয়েস্টের ইমেইল এক কি না
        if (req.user.email !== email) {
          return res.status(403).send({ message: "Forbidden Access" });
        }

        const query = { email: email };
        const result = await applicationCollection.find(query).toArray();

        // জবের বিস্তারিত তথ্য যোগ করা (Frontend-এ সুন্দর দেখানোর জন্য)
        for (const application of result) {
          const query2 = { _id: new ObjectId(application.job_id) };
          const job = await jobCollection.findOne(query2);
          if (job) {
            application.title = job.title;
            application.company = job.company;
            application.location = job.location;
            application.company_logo = job.company_logo;
          }
        }
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch applications" });
      }
    });

    // ১. সবগুলো জব পাওয়ার এপিআই
    app.get("/jobs", async (req, res) => {
      const cursor = jobCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // ২. নির্দিষ্ট একটি জব পাওয়ার এপিআই
    app.get("/jobs/:id", async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ error: "Invalid ID format" });
        }
        const query = { _id: new ObjectId(id) };
        const result = await jobCollection.findOne(query);
        if (!result) {
          return res.status(404).send({ message: "Job not found" });
        }
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Internal Server Error" });
      }
    });

    // ৩. জব অ্যাপ্লিকেশন পোস্ট
    app.post("/job-applications", async (req, res) => {
      try {
        const application = req.body;
        const result = await applicationCollection.insertOne(application);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to submit application" });
      }
    });

    app.delete("/job-applications/:id", verifyToken, async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await applicationCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to delete application" });
      }
    });

    // ৪. জব পোস্ট (নতুন জব অ্যাড করা)
    app.post("/job-post", verifyToken, async (req, res) => {
      try {
        const jobPost = req.body;
        const result = await jobPostCollection.insertOne(jobPost);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to submit Job Post" });
      }
    });

    // ৫. সব জব পোস্ট পাওয়া
    app.get("/job-post", async (req, res) => {
      try {
        const cursor = jobPostCollection.find();
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch Job Post" });
      }
    });

    // ৬. নির্দিষ্ট একটি জব পোস্ট পাওয়া
    app.get("/job-post/:id", async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ error: "Invalid ID format" });
        }
        const query = { _id: new ObjectId(id) };
        const result = await jobPostCollection.findOne(query);
        if (!result) {
          return res.status(404).send({ message: "Job post not found" });
        }
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch job post" });
      }
    });

    // ৭. নির্দিষ্ট জব পোস্ট আপডেট করা
    app.patch("/job-post/:id", verifyToken, async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            title: updatedData.title,
            company: updatedData.company,
            category: updatedData.category,
            jobType: updatedData.jobType,
            salary: updatedData.salary,
            location: updatedData.location,
            description: updatedData.description,
          },
        };
        const result = await jobPostCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to update job" });
      }
    });

    // ৮. নির্দিষ্ট জব পোস্ট ডিলিট করা
    app.delete("/job-post/:id", verifyToken, async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await jobPostCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to delete job post" });
      }
    });

    // MongoDB Connection Confirmation
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Job Portal Server is Running...");
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});