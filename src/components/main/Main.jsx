import React, { useContext, useRef, useState, useEffect, useMemo } from "react";
import "./main.css";
import { assets } from "../../assets/assets";
import { Context } from "../../context/Context";
import { useAuth0 } from "@auth0/auth0-react";
import "prismjs/themes/prism.css";
import prism from "prismjs";
import ReactMarkdown from "react-markdown";
import "remixicon/fonts/remixicon.css";
import { useCallback } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import remarkGfm from "remark-gfm"; // Import GitHub-flavored markdown plugin
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const Main = () => {
  const ResultDataRef = useRef(null);
  const hiddenTextareaRef = useRef(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyCodeSuccess, setCopyCodeSuccess] = useState(false);
  const [showDelayedResult, setShowDelayedResult] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const listeningTimeoutRef = useRef(null); // Ref to hold the timeout for auto-stop
  const [isSpeaking, setIsSpeaking] = useState(false); // Track if speaking is active
  const [currentIndex, setCurrentIndex] = useState(0); // Track the current word index
  const [isDarkMode, setIsDarkMode] = useState(true); // State to track dark mode
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weatherData, setWeatherData] = useState(null);
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second

    return () => clearInterval(timer); // Cleanup on unmount
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const apiKey = "2VXNCLWCN2QYBZTHRJU89EP"; // Replace with your OpenWeather API key
          const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;

          fetch(weatherApiUrl)
            .then((response) => response.json())
            .then((data) => {
              setWeatherData(data);
            })
            .catch(() => setLocationError("Unable to fetch weather data"));
        },
        () => setLocationError("Location access denied")
      );
    } else {
      setLocationError("Geolocation not supported");
    }
  }, []);

  const formatTime = (date) => {
    const options = { hour: "2-digit", minute: "2-digit", second: "2-digit" };
    return date.toLocaleTimeString(undefined, options);
  };

  const formatDate = (date) => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString(undefined, options);
  };

  const copyResultDataToClipboard = useCallback(() => {
    const textOutput = Array.from(
      ResultDataRef.current?.querySelectorAll(".result-text p") || []
    )
      .map((p) => p.innerText)
      .join("\n"); // Extract all text paragraphs inside the result-text div
    navigator.clipboard.writeText(textOutput).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // Clear the message after 2 seconds
    });
  }, []);

  const copyCodeToClipboard = useCallback((code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopyCodeSuccess(true);
      setTimeout(() => setCopyCodeSuccess(false), 2000);
    });
  }, []);

  const detectLanguage = (text) => {
    // Simple language detection based on Unicode ranges
    if (/[\u4E00-\u9FFF]/.test(text)) return "zh"; // Chinese
    if (/[\u0400-\u04FF]/.test(text)) return "ru"; // Russian
    if (/[\u0600-\u06FF]/.test(text)) return "ar"; // Arabic
    if (/[\u0900-\u097F]/.test(text)) return "hi"; // Hindi
    return "en"; // Default to English
  };

  const {
    onSent,
    recentPrompt,
    showResult,
    loading,
    resultData,
    setResultData,
    setInput,
    input,
  } = useContext(Context);

  const { loginWithRedirect, isAuthenticated, logout, user } = useAuth0();

  const handleKeyUp = (e) => {
    if (e.key === "Enter") {
      onSent();
      setInput("");
    }
  };

  useEffect(() => {
    if (showResult) {
      const timer = setTimeout(() => setShowDelayedResult(true), 300); // Add a delay of 300ms
      return () => clearTimeout(timer);
    } else {
      setShowDelayedResult(false);
    }
  }, [showResult]);

  const formattedResultData = useMemo(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(resultData, "text/html");
    return doc.body.textContent || "";
  }, [resultData]);

  useEffect(() => {
    prism.highlightAll();
  }, [resultData]);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const startListening = () => {
    if (!browserSupportsSpeechRecognition) {
      console.error("Browser doesn't support speech recognition.");
      return;
    }

    SpeechRecognition.startListening({ continuous: true, language: "en-US" });
    setIsListening(true);
    resetTranscript(); // Clear the transcript to avoid duplication

    // Automatically stop listening after 10 seconds
    if (listeningTimeoutRef.current) {
      clearTimeout(listeningTimeoutRef.current);
    }
    listeningTimeoutRef.current = setTimeout(() => {
      stopListening();
    }, 10000); // Stop after 10 seconds
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
    setIsListening(false);
    resetTranscript(); // Clear the transcript after processing

    // Clear the timeout if it exists
    if (listeningTimeoutRef.current) {
      clearTimeout(listeningTimeoutRef.current);
      listeningTimeoutRef.current = null;
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  useEffect(() => {
    if (isListening) {
      setInput(transcript); // Update the input box in real-time with the transcript
    }
  }, [transcript, isListening]);

  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      console.error("Browser doesn't support speech recognition.");
    }
  }, [browserSupportsSpeechRecognition]);

  useEffect(() => {
    // Cleanup on component unmount
    return () => {
      SpeechRecognition.stopListening();
      resetTranscript();
      if (listeningTimeoutRef.current) {
        clearTimeout(listeningTimeoutRef.current);
      }
    };
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
    document.body.classList.toggle("light-mode", !isDarkMode); // Toggle class on body
  };

  const handleTalkback = () => {
    const textOutput = Array.from(
      ResultDataRef.current?.querySelectorAll(".result-text p") || []
    )
      .map((p) => p.innerText)
      .join(" "); // Extract all text paragraphs inside the result-text div

    if (isSpeaking) {
      window.speechSynthesis.cancel(); // Stop speaking if already active
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(textOutput);
      utterance.lang = "en-US"; // Set the language
      utterance.rate = 1; // Set the speaking rate (1 is normal speed)
      utterance.onend = () => {
        setIsSpeaking(false); // Reset state when speaking ends
      };
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>;
  }

  const quesRef = useRef(null);
  gsap.registerPlugin(useGSAP);

  useGSAP(() => {
    gsap.from(quesRef.current, {
      duration: 1,
      delay: 9,
      opacity: 0,
      y: 250,
      ease: "power4.out",
    });
  });

  return (
    <div className={`main ${isDarkMode ? "dark-mode" : "light-mode"}`}>
      <div className="nav">
        <main>Flow.ai</main>
        <div className="nav-r">
          <button onClick={toggleTheme} className="theme-toggle">
            {isDarkMode ? "Light Mode" : "Dark Mode"}
          </button>
          {isAuthenticated ? (
            <img src={user.picture} alt="" />
          ) : (
            <img src={assets.user_icon} alt="" />
          )}
          {isAuthenticated ? (
            <button
              onClick={() =>
                logout({ logoutParams: { returnTo: window.location.origin } })
              }
            >
              Log Out
            </button>
          ) : (
            <button onClick={() => loginWithRedirect()}>Log In</button>
          )}
        </div>
      </div>
      <div className="main-container">
        {!showDelayedResult ? (
          <>
            <div className="greet">
              <p>
                <span>Hello, {isAuthenticated ? user.name : "Developer"}</span>{" "}
                <b>👋</b>.
              </p>
              <p ref={quesRef}>How can I assist you today?</p>
            </div>
          </>
        ) : (
          <div className="result">
            <div className="result-title">
              {isAuthenticated ? (
                <img src={user.picture} alt="" />
              ) : (
                <img src={assets.user_icon} alt="" />
              )}
              <p>{recentPrompt}</p>
            </div>
            <div className="result-data">
              <div className="copy">
                <span>{copySuccess ? "Copied!" : "Copy All Text"}</span>
                <i
                  onClick={copyResultDataToClipboard}
                  className="ri-clipboard-fill"
                ></i>
              </div>
              <div
                className="talkback"
                style={{ position: "absolute", top: "0", right: "20px" }}
              >
                <button
                  onClick={handleTalkback}
                  style={{
                    backgroundColor: isSpeaking ? "#f0c040" : "#e0e0e0", // Change background color based on state
                    border: "none",
                    borderRadius: "50%",
                    padding: "10px",
                    cursor: "pointer",
                    transition: "background-color 0.3s ease", // Smooth transition
                  }}
                >
                  <i
                    className={
                      isSpeaking ? "ri-volume-mute-fill" : "ri-volume-up-fill"
                    }
                    style={{ fontSize: "20px", color: "#000" }}
                  ></i>
                </button>
              </div>
              {loading ? (
                <div className="loader">
                  <hr />
                  <hr />
                  <hr />
                </div>
              ) : (
                <>
                  <div className="result-text" ref={ResultDataRef}>
                    <ReactMarkdown
                      children={formattedResultData}
                      remarkPlugins={[remarkGfm]} // Enable GitHub-flavored markdown
                      components={{
                        p: ({ node, ...props }) => (
                          <p {...props} style={{ marginBottom: "10px" }} />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul
                            {...props}
                            style={{
                              paddingLeft: "20px",
                              marginBottom: "10px",
                            }}
                          />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol
                            {...props}
                            style={{
                              paddingLeft: "20px",
                              marginBottom: "10px",
                            }}
                          />
                        ),
                        li: ({ node, ...props }) => (
                          <li {...props} style={{ marginBottom: "5px" }} />
                        ),
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || "");
                          return !inline && match ? (
                            <div style={{ position: "relative" }}>
                              <pre
                                className={`language-${match[1]}`}
                                style={{
                                  overflow: "auto",
                                  width: "100%",
                                  color: "#000",
                                  backgroundColor: "#ffffff",
                                  boxSizing: "border-box",
                                  borderRadius: "6px",
                                }}
                              >
                                <code {...props} className={className}>
                                  {String(children).replace(/\n$/, "")}
                                </code>
                              </pre>
                              <button
                                className="copy-code-button"
                                onClick={() =>
                                  copyCodeToClipboard(
                                    String(children).replace(/\n$/, "")
                                  )
                                }
                              >
                                {copyCodeSuccess ? "Copied!" : "Copy Code"}
                              </button>
                            </div>
                          ) : (
                            <code {...props} className={className}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    />
                  </div>
                  <textarea
                    ref={hiddenTextareaRef}
                    style={{ position: "absolute", left: "-9999px" }}
                    readOnly
                  />
                </>
              )}
            </div>
          </div>
        )}
        {showDelayedResult && (
          <div className="search-box">
            <input
              onChange={(e) => setInput(e.target.value)}
              value={input}
              type="text"
              placeholder="Enter prompt here"
              onKeyUp={handleKeyUp}
            />
            <div className="send-mic">
              <button
                onClick={toggleListening}
                className={isListening ? "mic-active" : ""}
              >
                <img src={assets.mic_icon} alt="" />
              </button>
              {input ? (
                <img onClick={() => onSent()} src={assets.send_icon} alt="" />
              ) : null}
            </div>
          </div>
        )}
        <div className="bottom-info">
          Flow.ai may display inaccurate info, including about people, so
          double-check its responses. Your privacy and Flow.ai Apps
        </div>
        {!showDelayedResult && (
          <div className="search-box">
            <input
              onChange={(e) => setInput(e.target.value)}
              value={input}
              type="text"
              placeholder="Enter prompt here"
              onKeyUp={handleKeyUp}
            />
            <div>
              <button
                onClick={toggleListening}
                className={isListening ? "mic-active" : ""}
              >
                <img src={assets.mic_icon} alt="" />
              </button>
              {input ? (
                <img onClick={() => onSent()} src={assets.send_icon} alt="" />
              ) : null}
            </div>
          </div>
        )}
        {weatherData &&
          weatherData.weather &&
          Array.isArray(weatherData.weather) &&
          weatherData.weather.length > 0 && (
            <div className="weather-display">
              <img
                src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`}
                alt={weatherData.weather[0].description}
                className="weather-icon"
              />
              <div className="weather-info">
                <p>{weatherData.name}</p>
                <p>{Math.round(weatherData.main.temp)}°C</p>
                <p>{weatherData.weather[0].description}</p>
              </div>
            </div>
          )}
        {locationError && (
          <div className="weather-display">{locationError}</div>
        )}
        <div className="time-display">
          <p className="time">{formatTime(currentTime)}</p>
          <p className="date">{formatDate(currentTime)}</p>
        </div>
      </div>
    </div>
  );
};

export default Main;
