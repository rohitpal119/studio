"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { provideAiFeedback } from '@/ai/flows/provide-feedback';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Mic, StopCircle, Send, ChevronRight, AlertCircle, MessageSquareText, Filter } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AnimatePresence, motion } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { interviewQuestionsData, jobRoles, companies, difficulties, type InterviewQuestion, type JobRole, type Company, type Difficulty } from '@/lib/interview-data';

// Check for SpeechRecognition API
const SpeechRecognition =
  (typeof window !== 'undefined' && window.SpeechRecognition) ||
  (typeof window !== 'undefined' && window.webkitSpeechRecognition);

export function InterviewUI() {
  const [selectedRole, setSelectedRole] = useState<JobRole | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [filteredQuestions, setFilteredQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false); // For feedback loading
  const [isFiltering, setIsFiltering] = useState(false); // For question filtering
  const [error, setError] = useState<string | null>(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [showFilters, setShowFilters] = useState(true); // Show filters initially

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
        setError(`Speech recognition error: ${event.error}. Please ensure microphone permissions are granted and try again.`);
        setIsRecording(false);
      };

      recognition.onend = () => {
        // Prevent automatic restart if explicitly stopped
        if (isRecording) {
           // console.log("Recognition ended unexpectedly, possibly due to silence or network issue.");
           // You might want to inform the user or attempt restart here if needed
           // For now, just ensure the recording state is false
           // setIsRecording(false); // Consider if auto-restart is desired behavior
        }
      };

    } else {
      setIsSpeechSupported(false);
      // Don't set error here, let user type if not supported
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Removed isRecording from dependency array to avoid recreation on state change

  // Filter questions when selections change
  useEffect(() => {
    if (selectedRole && selectedCompany && selectedDifficulty) {
      setIsFiltering(true);
      setError(null); // Clear previous errors
      const filtered = interviewQuestionsData.filter(q =>
        q.role.includes(selectedRole) &&
        q.company.includes(selectedCompany) &&
        q.difficulty === selectedDifficulty
      );
      // Add generic questions matching difficulty and role/company (if applicable to all)
      const genericFiltered = interviewQuestionsData.filter(q =>
         q.difficulty === selectedDifficulty &&
         q.role.includes(selectedRole) && // Ensure role matches
         q.company.length === companies.length // Check if it's generic across companies
      );
       // Combine and remove duplicates (by id)
       const combined = [...filtered, ...genericFiltered];
       const uniqueQuestions = Array.from(new Map(combined.map(item => [item.id, item])).values());


      if (uniqueQuestions.length === 0) {
        setError(`No questions found for ${selectedRole}, ${selectedCompany}, ${selectedDifficulty}. Please adjust filters.`);
      }
      setFilteredQuestions(uniqueQuestions);
      setCurrentQuestionIndex(0); // Reset index when filters change
      resetInterviewState(); // Clear answer/feedback
      setShowFilters(false); // Hide filters after selection
      setIsFiltering(false);
    } else {
       setFilteredQuestions([]); // Clear questions if filters are not complete
       setShowFilters(true); // Show filters if not complete
    }
  }, [selectedRole, selectedCompany, selectedDifficulty]);


  const startRecording = useCallback(() => {
    if (recognitionRef.current && !isRecording && isSpeechSupported) {
      setTranscript('');
      setInterimTranscript('');
      setFeedback('');
      setError(null);
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
         console.error('Error starting speech recognition:', e);
         setError('Could not start recording. Please ensure microphone permissions are granted and refresh the page.');
         setIsRecording(false);
      }
    } else if (!isSpeechSupported) {
         setError("Speech recognition is not supported in your browser. Please type your answer.");
    }
  }, [isRecording, isSpeechSupported]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current && isRecording) {
       setIsRecording(false); // Set state immediately
       recognitionRef.current.stop();
       setInterimTranscript(''); // Clear interim transcript on stop
    }
  }, [isRecording]);

  const resetInterviewState = () => {
     setTranscript('');
     setInterimTranscript('');
     setFeedback('');
     setError(null);
     if (isRecording) {
        stopRecording();
     }
  }

  const handleGetFeedback = async () => {
    const currentAnswer = transcript || document.getElementById('answer')?.value; // Get value from textarea if typed

    if (!currentAnswer) {
      setError("Please provide an answer before getting feedback.");
      return;
    }
    if (!selectedRole || !selectedCompany || !selectedDifficulty) {
       setError("Please select Role, Company, and Difficulty first.");
       return;
    }
    if(filteredQuestions.length === 0) {
        setError("No questions loaded. Please check your filter selections.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setFeedback('');

    try {
      const result = await provideAiFeedback({
        question: filteredQuestions[currentQuestionIndex].question,
        answer: currentAnswer, // Use potentially typed answer
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
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      resetInterviewState();
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

  const currentQuestion = filteredQuestions[currentQuestionIndex];

  return (
    <div className="flex flex-col items-center min-h-screen w-full max-w-2xl mx-auto py-12 px-4">
       <h1 className="text-3xl font-bold mb-8 text-foreground">AI Interview Practice</h1>

       <Card className="w-full shadow-lg rounded-lg overflow-hidden mb-6">
          <CardHeader className="bg-muted/50 border-b p-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-semibold text-foreground">
                  Interview Filters
                </CardTitle>
                 <Button variant="ghost" size="icon" onClick={() => setShowFilters(!showFilters)} aria-label="Toggle Filters">
                    <Filter className="h-5 w-5" />
                 </Button>
              </div>
          </CardHeader>
          {showFilters && (
            <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <Label htmlFor="role-select">Role</Label>
                        <Select onValueChange={(value) => setSelectedRole(value as JobRole)} value={selectedRole ?? ""}>
                        <SelectTrigger id="role-select" disabled={isFiltering}>
                            <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                        <SelectContent>
                            {jobRoles.map(role => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="company-select">Company</Label>
                        <Select onValueChange={(value) => setSelectedCompany(value as Company)} value={selectedCompany ?? ""}>
                        <SelectTrigger id="company-select" disabled={isFiltering}>
                            <SelectValue placeholder="Select Company" />
                        </SelectTrigger>
                        <SelectContent>
                            {companies.map(company => (
                            <SelectItem key={company} value={company}>{company}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="difficulty-select">Difficulty</Label>
                        <Select onValueChange={(value) => setSelectedDifficulty(value as Difficulty)} value={selectedDifficulty ?? ""}>
                        <SelectTrigger id="difficulty-select" disabled={isFiltering}>
                            <SelectValue placeholder="Select Difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                            {difficulties.map(difficulty => (
                            <SelectItem key={difficulty} value={difficulty}>{difficulty}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                </div>
                 {isFiltering && <div className="flex items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading questions...</div>}
            </CardContent>
          )}
       </Card>


       {error && !showFilters && ( // Show general errors if filters are hidden
             <Alert variant="destructive" className="mb-6">
               <AlertCircle className="h-4 w-4" />
               <AlertTitle>Error</AlertTitle>
               <AlertDescription>{error}</AlertDescription>
             </Alert>
        )}

       {filteredQuestions.length > 0 && currentQuestion ? (
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
                    Question {currentQuestionIndex + 1} of {filteredQuestions.length}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <p className="text-lg text-foreground">{currentQuestion.question}</p>

                  <div className="space-y-2">
                    <Label htmlFor="answer" className="text-sm font-medium text-muted-foreground">Your Answer:</Label>
                    <Textarea
                      id="answer"
                      placeholder={isRecording ? "Recording..." : isSpeechSupported ? "Speak or type your answer here..." : "Type your answer here..."}
                      value={transcript + interimTranscript}
                      onChange={handleTextChange}
                      rows={6}
                      className="resize-none focus-visible:ring-primary"
                      aria-label="Your Answer"
                      disabled={isRecording}
                    />
                    {interimTranscript && <p className="text-sm text-muted-foreground italic">Listening: {interimTranscript}</p>}
                  </div>

                  {error && !feedback && ( // Only show specific errors if no feedback yet
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                 <div className="flex flex-col sm:flex-row gap-2 justify-between items-center">
                    <div className="flex gap-2 flex-wrap">
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
                        {/* Always show Get Feedback button */}
                         <Button
                           onClick={handleGetFeedback}
                           disabled={isLoading || isRecording || (!transcript && !document.getElementById('answer')?.value)} // Check textarea value directly too
                           aria-label="Get Feedback"
                         >
                           {isLoading ? (
                             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                           ) : (
                             <Send className="mr-2 h-4 w-4" />
                           )}
                           Get Feedback
                         </Button>

                     </div>
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
                        <AlertDescription className="text-foreground whitespace-pre-wrap">{feedback}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </CardContent>
                <CardFooter className="bg-muted/50 border-t p-4 flex justify-end">
                  <Button
                    onClick={goToNextQuestion}
                    disabled={currentQuestionIndex >= filteredQuestions.length - 1 || isLoading || isRecording}
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
       ) : (
         !isFiltering && !showFilters && !error && ( // Only show if not filtering, filters hidden, and no error
              <p className="text-muted-foreground mt-6">No questions loaded. Please select filters above or check for errors.</p>
          )
       )}

        {!isSpeechSupported && !showFilters && !filteredQuestions.length && !error && (
            <Alert variant="default" className="mt-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Speech Recognition Not Supported</AlertTitle>
                <AlertDescription>Your browser doesn't support speech recognition. Please type your answers in the text area.</AlertDescription>
             </Alert>
        )}


    </div>
  );
}