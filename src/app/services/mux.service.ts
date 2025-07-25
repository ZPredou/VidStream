import { Injectable } from '@angular/core';

// Import mux.js components
declare const muxjs: any;

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  frameRate: number;
  bitrate: number;
  codec: string;
  audioTracks: AudioTrackInfo[];
  videoTracks: VideoTrackInfo[];
}

export interface AudioTrackInfo {
  codec: string;
  sampleRate: number;
  channels: number;
  bitrate: number;
}

export interface VideoTrackInfo {
  codec: string;
  width: number;
  height: number;
  frameRate: number;
  bitrate: number;
}

export interface ConversionProgress {
  percentage: number;
  currentTime: number;
  totalTime: number;
  speed: number;
}

@Injectable({
  providedIn: 'root'
})
export class MuxService {
  private transmuxer: any = null;

  constructor() {
    // Initialize mux.js if available
    if (typeof window !== 'undefined' && (window as any).muxjs) {
      console.log('mux.js is available');
    } else {
      console.warn('mux.js is not available. Some features may not work.');
    }
  }

  /**
   * Check if mux.js is available and supported
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && !!(window as any).muxjs;
  }

  /**
   * Extract metadata from a video file
   */
  async extractMetadata(file: File): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(new Error('mux.js is not supported'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // This is a simplified metadata extraction
          // In a real implementation, you'd use mux.js to parse the container
          const metadata: VideoMetadata = {
            duration: 0,
            width: 1920,
            height: 1080,
            frameRate: 30,
            bitrate: 2500000,
            codec: 'h264',
            audioTracks: [{
              codec: 'aac',
              sampleRate: 44100,
              channels: 2,
              bitrate: 128000
            }],
            videoTracks: [{
              codec: 'h264',
              width: 1920,
              height: 1080,
              frameRate: 30,
              bitrate: 2500000
            }]
          };

          resolve(metadata);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Convert MP4 to Transport Stream (TS) format
   */
  async convertMp4ToTs(
    file: File, 
    onProgress?: (progress: ConversionProgress) => void
  ): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(new Error('mux.js is not supported'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // Initialize transmuxer
          const transmuxer = new (window as any).muxjs.mp4.Transmuxer();
          const segments: Uint8Array[] = [];

          transmuxer.on('data', (segment: any) => {
            // Combine audio and video data
            if (segment.initSegment) {
              segments.push(new Uint8Array(segment.initSegment));
            }
            if (segment.data) {
              segments.push(new Uint8Array(segment.data));
            }
          });

          transmuxer.on('done', () => {
            // Combine all segments
            const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0);
            const result = new Uint8Array(totalLength);
            let offset = 0;
            
            for (const segment of segments) {
              result.set(segment, offset);
              offset += segment.length;
            }

            resolve(result);
          });

          transmuxer.on('error', (error: any) => {
            reject(error);
          });

          // Simulate progress updates
          let progress = 0;
          const progressInterval = setInterval(() => {
            progress += 10;
            if (onProgress) {
              onProgress({
                percentage: Math.min(progress, 90),
                currentTime: progress * 0.1,
                totalTime: 10,
                speed: 1.0
              });
            }
            if (progress >= 90) {
              clearInterval(progressInterval);
            }
          }, 100);

          // Push data to transmuxer
          transmuxer.push(uint8Array);
          transmuxer.flush();

        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Extract captions/subtitles from video file
   */
  async extractCaptions(file: File): Promise<string[]> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(new Error('mux.js is not supported'));
        return;
      }

      // This is a placeholder implementation
      // In a real scenario, you'd use mux.js to extract caption tracks
      setTimeout(() => {
        resolve([
          'Caption track 1: English',
          'Caption track 2: Spanish',
          'Caption track 3: French'
        ]);
      }, 1000);
    });
  }

  /**
   * Analyze video segments for debugging
   */
  async analyzeSegments(data: Uint8Array): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(new Error('mux.js is not supported'));
        return;
      }

      try {
        // This would use mux.js to parse and analyze segments
        const segments = [
          {
            type: 'video',
            duration: 10.0,
            size: data.length * 0.7,
            keyframes: 3,
            timestamp: 0
          },
          {
            type: 'audio',
            duration: 10.0,
            size: data.length * 0.3,
            samples: 441000,
            timestamp: 0
          }
        ];

        resolve(segments);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Create a blob URL from converted data
   */
  createBlobUrl(data: Uint8Array, mimeType: string = 'video/mp2t'): string {
    const blob = new Blob([data], { type: mimeType });
    return URL.createObjectURL(blob);
  }

  /**
   * Clean up blob URLs to prevent memory leaks
   */
  revokeBlobUrl(url: string): void {
    URL.revokeObjectURL(url);
  }

  /**
   * Get supported input formats
   */
  getSupportedFormats(): string[] {
    return [
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm'
    ];
  }

  /**
   * Validate if file format is supported
   */
  isFormatSupported(file: File): boolean {
    return this.getSupportedFormats().includes(file.type);
  }
}
