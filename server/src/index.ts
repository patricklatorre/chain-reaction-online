import path from 'path';
import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

const root = path.join(__dirname, '../../client/dist/');
app.use(express.static(root));

// Redirect without changing request URL
app.get("*", (req, res) => {
    res.sendFile('index.html', { root });
})

// Sanitize env vars
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => console.log(`Running at http://localhost:${PORT}`));