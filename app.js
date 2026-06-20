const express = require("express")

const app = express();
const cors = require("cors")

const port = process.env.PORT;

const bookRouter = require("./routers/bookRouter")
const reviewRouter = require("./routers/reviewRouter")

app.use(cors({ origin: process.env.FE_APP }))

//Middlewares
const errorsHandler = require("./middlewares/errorsHandler")
const notFound = require("./middlewares/notFound")
const imagePathMiddleware = require("./middlewares/imagePath")

app.use(express.static('public'))

app.use(express.json());

app.use(imagePathMiddleware);

app.get("/", (req, res) => {
    res.send("Server is up")
});


app.use("/api/books", bookRouter)

app.use("/api/reviews", reviewRouter)


app.use(errorsHandler)
app.use(notFound)

app.listen(port, () => {
    console.log("Books app listening on port " + port)
})