require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const cors = require('cors');

// --- IMPORT THE 4 ENGINE MODELS ---
const Project = require('./models/Project');
const Client = require('./models/Client');
const Invoice = require('./models/Invoice');
const Communication = require('./models/Communication');

const app = express();
const server = http.createServer(app);

// --- SETUP REAL-TIME SOCKETS (CORS) ---
const io = new Server(server, {
  cors: {
    origin: "*", // Allows your React Frontend to connect
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// --- DATABASE CONNECTION (MONGODB CLOUD) ---
// Your specific Cloud URL with the password included
const DB_URL = "mongodb+srv://akul:cGJoO3RyIVJ7NYAN@cluster0.sq7fqcj.mongodb.net/solosync?retryWrites=true&w=majority";

mongoose.connect(DB_URL)
  .then(() => console.log('✅ MongoDB Atlas Connected!'))
  .catch(err => console.log('❌ DB Error:', err));


// --- SOCKET.IO CONNECTION EVENTS ---
io.on('connection', (socket) => {
  console.log('⚡ Frontend connected:', socket.id);
});


// --- THE MAIN API: THE "SOLOSYNC" ENGINE ---
// This endpoint triggers all 4 engines at once
app.post('/api/parse-request', async (req, res) => {
  const { rawText, platform } = req.body;
  console.log('📩 Processing Request:', rawText);

  try {
    // 1. COMMUNICATION ENGINE: Save the raw message
    const newComm = await new Communication({
      platform: platform || 'Email',
      content: rawText
    }).save();

    // 2. AI PARSING (MOCKED for Track A)
    // This simulates the Python AI extracting data from the text
    const aiData = {
      clientName: "Alpha Corp",
      taskTitle: "Mobile App UI",
      budget: 1500,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    };

    // 3. CLIENT ENGINE: Find existing client or create a new one
    let client = await Client.findOne({ name: aiData.clientName });
    if (!client) {
      client = await new Client({ 
        name: aiData.clientName, 
        history: [{ event: 'Client Onboarded' }] 
      }).save();
    }

    // 4. TASK ENGINE: Create the Project card
    const newProject = await new Project({
      clientName: client.name,
      taskTitle: aiData.taskTitle,
      budget: aiData.budget,
      deadline: aiData.deadline,
      status: 'To Do'
    }).save();

    // 5. FINANCE ENGINE: Auto-Draft the Invoice
    const newInvoice = await new Invoice({
      amount: aiData.budget,
      project: newProject._id,
      client: client._id,
      status: 'Draft'
    }).save();

    // 6. REAL-TIME UPDATE: Notify the Dashboard
    io.emit('sync-complete', {
      project: newProject,
      invoice: newInvoice,
      client: client
    });

    // Send success response back to the API caller
    res.json({ success: true, message: "Workflow Synced Successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Sync Failed" });
  }
});

// --- START THE SERVER ---
const PORT = 5000;
server.listen(PORT, () => console.log(`🚀 SoloSync Server running on Port ${PORT}`));