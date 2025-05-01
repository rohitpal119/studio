import { InterviewUI } from '@/components/interview-ui';

export default function Home() {
  return (
    // Use more responsive padding
    <div className="container mx-auto p-4 md:py-8 lg:py-12">
      <InterviewUI />
    </div>
  );
}
