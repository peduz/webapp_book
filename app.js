const express = require("express")

const app = express();

const port = process.env.PORT;

const bookRouter = require("./routers/bookRouter")

//Middlewares
const errorsHandler = require("./middlewares/errorsHandler")
const notFound = require("./middlewares/notFound")

app.use(express.static('public'))

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Server is up")
});

app.use("/api/books", bookRouter)

app.use(errorsHandler)
app.use(notFound)

app.listen(port, () => {
    console.log("Books app listening on port " + port)
})