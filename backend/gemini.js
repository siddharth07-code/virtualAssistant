import axios from "axios";
const geminiResponse = async (command, assistantName, userName) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    const apiUrl = "https://generativelanguage.googleapis.com/v1beta/interactions"
    const prompt = `You are a virtual assistant named ${assistantName} created by ${userName}.
    You are not Google. You will now behave like a voice-enabled assistant.
    
    Your task is to understand the user's natural language input and respond with a JSON object like this:
    
    {
      "type": "general" | "google-search" | "youtube-search" | "youtube-play" | 
      "get-time" | "get-date" | "get-day" | "get-month" | "calculator-open" | "instagram-open" | "facebook-open" | "weather-show",
      "userinput": "<original user input>" {only remove your name from userinput if exists} and agar kisi ne google ya youtube pe kuch search karne ko bola hai toh userInput main only wo search wala text jaye,
      "response": "<a short spoken response to read out load to the users>"
    }
    Instructions:
    - "type": determine the intent of the user.
    - "userInput": original sentence the user spoke.
    - "response": A short voice-friendly reply, e.g., "Sure, playing it now", "Here's what I found", "Today is Tuesday", etc.  

    Type meanings:
    - "general": if it's a factual or informational question. aur agar koi aisa question puchta hai jiska answer tumhe pata hai usko bhi general ki category main rakho bas concise answer dena
    - "google-search": if user wants to search something on Google.
    - "youtube-search": if user wants to search something on YouTube.
    - "youtube-play": if user wants to directly play a video or song.
    - "calculator-open": if user wants to open a calculator.
    - "instagram-open": if user wants to open instagram.
    - "facebook-open": if user wants to open facebook.
    - "weather-show": if user wants to know weather.
    - "get-time": if user asks for current time.
    - "get-date": if user asks for today's date.
    - "get-day": if user asks what day it is.
    - "get-month": if user asks for the current month.

    Important:
    - Use ${userName}agar koi puche tumhe kisne banaya
    - Only respond with the JSON object, nothing else.

    now your userInput- ${command}
    `;

    const result = await axios.post(
      apiUrl,
      {
        model: "gemini-3.6-flash",
        input: prompt,
        generation_config:{
          thinking_level: "high"
        }
      },
      {
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
      }
    );
    const finalStep = result.data.steps.find((step) => step.type === "model_output")

    return finalStep.content[0].text

  } catch (error) {
    console.error("Error fetching Gemini response:", error?.response?.data || error.message);
  }
};

export default geminiResponse;