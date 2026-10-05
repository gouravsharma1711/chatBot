const express = require('express');
const app = express();
const cors = require('cors')

console.log("NODE_ENVIRONMENT : ",process.env.NODE_ENVIRONMENT);


// middlewares
app.use(cors())
app.use(express.json());



app.get('/testing',(req,res)=>{
    res.json({
        message:"Testing Successfull"
    })
})

app.post('/chat',(req,res)=>{
    const {msg} = req.body; 




})

const port = process.env.PORT
app.listen(port,()=>{
    console.log(`The Server is Running on Port ${port}`);
    
})
