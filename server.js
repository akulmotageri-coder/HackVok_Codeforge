require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const cors = require('cors');

const Project = require('./models/Project');
const Client = require('./models/Client');
const Invoice = require('./models/Invoice');
const Communication = require('./models/Communication');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const DB_URL = "mongodb+srv://akul:cGJoO3RyIVJ7NYAN@cluster0.sq7fqcj.mongodb.net/solosync?retryWrites=true&w=majority";

mongoose.connect(DB_URL)
  .then(() => console.log('✅ MongoDB Atlas Connected!'))
  .catch(err => console.log('❌ DB Error:', err));


io.on('connection', (socket) => {
  console.log('⚡ Frontend connected:', socket.id);
});


app.post('/api/parse-request', async (req, res) => {
  const { rawText, platform } = req.body;
  console.log('📩 Processing Request:', rawText);

  try {
    const newComm = await new Communication({
      platform: platform || 'Email',
      content: rawText
    }).save();

    const aiData = {
      clientName: "Alpha Corp",
      taskTitle: "Mobile App UI",
      budget: 1500,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    };


    let client = await Client.findOne({ name: aiData.clientName });
    if (!client) {
      client = await new Client({ 
        name: aiData.clientName, 
        history: [{ event: 'Client Onboarded' }] 
      }).save();
    }


    const newProject = await new Project({
      clientName: client.name,
      taskTitle: aiData.taskTitle,
      budget: aiData.budget,
      deadline: aiData.deadline,
      status: 'To Do'
    }).save();


    const newInvoice = await new Invoice({
      amount: aiData.budget,
      project: newProject._id,
      client: client._id,
      status: 'Draft'
    }).save();

   
    io.emit('sync-complete', {
      project: newProject,
      invoice: newInvoice,
      client: client
    });


    res.json({ success: true, message: "Workflow Synced Successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Sync Failed" });
  }
});

// --- START THE SERVER ---
const PORT = 5000;
server.listen(PORT, () => console.log(`🚀 SoloSync Server running on Port ${PORT}`));
