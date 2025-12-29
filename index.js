const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
require("dotenv").config();

// middleware
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

    // ডাটবেজ এবং কালেকশন ডিফাইন করা
    const db = client.db("careerCode");
    const jobCollection = db.collection("jobs");
    const applicationCollection = db.collection("job_applications");
    const jobPostCollection = db.collection("job_post");

    // jwt token related api

    // ১. সবগুলো জব পাওয়ার এপিআই
    app.get("/jobs", async (req, res) => {
      const cursor = jobCollection.find().sort({ _id: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    // ২. নির্দিষ্ট একটি জব পাওয়ার এপিআই (Main Jobs collection থেকে)
    app.get("/jobs/:id", async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ error: "অবৈধ ID ফরম্যাট" });
        }
        const query = { _id: new ObjectId(id) };
        const result = await jobCollection.findOne(query);
        if (!result) {
          return res.status(404).send({ message: "জব পাওয়া যায়নি" });
        }
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "সার্ভার ত্রুটি" });
      }
    });

    // ৩. জব অ্যাপ্লিকেশন সংক্রান্ত এপিআই
    app.post("/job-applications", async (req, res) => {
      try {
        const application = req.body;
        const result = await applicationCollection.insertOne(application);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "আবেদন জমা দিতে ব্যর্থ" });
      }
    });

    app.get("/job-applications", async (req, res) => {
      try {
        const email = req.query.email;
        let query = {};
        if (email) {
          query = { applicant_email: email };
        }

        const cursor = applicationCollection.find(query).sort({ _id: -1 });
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "আবেদন আনতে ব্যর্থ" });
      }
    });

    app.delete("/job-applications/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await applicationCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "আবেদন মুছতে ব্যর্থ" });
      }
    });

    // ৪. জব পোস্ট (নতুন জব অ্যাড করা)
    app.post("/job-post", async (req, res) => {
      try {
        const jobPost = req.body;
        const result = await jobPostCollection.insertOne(jobPost);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "জব পোস্ট জমা দিতে ব্যর্থ" });
      }
    });

    // ৫. সব জব পোস্ট পাওয়া
    app.get("/job-post", async (req, res) => {
      try {
        const email = req.query.email; // ইমেইল ধরুন
        let query = {};
        if (email) {
          query = { hr_email: email };
        }
        const cursor = jobPostCollection.find(query).sort({ _id: -1 });
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "জব পোস্ট আনতে ব্যর্থ" });
      }
    });

    // ৬. নির্দিষ্ট একটি জব পোস্ট পাওয়া (আপডেট পেজের ডাটা দেখানোর জন্য এটি মাস্ট লাগবে)
    app.get("/job-post/:id", async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ error: "অবৈধ ID ফরম্যাট" });
        }
        const query = { _id: new ObjectId(id) };
        const result = await jobPostCollection.findOne(query);
        if (!result) {
          return res.status(404).send({ message: "জব পোস্ট পাওয়া যায়নি" });
        }
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "জব পোস্ট আনতে ব্যর্থ" });
      }
    });

    // ৭. নির্দিষ্ট জব পোস্ট আপডেট করা
    app.patch("/job-post/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      const filter = { _id: new ObjectId(id) };

      const updateDoc = {
        $set: { ...updatedData },
      };

      const result = await jobPostCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // ৮. নির্দিষ্ট জব পোস্ট ডিলিট করা (এটি আপনার ব্যাকএন্ডে যোগ করুন)
    app.delete("/job-post/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await jobPostCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "জব পোস্ট মুছতে ব্যর্থ" });
      }
    });

    // MongoDB Connection Confirmation
    await client.db("admin").command({ ping: 1 });
    console.log("MongoDB-তে সফলভাবে সংযুক্ত হয়েছে!");
  } catch (error) {
    console.error("MongoDB সংযোগ ত্রুটি:", error);
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("জব পোর্টাল সার্ভার চলছে...");
});

app.listen(port, () => {
  console.log(`সার্ভার ${port} পোর্টে শুনছে`);
});
