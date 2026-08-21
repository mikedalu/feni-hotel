import { useQuery } from '@tanstack/react-query';

// Polls the Cloud Next.js API for session updates
export const useCheckinPolling = (sessionId: string | null) => {
  return useQuery({
    queryKey: ['checkinSession', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      // We point to the cloud API endpoint here. Since we're running locally, we assume cloud API is on port 3000
      // In production, this would be an absolute URL like https://app.senforge.com/api/checkin/session/...
      const cloudUrl = process.env.NEXT_PUBLIC_CLOUD_URL || 'http://localhost:3001';
      const response = await fetch(`${cloudUrl}/api/checkin/session/${sessionId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Session not found or expired');
        }
        throw new Error('Failed to fetch session');
      }
      return response.json();
    },
    enabled: !!sessionId,
    refetchInterval: 2000, // Poll every 2 seconds as designed
    retry: false, // Don't keep retrying on 404
  });
};
