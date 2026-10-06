const LLMCalling = require('../utils/LLM.js')

const testingController = (req,res)=>{
    res.status(200).json({
        message:"Testing route Working fine",
        success:true
    })
}


const chatBotChatsController = async(req,res)=>{
    
    const {userMessage} = req.body;

    const response = await LLMCalling(userMessage);
    

    res.status(200).json({
        success:true,
        message:"Data Fetched Successfully",
        aiResponse:response
    })
}

module.exports = {
    testingController,
    chatBotChatsController
}