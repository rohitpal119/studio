// src/lib/interview-data.ts

export type JobRole = 'Software Developer' | 'Software Engineer';
export type Company = 'TCS' | 'Google' | 'Amazon';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface InterviewQuestion {
  id: string;
  question: string;
  role: JobRole[];
  company: Company[];
  difficulty: Difficulty;
}

export const interviewQuestionsData: InterviewQuestion[] = [
  // --- Software Developer ---
  // Easy
  {
    id: 'sd-easy-tcs-1',
    question: 'Explain the difference between `==` and `===` in JavaScript.',
    role: ['Software Developer'],
    company: ['TCS', 'Google', 'Amazon'],
    difficulty: 'Easy',
  },
  {
    id: 'sd-easy-tcs-2',
    question: 'What is the purpose of a `finally` block in exception handling?',
    role: ['Software Developer'],
    company: ['TCS'],
    difficulty: 'Easy',
  },
  {
    id: 'sd-easy-google-1',
    question: 'What are the basic data types in Python?',
    role: ['Software Developer'],
    company: ['Google', 'Amazon'],
    difficulty: 'Easy',
  },
  {
    id: 'sd-easy-amazon-1',
    question: 'What is CSS Box Model?',
    role: ['Software Developer'],
    company: ['Amazon', 'TCS'],
    difficulty: 'Easy',
  },

  // Medium
  {
    id: 'sd-medium-tcs-1',
    question: 'Explain the concept of polymorphism in OOP.',
    role: ['Software Developer'],
    company: ['TCS', 'Amazon'],
    difficulty: 'Medium',
  },
  {
    id: 'sd-medium-google-1',
    question: 'Describe the differences between REST and SOAP.',
    role: ['Software Developer'],
    company: ['Google', 'Amazon'],
    difficulty: 'Medium',
  },
  {
    id: 'sd-medium-google-2',
    question: 'How does prototypal inheritance work in JavaScript?',
    role: ['Software Developer'],
    company: ['Google'],
    difficulty: 'Medium',
  },
    {
    id: 'sd-medium-amazon-1',
    question: 'Explain ACID properties in the context of databases.',
    role: ['Software Developer', 'Software Engineer'],
    company: ['Amazon', 'Google'],
    difficulty: 'Medium',
  },

  // Hard
  {
    id: 'sd-hard-tcs-1',
    question: 'Describe a challenging debugging scenario you encountered and how you resolved it.',
    role: ['Software Developer'],
    company: ['TCS'],
    difficulty: 'Hard',
  },
  {
    id: 'sd-hard-google-1',
    question: 'Explain the CAP theorem and its implications for distributed systems.',
    role: ['Software Developer', 'Software Engineer'],
    company: ['Google', 'Amazon'],
    difficulty: 'Hard',
  },
   {
    id: 'sd-hard-google-2',
    question: 'Design a system like TinyURL. Discuss scalability and potential bottlenecks.',
    role: ['Software Developer', 'Software Engineer'],
    company: ['Google', 'Amazon'],
    difficulty: 'Hard',
  },
  {
    id: 'sd-hard-amazon-1',
    question: 'How would you optimize a slow database query?',
    role: ['Software Developer', 'Software Engineer'],
    company: ['Amazon', 'Google', 'TCS'],
    difficulty: 'Hard',
  },


  // --- Software Engineer ---
   // Easy
  {
    id: 'se-easy-tcs-1',
    question: 'What is version control and why is it important? Give examples (e.g., Git).',
    role: ['Software Engineer'],
    company: ['TCS', 'Amazon', 'Google'],
    difficulty: 'Easy',
  },
  {
    id: 'se-easy-google-1',
    question: 'Explain the difference between arrays and linked lists.',
    role: ['Software Engineer'],
    company: ['Google', 'Amazon'],
    difficulty: 'Easy',
  },
  {
    id: 'se-easy-amazon-1',
    question: 'What is an API?',
    role: ['Software Engineer', 'Software Developer'],
    company: ['Amazon', 'TCS', 'Google'],
    difficulty: 'Easy',
  },

  // Medium
  {
    id: 'se-medium-tcs-1',
    question: 'Describe the different layers of the OSI model.',
    role: ['Software Engineer'],
    company: ['TCS'],
    difficulty: 'Medium',
  },
   {
    id: 'se-medium-google-1',
    question: 'Explain the concept of Big O notation and give an example.',
    role: ['Software Engineer'],
    company: ['Google', 'Amazon'],
    difficulty: 'Medium',
  },
  {
    id: 'se-medium-amazon-1',
    question: 'What are microservices and what are their advantages and disadvantages?',
    role: ['Software Engineer'],
    company: ['Amazon', 'Google'],
    difficulty: 'Medium',
  },

  // Hard
  {
    id: 'se-hard-tcs-1',
    question: 'Discuss the trade-offs between different database types (SQL vs NoSQL).',
    role: ['Software Engineer'],
    company: ['TCS', 'Amazon', 'Google'],
    difficulty: 'Hard',
  },
  {
    id: 'se-hard-google-1',
    question: 'How does garbage collection work in a language like Java or Python?',
    role: ['Software Engineer'],
    company: ['Google'],
    difficulty: 'Hard',
  },
  {
    id: 'se-hard-amazon-1',
    question: 'Design a scalable notification system.',
    role: ['Software Engineer'],
    company: ['Amazon', 'Google'],
    difficulty: 'Hard',
  },
   // Generic Questions (apply to multiple categories)
   {
    id: 'gen-easy-1',
    question: "Tell me about yourself.",
    role: ['Software Developer', 'Software Engineer'],
    company: ['TCS', 'Google', 'Amazon'],
    difficulty: 'Easy',
   },
   {
    id: 'gen-easy-2',
    question: "What are your strengths?",
    role: ['Software Developer', 'Software Engineer'],
    company: ['TCS', 'Google', 'Amazon'],
    difficulty: 'Easy',
   },
    {
    id: 'gen-easy-3',
    question: "What are your weaknesses?",
    role: ['Software Developer', 'Software Engineer'],
    company: ['TCS', 'Google', 'Amazon'],
    difficulty: 'Easy',
   },
   {
    id: 'gen-medium-1',
    question: "Why do you want to work here?",
     role: ['Software Developer', 'Software Engineer'],
    company: ['TCS', 'Google', 'Amazon'],
    difficulty: 'Medium',
   },
   {
    id: 'gen-medium-2',
    question: "Describe a challenging situation you faced and how you handled it.",
     role: ['Software Developer', 'Software Engineer'],
    company: ['TCS', 'Google', 'Amazon'],
    difficulty: 'Medium',
   },
   {
    id: 'gen-medium-3',
    question: "Where do you see yourself in 5 years?",
     role: ['Software Developer', 'Software Engineer'],
    company: ['TCS', 'Google', 'Amazon'],
    difficulty: 'Medium',
   },
    {
    id: 'gen-hard-1',
    question: "Why should we hire you?",
     role: ['Software Developer', 'Software Engineer'],
    company: ['TCS', 'Google', 'Amazon'],
    difficulty: 'Hard',
   },

];

export const jobRoles: JobRole[] = ['Software Developer', 'Software Engineer'];
export const companies: Company[] = ['TCS', 'Google', 'Amazon'];
export const difficulties: Difficulty[] = ['Easy', 'Medium', 'Hard'];
