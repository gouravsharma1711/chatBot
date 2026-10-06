const app = require('./src/App.js');


const port = process.env.PORT
app.listen(port,()=>{
    console.log(`The Server is Running on Port ${port}`);
    
})
