const mysql = require("mysql");
const express = require("express");
const app = express();
const bodyparser = require("body-parser");
const port = 5005;
const path = require("path");

 const staticPath = path.join(__dirname, "../public");
const templatePath = path.join(__dirname, "../templates");

app.set("view engine", "hbs");
app.set("views", templatePath);

//app.use(express.static('images'));
app.get("/", (req, res) => {
    res.render("index");
})

app.use(bodyparser.urlencoded({ extended: false }))
 
// parse application/json
app.use(bodyparser.json());

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: "",
    database: 'bankdb'
});

app.get('/customer', (req, res) => {

    pool.getConnection((err, connection) => {
        if(err){
            console.log("throw err");
        }
        
        else{
            console.log("DB connection succeeded");
            connection.query("SELECT * FROM customers", (err, rows) => {
                connection.release()
                if(err)
                console.log(err);
                else{
                    res.render("customer", {customer:rows});
                    
                }
            }) 
        }
    })
});

app.get('/details/:id', (req, res) => {

    pool.getConnection((err, connection) => {
        if(err){
            console.log("throw err");
        }
        
        else{
            console.log("DB connection succeeded");
            connection.query("SELECT * FROM customers WHERE id != ?", [req.params.id], (err, rows)  => {
                connection.release()
                if(err){
                    console.log(err);
                }
                else{
                        
                    if(rows.length > 0){
                        console.log(req.params.id);
                        let r = rows.map((e) => {
                            return{
                                ...e,
                                senderid:req.params.id
                            }
                        })
                        console.log(r)
                        res.render("details", {details:r, myid:req.params.id});

                       // console.log(rows);
                    } 
                    else{
                        res.send("Invalid id");
                    }
                }
            }) 
        }
    })
});

app.get('/transfer/:senderid/:receipentid', (req, res) => {

    pool.getConnection((err, connection) => {
        if(err){
            console.log("throw err");
        }
        
        else{
            console.log("DB connection succeeded");
            connection.query("SELECT * FROM customers WHERE id = ?", [req.params.senderid], (err1, rows1) => {
        
                if(err1){
                    console.log(err1);
                }
                
                else{

                    connection.query("SELECT * FROM customers WHERE id = ?", [req.params.receipentid], (err2, rows2) => {
        
                        if(err2){
                            console.log(err2);
                        }
                        
                        else{
                            if(rows1.length > 0 && rows2.length > 0){
                                res.render("transfer", {sender:rows1[0], receipent:rows2[0]});
                            }
                            else{
                                res.send("Invalid sender's id or receipent's id")
                            }
                            
                        }
                    }) 
                    
                }
            }) 
        }
    })
});

app.post('/transfer/:senderid/:receipentid', (req, res) => {

    pool.getConnection((err, connection) => {
        if(err){
            console.log("throw err");
        }
        
        else{
            console.log("DB connection succeeded");
            connection.query("SELECT * FROM customers WHERE id = ?", [req.params.senderid], (err1, rows1) => {
        
                if(err1){
                    console.log(err1);
                }
                
                else{

                    connection.query("SELECT * FROM customers WHERE id = ?", [req.params.receipentid], (err2, rows2) => {
        
                        if(err2){
                            console.log(err2);
                        }
                        
                        else{
                            if(rows1.length > 0 && rows2.length > 0){
                                let sender = rows1[0]
                                let receipent = rows2[0]
                                console.log(req.body, 1)
                                let amount = Number(req.body.amount)
                                if(amount > sender.current_balance){
                                    res.send("transfer amount is greater than available balance")
                                }else{
                                    connection.query("INSERT INTO transaction (senderid, sendername, senderemail, receipentid, receipentname, receipentemail, amount) VALUES (?,?,?,?,?,?,?)", [sender.id, sender.name, sender.email, receipent.id, receipent.name, receipent.email, amount], (err, rows) =>{
                                        if(err){
                                            console.log(err);
                                        }
                                        else{
                                            connection.query("UPDATE customers SET current_balance = ? WHERE id = ?", [Number(sender.current_balance) - amount, sender.id], (err, rows) => {
                                                if(err){
                                                    console.log(err)
                                                }
                                                else{
                                                    connection.query("UPDATE customers SET current_balance = ? WHERE id = ?", [Number(sender.current_balance) + amount, receipent.id], (err, rows) =>{
                                                        if(err){
                                                            console.log(err);
                                                        }
                                                        else{
                                                            res.send("Transaction successful")
                                                        }
                                                    })
                                                }
                                            })
                                            
                                        }
                                    })
                                }
                            }
                            else{
                                res.send("Invalid sender's id or receipent's id")
                            }
                            
                        }
                    }) 
                    
                }
            }) 
        }
    })
});

app.get('/transaction', (req, res) => {

    pool.getConnection((err, connection) => {
        if(err){
            console.log("throw err");
        }
        
        else{
            console.log("DB connection succeeded");
            connection.query("SELECT * FROM transaction", (err, rows) => {
                connection.release()
                if(err)
                {
                    console.log(err);
                }
                else{
                    res.render("transaction", {transaction:rows});
                    
                }
            }) 
        }
    })
});

app.use(express.static(staticPath));
 

app.listen(port, () => {
    console.log(`Listing the port at ${port}`);
})