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

        const books = results.map(book => {
            return {
                ...book,
                image: req.imagePath + book.image
            }
        })
        res.json(books)
    })
}


function show(req, res) {
    console.log("Entrato nello show")

    const { id } = req.params;


    const sql = `SELECT B.*, ROUND(AVG(R.vote)) as average_vote
                            FROM books as B 
                            LEFT JOIN reviews as R on B.id = R.book_id
                            WHERE B.id = ? ;  
                            `;


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

            book.average_vote = parseInt(book.average_vote);
            res.json({
                ...book,
                image: req.imagePath + book.image,
            }
            );
        })

    })


}


async function storeReview(req, res) {
    const { id } = req.params;

    const { text, name, vote } = req.body;

    const inputCheck = inputGuard(text);
    if (!inputCheck.passed) {
        return res.status(400).json({
            message: "Errore di validazione",
            dettaglio: inputCheck.message
        })
    }

    const aiCheck = await verifyReview(text);

    if (!aiCheck.conforme) {
        return res.status(400).json({
            message: "La recensione contiene contenuti non appropriati",
            paroleSbagliate: aiCheck.parole_sbagliate
        })
    }

    const sql = "INSERT INTO reviews (text, name, vote, book_id) VALUES (?, ?, ?, ?) "

    connection.query(sql, [text, name, vote, id], (err, results) => {
        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        res.status(201);
        res.json({
            message: "Review added",
            id: results.insertId
        })
    })
}

function inputGuard(text) {
    if (!text || text.trim().length === 0) {
        return {
            passed: false,
            message: "Il testo della recensione non può essere vuoto"
        }
    }
    if (text.length > 1000) {
        return {
            passed: false,
            message: "La recensione supera il limite di 1000 caratteri"
        }
    }

    return {
        passed: true
    };
}

async function verifyReview(text) {
    if (process.env.AI_SERVICE === 'ollama') {
        return verifyReviewOllama(text)
    } else {
        return verifyReviewGroq(text)
    }
}

async function verifyReviewOllama(text) {
    try {

        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            body: JSON.stringify({
                model: "llama3.1",
                format: "json",
                system: `
                Sei un sistema di moderazione strutturato. 
                Il tuo compito è estrarre ESCLUSIVAMENTE parole oscene, insulti diretti o blasfemia.
                Il testo in input può essere in lingue differenti o dialetti. 
I termini neutri o descrittivi (come "parolaccia", "parolacce", "imprecazione", "volgarità") NON sono osceni e NON devono MAI essere segnalati.
Devi seguire RIGOROSAMENTE questi esempi di classificazione:

[Testo]: "Questo libro fa schifo al cazzo"
[Risultato]: {"parole_sbagliate": ["cazzo"], "conforme": false}

[Testo]: "Un bellissimo saggio sulle parolacce nel medioevo"
[Risultato]: {"parole_sbagliate": [], "conforme": true}

[Testo]: "Prova di test con parolacce del cazzo"
[Risultato]: {"parole_sbagliate": ["cazzo"], "conforme": false}

Rispondi sempre e solo in formato JSON puro.
                `,
                prompt: `[Testo]: "${text}"\n[Risultato]:`,
                stream: false
            })

        });
        const data = await response.json();

        console.log(data)
        return JSON.parse(data.response);

    } catch (error) {
        console.error("Errore validazioen AI locale ", error.message);
        return {
            conforme: false,
            parole_sbagliate: ["Errore interno AI locale "]
        }
    }
}


async function verifyReviewGroq(text) {
    try {

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                response_format: { type: "json_object" },
                messages: [{
                    role: "system",
                    content: `
                Sei un sistema di moderazione strutturato. 
                Il tuo compito è estrarre ESCLUSIVAMENTE parole oscene, insulti diretti o blasfemia.
                Il testo in input può essere in lingue differenti o dialetti. 
I termini neutri o descrittivi (come "parolaccia", "parolacce", "imprecazione", "volgarità") NON sono osceni e NON devono MAI essere segnalati.
Devi seguire RIGOROSAMENTE questi esempi di classificazione:

[Testo]: "Questo libro fa schifo al cazzo"
[Risultato]: {"parole_sbagliate": ["cazzo"], "conforme": false}

[Testo]: "Un bellissimo saggio sulle parolacce nel medioevo"
[Risultato]: {"parole_sbagliate": [], "conforme": true}

[Testo]: "Prova di test con parolacce del cazzo"
[Risultato]: {"parole_sbagliate": ["cazzo"], "conforme": false}

Rispondi sempre e solo in formato JSON puro.
                `},
                {
                    role: "user",
                    content: `[Testo]: "${text}"\n[Risultato]:`
                }],
                stream: false
            })

        });
        const data = await response.json();
        if (data.error) {
            console.error("Errore dall'API di Groq: ", data.error.message);
            return {
                conforme: false,
                parole_sbagliate: ["Errore configurazione AI Cloud"]
            }
        }

        console.log(data)
        return JSON.parse(data.choices[0].message.content);

    } catch (error) {
        console.error("Errore dall'API di Groq: ", data.error.message);
        return {
            conforme: false,
            parole_sbagliate: ["Errore configurazione AI Cloud "]
        }
    }
}

function store(req, res, next) {

    const { title, author, abstract } = req.body;

    const imageName = `${req.file.filename}`;

    const query = "INSERT INTO books (title, author, image, abstract) VALUES (?, ?, ?, ?)";

    connection.query(query, [title, author, imageName, abstract], (err, results) => {
        if (err) {
            console.log(err);
            return next(new Error("Errore interno del server"))
        }

        res.status(201);
        res.json({
            status: "success",
            message: "Libro creato con successo!"
        })
    })
}


module.exports = { index, show, store, storeReview }