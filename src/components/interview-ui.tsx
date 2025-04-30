"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { provideAiFeedback } from '@/ai/flows/provide-feedback';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Mic, StopCircle, Send, ChevronRight, AlertCircle, MessageSquareText } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AnimatePresence, motion } from 'framer-motion';

const interviewQuestions = [
  "Tell me about yourself.",
  "What are your strengths?",
  "What are your weaknesses?",
  "Why do you want to work here?",
  "Describe a challenging situation you faced and how you handled it.",
  "Where do you see yourself in 5 years?",
  "Why should we hire you?",
];

// Check for SpeechRecognition API
const SpeechRecognition =
  (typeof window !== 'undefined' && window.SpeechRecognition) ||
  (typeof window !== 'undefined' && window.webkitSpeechRecognition);

export function InterviewUI() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (SpeechRecognition) {
      setIsSpeechSupported(true);
      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let currentInterimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            currentInterimTranscript += event.results[i][0].transcript;
          }
        }
        setTranscript((prev) => prev + finalTranscript);
        setInterimTranscript(currentInterimTranscript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
      };

      recognition.onend = () => {
        // Only stop if explicitly stopped, not automatically
        // This allows continuous recording until stop button is pressed
      };

    } else {
      setIsSpeechSupported(false);
      setError("Speech recognition is not supported in your browser. Please type your answer.");
    }

    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startRecording = useCallback(() => {
    if (recognitionRef.current && !isRecording) {
      setTranscript('');
      setInterimTranscript('');
      setFeedback('');
      setError(null);
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
         console.error('Error starting speech recognition:', e);
         setError('Could not start recording. Please ensure microphone permissions are granted.');
         setIsRecording(false); // Ensure state is reset
      }
    }
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setInterimTranscript(''); // Clear interim transcript on stop
    }
  }, [isRecording]);

  const handleGetFeedback = async () => {
    if (!transcript) {
      setError("Please provide an answer before getting feedback.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setFeedback('');

    try {
      const result = await provideAiFeedback({
        question: interviewQuestions[currentQuestionIndex],
        answer: transcript,
      });
      setFeedback(result.feedback);
    } catch (error) {
      console.error('Error getting AI feedback:', error);
      setError('Failed to get feedback. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < interviewQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setTranscript('');
      setInterimTranscript('');
      setFeedback('');
      setError(null);
      if (isRecording) {
        // Optionally stop recording or let it continue for the next question
        stopRecording();
      }
    }
  };

   const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isRecording) {
      setTranscript(event.target.value);
    }
  };

  const cardVariants = {
    enter: {
      opacity: 0,
      y: 20,
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    center: {
      zIndex: 1,
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    exit: {
      zIndex: 0,
      opacity: 0,
      y: -20,
      transition: { duration: 0.3, ease: "easeInOut" }
    }
  };


  return (
    <div className="flex flex-col items-center min-h-screen w-full max-w-2xl mx-auto py-12">
       <h1 className="text-3xl font-bold mb-8 text-foreground">Voice Interviewer</h1>
       <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial="enter"
          animate="center"
          exit="exit"
          variants={cardVariants}
          className="w-full"
        >
          <Card className="w-full shadow-lg rounded-lg overflow-hidden">
            <CardHeader className="bg-muted/50 border-b">
              <CardTitle className="text-xl font-semibold text-foreground">
                Question {currentQuestionIndex + 1} of {interviewQuestions.length}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <p className="text-lg text-foreground">{interviewQuestions[currentQuestionIndex]}</p>

              <div className="space-y-2">
                <label htmlFor="answer" className="text-sm font-medium text-muted-foreground">Your Answer:</label>
                <Textarea
                  id="answer"
                  placeholder={isRecording ? "Recording..." : "Speak or type your answer here..."}
                  value={transcript + interimTranscript}
                  onChange={handleTextChange}
                  rows={6}
                  className="resize-none focus-visible:ring-primary"
                  aria-label="Your Answer"
                  disabled={isRecording}
                />
                 {interimTranscript && <p className="text-sm text-muted-foreground italic">Listening: {interimTranscript}</p>}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

             <div className="flex flex-col sm:flex-row gap-2 justify-between items-center">
                <div className="flex gap-2">
                   {isSpeechSupported && (
                     <>
                       <Button
                         onClick={startRecording}
                         disabled={isRecording || isLoading}
                         variant="outline"
                         aria-label="Start Recording"
                       >
                         <Mic className="mr-2 h-4 w-4" />
                         Start Recording
                       </Button>
                       <Button
                         onClick={stopRecording}
                         disabled={!isRecording || isLoading}
                         variant="destructive"
                         aria-label="Stop Recording"
                       >
                         <StopCircle className="mr-2 h-4 w-4" />
                         Stop
                       </Button>
                     </>
                    )}
                    {!isSpeechSupported && (
                         <Button
                         onClick={handleGetFeedback}
                         disabled={isLoading || isRecording || !transcript}
                         aria-label="Get Feedback"
                       >
                         {isLoading ? (
                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                         ) : (
                           <Send className="mr-2 h-4 w-4" />
                         )}
                         Get Feedback
                       </Button>
                    )}
                 </div>
                 {isSpeechSupported && (
                      <Button
                        onClick={handleGetFeedback}
                        disabled={isLoading || isRecording || !transcript}
                        aria-label="Get Feedback"
                      >
                        {isLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-4 w-4" />
                        )}
                        Get Feedback
                      </Button>
                 )}
              </div>


              {feedback && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4"
                  aria-live="polite"
                >
                  <Alert className="bg-secondary/50 border-primary">
                     <MessageSquareText className="h-5 w-5 text-primary" />
                    <AlertTitle className="text-primary font-semibold">AI Feedback</AlertTitle>
                    <AlertDescription className="text-foreground">{feedback}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </CardContent>
            <CardFooter className="bg-muted/50 border-t p-4 flex justify-end">
              <Button
                onClick={goToNextQuestion}
                disabled={currentQuestionIndex >= interviewQuestions.length - 1 || isLoading || isRecording}
                variant="default"
                aria-label="Next Question"
              >
                Next Question
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
