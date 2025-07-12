const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const scriptRoutes = require('./routes/scripts');
const scheduler = require('./scheduler');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

app.use('/api/auth', authRoutes);
app.use('/api/scripts', scriptRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// start scheduler
scheduler.start();
