 "use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { provideAiFeedback } from '@/ai/flows/provide-feedback';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Mic, StopCircle, Send, ChevronRight, AlertCircle, MessageSquareText, Filter, X } from 'lucide-react';
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
        // Append final transcript to existing text, potentially mixing typed and spoken input
        setTranscript((prev) => prev + finalTranscript);
        setInterimTranscript(currentInterimTranscript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}. Please ensure microphone permissions are granted and try again.`);
        setIsRecording(false);
      };

      recognition.onend = () => {
        // Check if we stopped it intentionally
         const wasStoppedIntentionally = !isRecording; // Check state *before* potential updates
         if (!wasStoppedIntentionally) {
            setIsRecording(false); // Ensure state consistency if stopped unexpectedly
            // console.log("Recognition ended unexpectedly.");
            // Optionally add logic here if auto-restart or specific UI feedback is needed
         }
         setInterimTranscript(''); // Always clear interim on end
      };

    } else {
      setIsSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  // Filter questions when selections change
  useEffect(() => {
    if (selectedRole && selectedCompany && selectedDifficulty) {
      setIsFiltering(true);
      setError(null); // Clear previous errors
      const filtered = interviewQuestionsData.filter(q =>
        q.role.includes(selectedRole!) &&
        q.company.includes(selectedCompany!) &&
        q.difficulty === selectedDifficulty
      );
      const genericFiltered = interviewQuestionsData.filter(q =>
         q.difficulty === selectedDifficulty &&
         q.role.includes(selectedRole!) &&
         q.company.length === companies.length // Check if it's generic across companies
      );
       const combined = [...filtered, ...genericFiltered];
       const uniqueQuestions = Array.from(new Map(combined.map(item => [item.id, item])).values());

      setFilteredQuestions(uniqueQuestions);
      setCurrentQuestionIndex(0);
      resetInterviewState();
      setShowFilters(false); // Hide filters after selection
      setIsFiltering(false);

       if (uniqueQuestions.length === 0) {
        setError(`No specific questions found for ${selectedRole}, ${selectedCompany}, ${selectedDifficulty}. Showing generic questions for this role/difficulty if available, or adjust filters.`);
        // Attempt to load generic questions for the role/difficulty if primary filter is empty
        const broaderGeneric = interviewQuestionsData.filter(q =>
            q.difficulty === selectedDifficulty && q.role.includes(selectedRole!)
        );
        const broaderUnique = Array.from(new Map(broaderGeneric.map(item => [item.id, item])).values());
        if (broaderUnique.length > 0) {
             setFilteredQuestions(broaderUnique);
             setError(`No questions found for ${selectedRole}, ${selectedCompany}, ${selectedDifficulty}. Showing ${broaderUnique.length} generic question(s) for ${selectedRole} (${selectedDifficulty}).`);
        } else {
             setError(`No questions found for ${selectedRole}, ${selectedCompany}, ${selectedDifficulty}. Please adjust filters.`);
             setFilteredQuestions([]); // Ensure it's empty
        }

      }

    } else {
       // Keep existing questions if filters are partially cleared, only clear if all are null
       if (!selectedRole && !selectedCompany && !selectedDifficulty) {
          setFilteredQuestions([]);
       }
       setShowFilters(true); // Show filters if not complete
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRole, selectedCompany, selectedDifficulty]);


  const startRecording = useCallback(() => {
    if (recognitionRef.current && !isRecording && isSpeechSupported) {
      // Keep existing typed text, clear only the interim
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
       setIsRecording(false); // Set state *before* calling stop
       recognitionRef.current.stop();
       // No need to clear interim here, onend handles it
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
    // Use combined transcript + interim if recording just stopped, otherwise use transcript
    const currentAnswer = transcript + interimTranscript || transcript;

    if (!currentAnswer.trim()) {
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
        answer: currentAnswer,
      });
      setFeedback(result.feedback);
    } catch (error) {
      console.error('Error getting AI feedback:', error);
      setError('Failed to get feedback from the AI. Please check your connection and try again.');
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
      // Clear feedback if user starts typing a new answer
      if (feedback) setFeedback('');
      if (error) setError(null); // Clear error on typing
    }
  };

  const cardVariants = {
    enter: {
      opacity: 0,
      y: 30,
      scale: 0.98,
      transition: { duration: 0.3, ease: "easeOut" }
    },
    center: {
      zIndex: 1,
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.4, ease: "easeOut" }
    },
    exit: {
      zIndex: 0,
      opacity: 0,
      y: -30,
      scale: 0.98,
      transition: { duration: 0.3, ease: "easeIn" }
    }
  };

  const currentQuestion = filteredQuestions[currentQuestionIndex];

  return (
    // Use flex-grow to push footer down if content is short
    <div className="flex flex-col items-center min-h-screen w-full max-w-3xl mx-auto py-8 px-4 md:py-12">
       <h1 className="text-4xl font-bold mb-10 text-center text-foreground">AI Interview Practice</h1>

       {/* Filters Section */}
       <Card className="w-full shadow-md rounded-lg overflow-hidden mb-8 bg-card border border-border">
          <CardHeader className="border-b border-border p-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-semibold text-card-foreground">
                  Interview Setup
                </CardTitle>
                 <Button variant="ghost" size="icon" onClick={() => setShowFilters(!showFilters)} aria-label={showFilters ? "Hide Filters" : "Show Filters"}>
                    {showFilters ? <X className="h-5 w-5" /> : <Filter className="h-5 w-5" />}
                 </Button>
              </div>
          </CardHeader>
          <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <CardContent className="p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                          <Label htmlFor="role-select" className="mb-1.5 block text-sm font-medium text-muted-foreground">Role</Label>
                          <Select onValueChange={(value) => setSelectedRole(value as JobRole)} value={selectedRole ?? ""}>
                          <SelectTrigger id="role-select" className="focus:ring-primary focus:border-primary" disabled={isFiltering}>
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
                          <Label htmlFor="company-select" className="mb-1.5 block text-sm font-medium text-muted-foreground">Company</Label>
                          <Select onValueChange={(value) => setSelectedCompany(value as Company)} value={selectedCompany ?? ""}>
                          <SelectTrigger id="company-select" className="focus:ring-primary focus:border-primary" disabled={isFiltering}>
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
                          <Label htmlFor="difficulty-select" className="mb-1.5 block text-sm font-medium text-muted-foreground">Difficulty</Label>
                          <Select onValueChange={(value) => setSelectedDifficulty(value as Difficulty)} value={selectedDifficulty ?? ""}>
                          <SelectTrigger id="difficulty-select" className="focus:ring-primary focus:border-primary" disabled={isFiltering}>
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
                  {isFiltering && <div className="flex items-center justify-center text-sm text-muted-foreground pt-4"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finding relevant questions...</div>}
              </CardContent>
            </motion.div>
          )}
          </AnimatePresence>
       </Card>

        {/* Main Interview Area */}
        {/* Use flex-grow to take remaining space */}
       <div className="w-full flex-grow">
            {error && (!showFilters || filteredQuestions.length === 0) && ( // Show errors prominently if filters are hidden or no questions
                 <Alert variant="destructive" className="mb-6 animate-pulse">
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
                  <Card className="w-full shadow-lg rounded-lg overflow-hidden border border-border">
                    <CardHeader className="bg-muted/30 border-b border-border p-5">
                      <CardTitle className="text-xl font-semibold text-foreground">
                         <span className="text-primary mr-2">{currentQuestion.difficulty}</span> Question {currentQuestionIndex + 1} / {filteredQuestions.length}
                      </CardTitle>
                       <p className="text-xs text-muted-foreground pt-1">{currentQuestion.role.join(', ')} @ {currentQuestion.company.join(', ')}</p>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <p className="text-lg font-medium text-foreground leading-relaxed">{currentQuestion.question}</p>

                      <div className="space-y-2">
                        <Label htmlFor="answer" className="text-base font-medium text-muted-foreground">Your Answer</Label>
                        <Textarea
                          id="answer"
                          placeholder={isRecording ? "Listening..." : isSpeechSupported ? "Start recording or type your answer..." : "Type your answer here..."}
                          value={isRecording ? transcript + interimTranscript : transcript} // Show combined only when recording
                          onChange={handleTextChange}
                          rows={8}
                          className="resize-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-base leading-relaxed"
                          aria-label="Your Answer"
                          disabled={isRecording} // Disable typing while recording
                        />
                        {isRecording && interimTranscript && <p className="text-sm text-primary italic animate-pulse">Listening: {interimTranscript}</p>}
                        {!isSpeechSupported && <p className="text-xs text-muted-foreground mt-1">Speech recognition not available. Please type your answer.</p>}
                      </div>


                     <div className="flex flex-col sm:flex-row gap-3 justify-between items-center pt-2">
                        <div className="flex gap-3 flex-wrap">
                           {isSpeechSupported && (
                             <>
                               <Button
                                 onClick={startRecording}
                                 disabled={isRecording || isLoading}
                                 variant={isRecording ? "secondary" : "outline"}
                                 size="sm"
                                 aria-label="Start Recording"
                                 className="transition-all duration-150 ease-in-out hover:scale-105"
                               >
                                 <Mic className="mr-2 h-4 w-4" />
                                 {isRecording ? 'Recording...' : 'Record'}
                               </Button>
                               <Button
                                 onClick={stopRecording}
                                 disabled={!isRecording || isLoading}
                                 variant="destructive"
                                  size="sm"
                                 aria-label="Stop Recording"
                                 className="transition-all duration-150 ease-in-out hover:scale-105"
                               >
                                 <StopCircle className="mr-2 h-4 w-4" />
                                 Stop
                               </Button>
                             </>
                            )}
                            {/* Always show Get Feedback button */}
                             <Button
                               onClick={handleGetFeedback}
                               disabled={isLoading || isRecording || !transcript.trim()} // Disable if no final transcript
                               size="sm"
                               aria-label="Get Feedback"
                                className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-150 ease-in-out hover:scale-105"
                             >
                               {isLoading ? (
                                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                               ) : (
                                 <Send className="mr-2 h-4 w-4" />
                               )}
                               Get Feedback
                             </Button>
                         </div>
                         {/* Next button moved to footer for clarity */}
                      </div>


                      {feedback && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.1 }}
                          className="mt-6"
                          aria-live="polite"
                        >
                          <Alert className="bg-secondary/50 border-primary/50 rounded-md shadow-sm">
                             <MessageSquareText className="h-5 w-5 text-primary mt-1" />
                            <AlertTitle className="text-primary font-semibold text-lg mb-2">AI Feedback</AlertTitle>
                            <AlertDescription className="text-foreground whitespace-pre-wrap leading-relaxed text-base">{feedback}</AlertDescription>
                          </Alert>
                        </motion.div>
                      )}
                      {/* Show specific error related to feedback/recording if it occurs */}
                        {error && feedback === '' && (
                           <Alert variant="destructive" className="mt-4">
                             <AlertCircle className="h-4 w-4" />
                             <AlertTitle>Error during operation</AlertTitle>
                             <AlertDescription>{error}</AlertDescription>
                           </Alert>
                         )}
                    </CardContent>
                    <CardFooter className="bg-muted/30 border-t border-border p-4 flex justify-end">
                      <Button
                        onClick={goToNextQuestion}
                        disabled={currentQuestionIndex >= filteredQuestions.length - 1 || isLoading || isRecording}
                        variant="default"
                        aria-label="Next Question"
                        className="transition-all duration-150 ease-in-out hover:scale-105"
                      >
                        Next Question
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              </AnimatePresence>
           ) : (
             !isFiltering && !showFilters && !error && ( // Only show placeholder if not loading, filters hidden, and no error
                  <div className="text-center text-muted-foreground mt-12 px-4">
                     <p className="text-lg mb-2">Ready to practice?</p>
                     <p>Select your desired role, company, and difficulty level above to start the interview.</p>
                 </div>
              )
           )}
       </div> {/* End flex-grow container */}

       {/* Footer or additional info can go here if needed, outside flex-grow */}
    </div>
  );
}
