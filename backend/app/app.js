require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const readCountries = require("./services/bdd/readCountries");
const readUsers = require("./services/bdd/readUsers");
const authMiddleware = require("./services/authentication/auth");
const jwt = require('jsonwebtoken');
const adminRouter = require("./routers/users");
const assoRouter = require("./routers/countries");

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "phrasesecret";
const JWT_TIME = process.env.JWT_TIME || "1h";
const corsOptions = {
    origin: process.env.URL_ORIGIN || "http://localhost:3000",
    optionsSuccessStatus: 200
}

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded())
app.use("/users", adminRouter)
app.use("/countries", assoRouter)

app.get('/full', (req, res) => {
    res.json(readCountries());
})

app.get('/normal', (req, res) => {
    const data = readCountries().map(country => ({
        name: country.name,
        cca2: country.cca2,
        cca3: country.cca3,
        currencies: country.currencies,
        languages: country.languages,
        flag: country.flags.png,
        capital: country.capital,
        population: country.population,
        continent: country.continents
    }));
    res.json(data);
})

app.get('/short', (req, res) => {
    const data = readCountries().map(country => ({
        name: country.name,
        cca2: country.cca2,
        cca3: country.cca3,
        flag: country.flags.png
    }));
    res.json(data);
})

app.get('/auth-status', authMiddleware, (req, res) => {
    res.json({ lmessage: 'Utilisateur connecté', user: req.user });
})

app.post('/login', async (req,res) => {
    const {username, password} = req.body;
    const users = readUsers();
    const user = users.find(user => user.username == username);

    if(user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign(
            {username: user.username, role: user.role}, 
            JWT_SECRET, 
            {expiresIn: JWT_TIME}
        );
        res.json({ message: 'Connexion réussie', token });
    } else {
        res.status(401).send("Erreur lors de la connexion !")
    }
})

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`app running on port ${PORT}`);
    });
}

module.exports = app;