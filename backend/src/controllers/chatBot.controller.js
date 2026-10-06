const LLMCalling = require('../utils/LLM.js')

function errorHandler(message ='Internal Server Error' ,status=500) {
    const error = new Error(message)
    error.statusCode = status;
    return error;
}   

const chatBotChatsController = async(req,res)=>{
    
    try {
        let {userMessage} = req.body;
        
        userMessage = userMessage.trim();
        if(!userMessage){
            throw errorHandler("Please enter a message before sending.",400);
        }
        

        const response = await LLMCalling(userMessage);

        res.status(200).json({
            success:true,
            message:"Data Fetched Successfully",
            aiResponse:response
        })
    } catch (error) {
        res.status(error.statusCode || 500 ).json({
            success:false,
            message:error.message || "Internal Server Error",
            aiResponse:"",
            stack:error.stack
        })   
    }
}

module.exports = {
    chatBotChatsController
}