const app = require('./src/App.js');
require('./src/utils/LLM.js');


const port = process.env.PORT
app.listen(port,()=>{
    console.log(`The Server is Running on Port ${port}`);
    
})
