const { tavily } = require('@tavily/core');

const tvly = tavily({
    apiKey: process.env.TAVILY_API_KEY
})

const webSearchTool = {
    type:'function',
    function:{
        name:'webSearch',
        description:"Use to Get information From the Web",
        parameters:{
            type:'object',
            properties:{
                query:{
                    type:"string"
                }
            },
            required:["query"]
        }
    }
}


async function webSearchToolCallingFunction({query}){
    const response = await tvly.search(
        query,
        {
            includeAnswer: "advanced",
            searchDepth: "advanced",
            maxResults: 3
        }
    );
    
    return response.results.map((result)=>result.content).join('\n\n');
}

module.exports = {
    webSearchToolCallingFunction,
    webSearchTool
}