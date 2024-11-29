const express = require('express');
const cors = require('cors');
const app = express();
const { ip, port, session_secret } = require('./config');

app.use(cors());

app.use(express.json({ limit: '1000mb' }));
app.use(express.urlencoded({ limit: '1000mb', extended: true }));

// const userRoute = require('./routes/userRoutes');
// app.use('/users', userRoute);






// Start the server
app.listen(port, ip, () => {
    console.log(`Server is running on: ${ip}:${port}`);
});