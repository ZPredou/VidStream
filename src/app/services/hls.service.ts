import { Injectable } from '@angular/core';
import Hls from 'hls.js';

export interface StreamMetrics {
  bitrate: number;
  bufferHealth: number;
  droppedFrames: number;
  qualityLevel: string;
  currentLevel: number;
  loadedLevels: any[];
}

export interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class HlsService {
  private hls: Hls | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private metricsCallback?: (metrics: StreamMetrics) => void;
  private logCallback?: (log: LogEntry) => void;
  private manifestCallback?: (manifest: string) => void;
  private bandwidthLimit: number = 0; // 0 means no limit

  constructor() {}

  isSupported(): boolean {
    return Hls.isSupported();
  }

  initialize(videoElement: HTMLVideoElement): boolean {
    if (!this.isSupported()) {
      console.warn('HLS.js is not supported in this browser');
      return false;
    }

    this.videoElement = videoElement;
    this.hls = new Hls({
      debug: false,
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 90
    });

    this.setupEventListeners();
    this.hls.attachMedia(videoElement);

    this.log('info', 'HLS.js initialized successfully');
    return true;
  }

  loadSource(url: string): void {
    if (!this.hls) {
      this.log('error', 'HLS not initialized');
      return;
    }

    this.log('info', `Loading source: ${url}`);
    this.hls.loadSource(url);
  }

  destroy(): void {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    this.videoElement = null;
    this.log('info', 'HLS instance destroyed');
  }

  getCurrentLevel(): number {
    return this.hls?.currentLevel ?? -1;
  }

  setCurrentLevel(level: number): void {
    if (this.hls) {
      this.hls.currentLevel = level;
      this.log('info', `Quality level changed to: ${level}`);
    }
  }

  setMaxBandwidth(bandwidth: number): void {
    this.bandwidthLimit = bandwidth;

    if (this.hls) {
      if (bandwidth > 0) {
        // Configure HLS.js for bandwidth limitation
        this.hls.config.maxMaxBufferLength = 10; // Reduce buffer for faster adaptation
        this.hls.config.maxBufferLength = 5;
        this.hls.config.startLevel = -1; // Let HLS choose starting level

        // Set a custom bandwidth estimator
        const originalBandwidthEstimate = this.hls.bandwidthEstimate;
        Object.defineProperty(this.hls, 'bandwidthEstimate', {
          get: () => Math.min(originalBandwidthEstimate, bandwidth),
          configurable: true
        });

        this.log('info', `Bandwidth limited to ${Math.round(bandwidth / 1000)}kbps`);

        // Force quality switch if current level exceeds limit
        if (this.hls.currentLevel >= 0 && this.hls.levels[this.hls.currentLevel]?.bitrate > bandwidth) {
          const suitableLevels = this.hls.levels.filter(level => level.bitrate <= bandwidth);
          if (suitableLevels.length > 0) {
            const maxSuitableLevel = suitableLevels.length - 1;
            this.hls.currentLevel = maxSuitableLevel;
            this.log('info', `Switched to lower quality due to bandwidth limit`);
          }
        }
      } else {
        // Remove bandwidth limit
        this.hls.config.maxMaxBufferLength = 600;
        this.hls.config.maxBufferLength = 30;
        this.hls.currentLevel = -1; // Auto quality

        // Restore original bandwidth estimation
        delete (this.hls as any).bandwidthEstimate;

        this.log('info', 'Bandwidth limit removed');
      }
    }
  }

  getLevels(): any[] {
    return this.hls?.levels ?? [];
  }

  getStats(): any {
    // HLS.js doesn't expose stats directly, we'll track our own
    return {};
  }

  onMetrics(callback: (metrics: StreamMetrics) => void): void {
    this.metricsCallback = callback;
  }

  onLog(callback: (log: LogEntry) => void): void {
    this.logCallback = callback;
  }

  onManifest(callback: (manifest: string) => void): void {
    this.manifestCallback = callback;
  }

  private setupEventListeners(): void {
    if (!this.hls) return;

    // Manifest loaded
    this.hls.on(Hls.Events.MANIFEST_LOADED, (event, data) => {
      this.log('info', `Manifest loaded with ${data.levels.length} quality levels`);
      if (this.manifestCallback) {
        // Convert manifest data to string representation
        const manifestInfo = {
          levels: data.levels.map(level => ({
            bitrate: level.bitrate,
            width: level.width,
            height: level.height,
            codecs: (level as any).codecs || 'unknown'
          })),
          url: data.url
        };
        this.manifestCallback(JSON.stringify(manifestInfo, null, 2));
      }
      // Immediate update when manifest loads
      setTimeout(() => this.updateMetrics(), 50);
    });

    // Level switched - immediate update for responsive UI
    this.hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
      const level = this.hls?.levels[data.level];
      if (level) {
        this.log('info', `Quality switched to: ${level.height}p (${Math.round(level.bitrate / 1000)}kbps)`);
      }
      // Immediate metrics update for instant UI response
      setTimeout(() => this.updateMetrics(), 50);
    });

    // Fragment loaded - update metrics for bitrate changes
    this.hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
      // Immediate update for responsive bitrate display
      setTimeout(() => this.updateMetrics(), 50);
    });

    // Error handling
    this.hls.on(Hls.Events.ERROR, (event, data) => {
      const errorMessage = `${data.type} error: ${data.details}`;
      this.log('error', errorMessage);
      
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            this.log('error', 'Fatal network error encountered, trying to recover');
            this.hls?.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            this.log('error', 'Fatal media error encountered, trying to recover');
            this.hls?.recoverMediaError();
            break;
          default:
            this.log('error', 'Fatal error, cannot recover');
            this.destroy();
            break;
        }
      }
    });

    // Buffer events
    this.hls.on(Hls.Events.BUFFER_APPENDED, () => {
      this.updateMetrics();
    });

    this.hls.on(Hls.Events.BUFFER_EOS, () => {
      this.log('info', 'Buffer end of stream');
    });
  }

  private updateMetrics(): void {
    if (!this.hls || !this.videoElement || !this.metricsCallback) return;

    const levels = this.hls.levels;
    const currentLevel = this.hls.currentLevel;
    
    let bufferHealth = 0;
    if (this.videoElement.buffered.length > 0) {
      const currentTime = this.videoElement.currentTime;
      const bufferedEnd = this.videoElement.buffered.end(this.videoElement.buffered.length - 1);
      bufferHealth = bufferedEnd - currentTime;
    }

    const metrics: StreamMetrics = {
      bitrate: currentLevel >= 0 && levels[currentLevel] ? Math.round(levels[currentLevel].bitrate / 1000) : 0,
      bufferHealth: Math.round(bufferHealth * 10) / 10,
      droppedFrames: 0, // We'll track this separately if needed
      qualityLevel: currentLevel >= 0 && levels[currentLevel]
        ? `${levels[currentLevel].height}p (${Math.round(levels[currentLevel].bitrate / 1000)}kbps)`
        : 'Auto',
      currentLevel,
      loadedLevels: levels
    };

    this.metricsCallback(metrics);
  }

  private log(level: 'info' | 'warn' | 'error', message: string): void {
    console[level](`[HLS] ${message}`);
    if (this.logCallback) {
      this.logCallback({
        timestamp: new Date(),
        level,
        message
      });
    }
  }

  // Start metrics update interval
  startMetricsUpdate(intervalMs: number = 1000): void {
    setInterval(() => {
      this.updateMetrics();
    }, intervalMs);
  }
}
