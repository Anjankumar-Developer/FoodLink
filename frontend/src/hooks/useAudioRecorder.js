import { useState, useRef, useCallback } from 'react';
import { api } from '../services/api';

/**
 * Custom hook to record audio from microphone and transcribe using gemini-3.5-transcribe
 */
export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = useCallback(async () => {
    setTranscriptionError(null);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone recording is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '',
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(250); // Slice every 250ms
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting audio recording:', err);
      setTranscriptionError(err.message || 'Microphone access denied or unavailable.');
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || !isRecording) return null;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;

      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        setIsTranscribing(true);

        try {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: mediaRecorder.mimeType || 'audio/webm',
          });

          // Stop all audio tracks to release microphone
          mediaRecorder.stream.getTracks().forEach((track) => track.stop());

          // Convert Blob to base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Data = reader.result;

            try {
              const res = await api.transcribeAudio({
                audio: base64Data,
                mimeType: audioBlob.type || 'audio/webm',
              });

              setIsTranscribing(false);
              resolve(res.transcription || res.text || '');
            } catch (apiErr) {
              console.error('Transcription API error:', apiErr);
              setTranscriptionError(apiErr.message || 'Failed to transcribe audio.');
              setIsTranscribing(false);
              resolve(null);
            }
          };
        } catch (processErr) {
          console.error('Audio processing error:', processErr);
          setTranscriptionError(processErr.message || 'Failed to process audio.');
          setIsTranscribing(false);
          resolve(null);
        }
      };

      mediaRecorder.stop();
    });
  }, [isRecording]);

  const cancelRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      } catch (e) {
        // ignore cleanup error
      }
    }

    setIsRecording(false);
    setIsTranscribing(false);
    setRecordingDuration(0);
    audioChunksRef.current = [];
  }, []);

  return {
    isRecording,
    recordingDuration,
    isTranscribing,
    transcriptionError,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
