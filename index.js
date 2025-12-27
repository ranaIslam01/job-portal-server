const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 3000;
require("dotenv").config();

// middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
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
    app.post("/jwt", async (req, res) => {
      const { email } = req.body;
      const user = { email };
      const token = jwt.sign(user, process.env.JWT_ACCESS_SECRET, {
        expiresIn: "1h",
      });

      // set token in the cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 60 * 60 * 1000, // 1 hour
      });

      res.send({ success: true });
    });

    // ১. সবগুলো জব পাওয়ার এপিআই
    app.get("/jobs", async (req, res) => {
      const cursor = jobCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // ২. নির্দিষ্ট একটি জব পাওয়ার এপিআই (Single Job)
    app.get("/jobs/:id", async (req, res) => {
      try {
        const id = req.params.id;

        // আইডি ভ্যালিডেশন (BSONError সমাধান করবে)
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

    // ৩. জব অ্যাপ্লিকেশন সেভ করার এপিআই (POST Method)
    app.post("/job-applications", async (req, res) => {
      try {
        const application = req.body;
        const result = await applicationCollection.insertOne(application);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to submit application" });
      }
    });

    app.get("/job-applications", async (req, res) => {
      try {
        const cursor = applicationCollection.find();
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "falid to fetch application" });
      }
    });

    app.delete("/job-applications/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await applicationCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to delete application" });
      }
    });

    app.post("/job-post", async (req, res) => {
      try {
        const jobPost = req.body;
        const result = await jobPostCollection.insertOne(jobPost);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to sumbit Job Post" });
      }
    });

    app.get("/job-post", async (req, res) => {
      try {
        const cursor = jobPostCollection.find();
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "faild to fetch Job Post" });
      }
    });

    // ৬. নির্দিষ্ট জব পোস্ট আপডেট করার এপিআই
    app.patch("/job-post/:id", async (req, res) => {
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

      try {
        const result = await jobPostCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to update job" });
      }
    });

    // MongoDB Connection Confirmation
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
  }
}

run().catch(console.dir);

// Root API
app.get("/", (req, res) => {
  res.send("Job Portal Server is Running...");
});

// Start Server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
