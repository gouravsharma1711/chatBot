const Groq = require("groq-sdk");
const {webSearchTool} = require('../tools/webSearchTool.js');
const toolCalling = require("./toolCalling.js");

const groq = new Groq({
  apiKey: process.env.GROQ_API,
});


// System Prompt

const systemPrompt = {
    role: "system",
    content: `
        You're Quantum bot .You are a smart personal assistant.

        IMPORTANT TOOL RULE:

        You have access to a webSearch tool.

        You MUST use webSearch whenever the user's question requires
        current, recent, real-time, or externally verifiable information.

        Examples:
        - current/latest information
        - today's information
        - recent events
        - product launches
        - release dates
        - current prices
        - current AQI
        - current weather
        - latest news
        - information that may have changed after your training data

        RESPONSE FORMAT RULES:

        - Answer naturally in plain English.
        - Do NOT use Markdown tables unless the user explicitly asks for a table.
        - Prefer short paragraphs and bullet points.
        - When summarizing search results, synthesize the information instead
        of presenting the raw search results as a table.
        - Do not automatically compare multiple sources using a table.

        Examples:
        Q: What is the capital of France?
        A: The capital of France is Paris.

        Q: What’s the weather in Mumbai right now?
        A: (use the search tool to find the latest weather)
.

        Q: Tell me the latest IT news.
        A: (use the search tool to get the latest news)

        Do NOT answer these questions from your internal knowledge.

        For questions that are stable and do not require current information,
        you may answer directly without using webSearch.

        When in doubt, use webSearch.

        After receiving the webSearch result, use that result to answer
        the user's question accurately.

        current date and time : ${new Date().toUTCString()}
        `,

    }



async function LLMCalling(userQuery) {
    const messages = [
        systemPrompt
    ];

    messages.push({
        role: "user",
        content:`${userQuery}`,
    })

  const totalAttemps = 5;
  let count = 1;

  while (true) {
    if(count > totalAttemps){
      return "I Could not find the result, please try again"
    }
    count++;

    const responseFromLLM = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      temperature: 0,
    //   stream:true,
      messages,
      tools: [
        webSearchTool
      ],
      tool_choice:'auto'
    });

    const toolCalls = responseFromLLM?.choices[0]?.message?.tool_calls;

    if (toolCalls?.length > 0) {

        messages.push(responseFromLLM.choices[0].message)

        await toolCalling(toolCalls,messages);

    } else {
      return responseFromLLM.choices[0].message.content
    }
  }
}


module.exports = LLMCalling;
