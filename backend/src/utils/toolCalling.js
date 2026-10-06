const { 
    webSearchToolCallingFunction,
 } = require("../tools/webSearchTool.js");


async function toolCalling(toolCalls,messages){

    for(const tool of toolCalls){
        const functionName = tool.function.name;
        const functionParams = tool.function.arguments;

        if(functionName ==='webSearch'){
            const toolResponse = await webSearchToolCallingFunction(
                JSON.parse(functionParams),
            );

            messages.push({
                role: "tool",
                tool_call_id: tool.id,
                name: functionName,
                content: toolResponse,
            })
        }



    }

}

module.exports = toolCalling;