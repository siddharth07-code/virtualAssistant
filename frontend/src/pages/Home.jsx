import React, { useContext, useEffect, useRef, useState } from 'react'
import { userDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import aiImg from "../assets/ai.gif"
import { GiHamburgerMenu } from "react-icons/gi"
import { RxCross2 } from "react-icons/rx"
import userImg from "../assets/user.gif"

function Home() {
  const { userData, serverUrl, setUserData, getGeminiResponse } = useContext(userDataContext)
  const navigate = useNavigate()
  const [listening, setListening] = useState(false)
  
  const [userText, setUserText] = useState("")
  const [aiText, setAiText] = useState("")
  
  const isSpeakingRef = useRef(false)
  const recognitionRef = useRef(null)
  const [ham, setHam] = useState(false)
  const isRecognizingRef = useRef(false)
  const hasGreeted = useRef(false)
  const synth = window.speechSynthesis

  const handleLogOut = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/logout`, { withCredentials: true })
      setUserData(null)
      navigate("/signin")
    } catch (error) {
      setUserData(null)
      navigate("/signin")
    }
  }

  const startRecognition = () => {
    if (!isSpeakingRef.current && !isRecognizingRef.current && recognitionRef.current) {
      try {
        recognitionRef.current.start()
        setListening(true)
      } catch (error) {
        if (!error.message.includes("start")) {
          console.error(error)
        }
      }
    }
  }

  const speak = (text) => {
    if (!text) return;
    const utterence = new SpeechSynthesisUtterance(text)
    
    const voices = window.speechSynthesis.getVoices()
    const jarvisVoice = voices.find(v => v.name.includes('Google UK English Male')) || 
                        voices.find(v => v.name.includes('Google US English')) ||
                        voices.find(v => v.lang === 'en-US')
                        
    if (jarvisVoice) utterence.voice = jarvisVoice

    isSpeakingRef.current = true
    
    utterence.onend = () => {
      setAiText("")
      isSpeakingRef.current = false
      setTimeout(() => {
         startRecognition()
      }, 800)
    }
    
    synth.cancel()
    synth.speak(utterence)
  }

  const handleCommand = (data, transcript) => {
    const { type, userInput, response } = data
    speak(response)

    const assistantName = userData?.assistantName ? userData.assistantName.toLowerCase() : 'jarvis'
    let cleanTranscript = transcript.toLowerCase().replace(assistantName, "").trim()

    if (type === 'google-search') {
      let queryText = cleanTranscript
        .replace(/^search(\s+for|\s+about)?\s+/i, "")
        .replace(/\s+on google$/i, "")
        .trim()
      
      if (!queryText) queryText = userInput || cleanTranscript
      
      if (queryText) {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(queryText)}`, '_blank')
      }
    }
    else if (type === 'calculator-open') {
      window.open(`https://www.google.com/search?q=calculator`, '_blank')
    }
    else if (type === 'instagram-open') {
      window.open(`https://www.instagram.com/`, '_blank')
    }
    else if (type === 'facebook-open') {
      window.open(`https://www.facebook.com/`, '_blank')
    }
    else if (type === 'weather_show') {
      window.open(`https://www.google.com/search?q=weather`, '_blank')
    }
    else if (type === 'youtube-search' || type === 'youtube-play') {
      let queryText = cleanTranscript
        .replace(/^(search|play)(\s+youtube)?(\s+for)?\s+/i, "")
        .replace(/\s+on youtube$/i, "")
        .trim()

      if (!queryText) queryText = userInput || cleanTranscript

      if (queryText) {
        window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(queryText)}`, '_blank')
      }
    }
  }

  useEffect(() => {
    const greet = () => {
      if (!userData?.name || hasGreeted.current) return;
      
      const greetingText = `Greetings ${userData.name}, how may I assist you today?`
      const greeting = new SpeechSynthesisUtterance(greetingText)
      const voices = window.speechSynthesis.getVoices()
      
      const jarvisVoice = voices.find(v => v.name.includes('Google UK English Male')) || 
                          voices.find(v => v.name.includes('Google US English')) ||
                          voices.find(v => v.lang === 'en-US')
                          
      if (jarvisVoice) greeting.voice = jarvisVoice
      
      setAiText(greetingText)
      window.speechSynthesis.speak(greeting)
      hasGreeted.current = true
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      greet()
    } else {
      window.speechSynthesis.onvoiceschanged = greet
    }
  }, [userData?.name])

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.lang = 'en-US'
    recognition.interimResults = false

    recognitionRef.current = recognition
    let isMounted = true

    const startTimeout = setTimeout(() => {
      if (isMounted && !isSpeakingRef.current && !isRecognizingRef.current) {
        try {
          recognition.start()
        } catch (e) {
          if (e.name !== "InvalidStateError") {
            console.error(e)
          }
        }
      }
    }, 1000)

    recognition.onstart = () => {
      isRecognizingRef.current = true
      setListening(true)
    }
    
    recognition.onend = () => {
      isRecognizingRef.current = false
      setListening(false)
      
      if (isMounted && !isRecognizingRef.current && !isSpeakingRef.current) {
        setTimeout(() => {
          if (isMounted && !isSpeakingRef.current) {
            try {
              recognition.start()
            } catch (e) {
              if (e.name !== "InvalidStateError") console.error(e)
            }
          }
        }, 1000)
      }
    }  

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.warn("Speech recognition error:", event.error)
      }
      
      isRecognizingRef.current = false
      setListening(false)
      
      if (event.error !== "aborted" && isMounted && !isSpeakingRef.current) {
        setTimeout(() => {
          if (isMounted && !isSpeakingRef.current) {
            try {
              recognition.start()
            } catch (e) {
              if (e.name !== "InvalidStateError") console.error(e)
            }
          }
        }, 1000)
      }
    }  

    recognition.onresult = async (e) => {
      if (!e.results.length) return;
      
      const transcript = e.results[e.results.length - 1][0].transcript.trim()
      const assistantName = userData?.assistantName ? userData.assistantName.toLowerCase() : "jarvis"

      if (transcript.toLowerCase().includes(assistantName)) {
        setAiText("")
        setUserText(transcript)
        recognition.stop()
        isRecognizingRef.current = false
        setListening(false)
        
        let cleanTranscript = transcript.toLowerCase().replace(assistantName, "").trim()
        let handledLocally = false;

        const executeAction = (text, url) => {
          setAiText(text)
          speak(text)
          if (url) window.open(url, '_blank')
          setUserText("")
          handledLocally = true
        }

        if (cleanTranscript.includes("weather")) {
          executeAction("Checking the weather.", "https://www.google.com/search?q=weather")
        } 
        else if (cleanTranscript.includes("open ")) {
          const app = cleanTranscript.split("open ")[1].trim()
          if (app.includes("youtube")) executeAction("Opening YouTube.", "https://www.youtube.com")
          else if (app.includes("facebook")) executeAction("Opening Facebook.", "https://www.facebook.com")
          else if (app.includes("instagram")) executeAction("Opening Instagram.", "https://www.instagram.com")
          else if (app.includes("calculator")) executeAction("Opening Calculator.", "https://www.google.com/search?q=calculator")
          else executeAction(`Searching for ${app}.`, `https://www.google.com/search?q=${encodeURIComponent(app)}`)
        } 
        else if (cleanTranscript.startsWith("play ") || (cleanTranscript.startsWith("search ") && cleanTranscript.includes("youtube"))) {
          const query = cleanTranscript.replace(/^(search|play)(\s+youtube)?(\s+for)?\s+/i, "").replace(/\s+on youtube$/i, "").trim()
          executeAction(`Searching YouTube for ${query}.`, `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`)
        } 
        else if (cleanTranscript.startsWith("search ")) {
          const query = cleanTranscript.replace(/^search(\s+for|\s+about)?\s+/i, "").replace(/\s+on google$/i, "").trim()
          executeAction(`Searching Google for ${query}.`, `https://www.google.com/search?q=${encodeURIComponent(query)}`)
        }

        if (handledLocally) return;

        const data = await getGeminiResponse(transcript)
        handleCommand(data, transcript)
        setAiText(data?.response)
        setUserText("")
      }
    }
    
    return () => {
      isMounted = false
      clearTimeout(startTimeout)
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setListening(false)
      isRecognizingRef.current = false
    }
  }, [userData?.assistantName])

  return (
    <div className='w-full h-[100vh] bg-gradient-to-t from-[black] to-[#02023d] flex justify-center items-center flex-col gap-[15px] overflow-hidden'>
      <GiHamburgerMenu className='lg:hidden text-white absolute top-[20px] right-[20px] w-[25px] h-[25px] cursor-pointer' onClick={() => setHam(true)}/>
      
      <div className={`absolute lg:hidden top-0 w-full h-full bg-[#00000023] backdrop-blur-lg p-[20px] flex flex-col gap-[2px] items-start ${ham ? "translate-x-0" : "translate-x-full"} transition-transform z-50`}>
        <RxCross2 className='text-white absolute top-[20px] right-[20px] w-[25px] h-[25px] cursor-pointer' onClick={() => setHam(false)}/>  

        <button className='min-w-[150px] h-[60px] text-black font-semibold bg-white rounded-full text-[19px] cursor-pointer' onClick={handleLogOut}>Log Out</button>

        <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold bg-white rounded-full text-[19px] px-[20px] py-[10px] cursor-pointer' onClick={() => navigate("/customize")}>Customize Your Assistant</button>

        <div className='w-full h-[2px] bg-gray-400 my-[20px] lg:hidden'></div>
        
        <h1 className='text-white font-semibold text-[19px] mb-[10px] lg:hidden'>History</h1>

        <div className='w-full flex-1 max-h-[60vh] gap-[10px] overflow-y-auto flex flex-col pb-[20px] pr-2 lg:hidden'>
          {userData?.history?.slice().reverse().map((his, index) => (
            <p key={index} className='w-full text-gray-200 text-[16px] bg-white/10 px-4 py-2 rounded-lg break-words'>
              {his}
            </p>
          ))}
        </div>
      </div>
      
      <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold absolute hidden lg:block top-[20px] right-[20px] bg-white rounded-full text-[19px] cursor-pointer' onClick={handleLogOut}>Log Out</button>
      <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold bg-white absolute hidden lg:block top-[100px] right-[20px] rounded-full text-[19px] px-[20px] py-[10px] cursor-pointer' onClick={() => navigate("/customize")}>Customize Your Assistant</button>

      <div className='w-[300px] h-[400px] flex justify-center items-center overflow-hidden rounded-4xl shadow-lg'>
        <img src={userData?.assistantImage} alt="Assistant" className='h-full object-cover'/>
      </div>
      
      <h1 className='text-white text-[18px] font-semibold'>Greetings! I'm {userData?.assistantName || "loading..."}</h1>
      
      {!aiText && <img src={userImg} alt="Listening" className='w-[250px]' />}
      {aiText && <img src={aiImg} alt="Speaking" className='w-[250px]' />}

      <h1 className='text-white text-center px-4 max-w-2xl'>
        {userText ? userText : aiText ? aiText : null}
      </h1>
    </div>
  )
}

export default Home