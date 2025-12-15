import React, { useEffect, useRef, useState } from "react";

interface AudioVisualizerProps {
  stream: MediaStream | null;
  isActive: boolean;
  className?: string;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ 
  stream, 
  isActive,
  className = "" 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (!stream || !isActive) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setIsSpeaking(false);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);
    
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;
    sourceRef.current = source;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    const barCount = 20;
    const barWidth = WIDTH / barCount;

    const draw = () => {
      if (!analyserRef.current || !dataArrayRef.current || !ctx) return;

      animationFrameRef.current = requestAnimationFrame(draw);

      analyserRef.current.getByteFrequencyData(dataArrayRef.current);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      let sum = 0;
      let max = 0;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * dataArrayRef.current.length);
        const barHeight = (dataArrayRef.current[dataIndex] / 255) * HEIGHT * 0.8;
        
        sum += barHeight;
        max = Math.max(max, barHeight);

        const x = i * barWidth;
        const gradient = ctx.createLinearGradient(x, HEIGHT, x, HEIGHT - barHeight);
        gradient.addColorStop(0, '#10b981'); // emerald-500
        gradient.addColorStop(0.5, '#34d399'); // emerald-400
        gradient.addColorStop(1, '#6ee7b7'); // emerald-300

        ctx.fillStyle = gradient;
        ctx.fillRect(x + 1, HEIGHT - barHeight, barWidth - 2, barHeight);
      }

      // Detect if speaking (average volume above threshold)
      const avgVolume = sum / barCount;
      const threshold = HEIGHT * 0.1; // 10% of height
      setIsSpeaking(avgVolume > threshold);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      setIsSpeaking(false);
    };
  }, [stream, isActive]);

  if (!isActive || !stream) return null;

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={200}
        height={30}
        className="w-full h-8 rounded"
      />
      {isSpeaking && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
        </div>
      )}
    </div>
  );
};

export default AudioVisualizer;

