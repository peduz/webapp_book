const connection = require("../data/db")

function index(req, res) {
    console.log("Entrato nell'index")

    const sql = "SELECT * FROM books;";

    connection.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({
                error: "Database query failed"
            })
        }

        res.json(results)
    })
}


function show(req, res) {
    console.log("Entrato nello show")

    const { id } = req.params;

    const sql = "SELECT * FROM books WHERE id = ? ";

    connection.query(sql, [id], (err, results) => {
        if (err) {
            return res.status(500).json({
                error: err.message,
                message: "Database query failed"
            })
        }


        const book = results[0];
        if (!book) {

            return res.status(404).json({
                message: "Book does not exist"
            })
        }

        const reviewSQL = "SELECT * FROM reviews WHERE book_id = ? "

        connection.query(reviewSQL, [id], (err, reviewResults) => {
            if (err) {
                return res.status(500).json({
                    error: err.message,
                    message: "Database query failed"
                })
            }
            if (reviewResults) {
                book.reviews = reviewResults
            }

            res.json(book);
        })

    })

}


module.exports = { index, show }