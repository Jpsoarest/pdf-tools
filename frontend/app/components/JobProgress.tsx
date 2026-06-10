'use client';

import LoadingSpinner from './LoadingSpinner';

interface JobProgressProps {
  isProcessing: boolean;
  progress?: number;
  message?: string;
  showProgress?: boolean;
}

export default function JobProgress({
  isProcessing,
  progress,
  message = 'Processando...',
  showProgress = false,
}: JobProgressProps) {
  if (!isProcessing) return null;

  return <LoadingSpinner message={message} progress={progress} showProgress={showProgress} />;
}
