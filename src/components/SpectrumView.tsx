/**
 * Spectrum View Component
 * Displays spectrum analyzer and waterfall
 */

import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SpectrumView = () => {
  const { spectrumData, waterfallData, currentDevice, isStreaming, showWaterfall } = useAppStore();
  const waterfallCanvasRef = useRef<HTMLCanvasElement>(null);

  // Convert spectrum data for Recharts
  const chartData = spectrumData
    ? spectrumData.spectrum.map((magnitude, index) => ({
        frequency: (
          (spectrumData.centerFrequency + spectrumData.frequencies[index] * spectrumData.sampleRate) /
          1e6
        ).toFixed(3),
        magnitude,
      }))
    : [];

  // Render waterfall on canvas
  useEffect(() => {
    if (!waterfallCanvasRef.current || !waterfallData.length) return;

    const canvas = waterfallCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const fftSize = waterfallData[0]?.length || 0;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw waterfall
    const rowHeight = height / waterfallData.length;

    waterfallData.forEach((row, rowIndex) => {
      const y = rowIndex * rowHeight;

      row.forEach((value, index) => {
        const x = (index / fftSize) * width;

        // Map dB value to color (blue -> green -> yellow -> red)
        const normalized = Math.max(0, Math.min(1, (value + 100) / 60)); // -100 to -40 dB
        const hue = (1 - normalized) * 240; // Blue to red
        const color = `hsl(${hue}, 100%, 50%)`;

        ctx.fillStyle = color;
        ctx.fillRect(x, y, width / fftSize, rowHeight + 1);
      });
    });
  }, [waterfallData]);

  if (!currentDevice) {
    return (
      <div className="p-6">
        <div className="bg-gray-800 rounded-lg p-12 border border-gray-700 text-center">
          <div className="text-4xl mb-4">📡</div>
          <h3 className="text-xl font-bold text-white mb-2">No Device Connected</h3>
          <p className="text-gray-400">
            Connect an SDR device to view the spectrum analyzer
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Spectrum Analyzer</h2>
        <div className="text-sm text-gray-400">
          {isStreaming ? (
            <span className="text-green-500">● Live</span>
          ) : (
            <span className="text-gray-500">● Stopped</span>
          )}
        </div>
      </div>

      {/* Spectrum chart */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-white mb-2">Power Spectrum</h3>
          {spectrumData && (
            <div className="text-sm text-gray-400">
              Center: {(spectrumData.centerFrequency / 1e6).toFixed(3)} MHz | Span:{' '}
              {(spectrumData.sampleRate / 1e6).toFixed(2)} MHz
            </div>
          )}
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="frequency"
              stroke="#9CA3AF"
              label={{ value: 'Frequency (MHz)', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }}
              tick={{ fill: '#9CA3AF' }}
            />
            <YAxis
              stroke="#9CA3AF"
              label={{ value: 'Power (dB)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
              tick={{ fill: '#9CA3AF' }}
              domain={[-100, 0]}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F3F4F6' }}
            />
            <Line
              type="monotone"
              dataKey="magnitude"
              stroke="#0EA5E9"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Waterfall display */}
      {showWaterfall && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4">Waterfall Display</h3>
          <div className="relative">
            <canvas
              ref={waterfallCanvasRef}
              width={1024}
              height={200}
              className="w-full rounded border border-gray-600"
            />
            <div className="absolute top-2 right-2 bg-gray-900 bg-opacity-75 px-3 py-1 rounded text-xs text-gray-300">
              Time flows down ↓
            </div>
          </div>
        </div>
      )}

      {!isStreaming && (
        <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-4 text-yellow-100">
          ⚠️  Streaming is stopped. Click "Start Streaming" in the device control to view live spectrum data.
        </div>
      )}
    </div>
  );
};

export default SpectrumView;
