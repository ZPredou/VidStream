import { Component, ViewChild, ElementRef, OnDestroy, AfterViewInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HlsService, StreamMetrics, LogEntry } from '../services/hls.service';

interface SegmentInfo {
  index: number;
  url: string;
  duration: number;
  size: number;
  bitrate: number;
  status: 'pending' | 'loading' | 'loaded' | 'playing' | 'buffered' | 'error';
  progress: number;
  startTime: number;
  endTime: number;
}

interface TimeMarker {
  time: string;
  position: number;
}

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})
export class PlayerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;

  developerMode = true;  // Pre-select developer tools
  activeTab = 'segments';  // Pre-select segments tab
  currentStream: any = null;

  metrics: StreamMetrics = {
    bitrate: 0,
    bufferHealth: 0,
    droppedFrames: 0,
    qualityLevel: 'Loading...',
    currentLevel: -1,
    availableLevels: []
  };

  consoleLogs: LogEntry[] = [];
  manifestContent = 'Loading manifest...';
  
  // Segment timeline properties
  segments: SegmentInfo[] = [];
  currentSegmentIndex = -1;
  bufferedSegments = 0;
  totalDuration = 0;
  timeMarkers: TimeMarker[] = [];
  selectedSegment: SegmentInfo | null = null;
  selectedSegmentIndex = -1;
  private updateIntervals: number[] = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly hlsService: HlsService,
    private readonly cdr: ChangeDetectorRef,
    private readonly ngZone: NgZone
  ) {
    // Get stream from route state
    const navigation = history.state;
    if (navigation?.stream) {
      this.currentStream = navigation.stream;
    }
  }

  ngAfterViewInit() {
    this.initializeHls();
    this.initializeSegmentTimeline();
    if (this.currentStream?.url) {
      setTimeout(() => this.loadStream(), 100);
    }
  }

  ngOnDestroy() {
    this.hlsService.destroy();
    // Clean up all intervals
    this.updateIntervals.forEach(interval => clearInterval(interval));
    this.updateIntervals = [];
  }

  toggleDeveloperMode() {
    this.developerMode = !this.developerMode;
  }

  private initializeHls() {
    if (!this.videoElement?.nativeElement) {
      console.error('Video element not found');
      return;
    }

    this.hlsService.initialize(this.videoElement.nativeElement);
    
    // Set up callbacks with real-time updates
    this.hlsService.onMetrics((metrics) => {
      this.ngZone.run(() => {
        this.metrics = metrics;
        this.cdr.detectChanges();
      });
    });

    this.hlsService.onLog((log) => {
      this.ngZone.run(() => {
        this.addLog(log.level, log.message);
        this.cdr.detectChanges();
      });
    });

    this.hlsService.onManifest((manifest) => {
      this.ngZone.run(() => {
        this.manifestContent = manifest;
        this.cdr.detectChanges();
      });
    });

    // Set up segment data callback
    if ((this.hlsService as any).onSegments) {
      (this.hlsService as any).onSegments((fragments: any[]) => {
        this.ngZone.run(() => {
          this.updateSegmentsFromHLS(fragments);
          this.cdr.detectChanges();
        });
      });
    }

    // Set up playback tracking callback
    if ((this.hlsService as any).onPlayback) {
      (this.hlsService as any).onPlayback((currentTime: number, duration: number) => {
        this.ngZone.run(() => {
          this.updatePlaybackPosition(currentTime, duration);
          this.cdr.detectChanges();
        });
      });
    }

    this.hlsService.startMetricsUpdate();
  }

  private loadStream() {
    if (this.currentStream?.url) {
      this.hlsService.loadSource(this.currentStream.url);
      this.addLog('info', `Loading stream: ${this.currentStream.title || this.currentStream.url}`);
    }
  }

  private addLog(level: 'info' | 'warn' | 'error', message: string) {
    this.consoleLogs.unshift({
      timestamp: new Date(),
      level,
      message
    });
    
    // Keep only last 100 logs
    if (this.consoleLogs.length > 100) {
      this.consoleLogs = this.consoleLogs.slice(0, 100);
    }
  }

  // Segment timeline methods
  getSegmentTooltip(segment: SegmentInfo, index: number): string {
    return `Segment ${index + 1}\nDuration: ${segment.duration.toFixed(2)}s\nSize: ${this.formatBytes(segment.size)}\nStatus: ${segment.status.toUpperCase()}`;
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  get Math() {
    return Math;
  }

  selectSegment(segment: SegmentInfo, index: number) {
    this.selectedSegment = segment;
    this.selectedSegmentIndex = index;
  }

  private initializeSegmentTimeline() {
    // Initialize with some demo segments
    this.segments = [];
    this.totalDuration = 0;
    this.currentSegmentIndex = -1;
    this.bufferedSegments = 0;
    
    // Generate time markers every 10 seconds
    this.generateTimeMarkers();
  }

  private generateTimeMarkers() {
    this.timeMarkers = [];
    if (this.totalDuration > 0) {
      const interval = Math.max(10, Math.floor(this.totalDuration / 10));
      for (let time = 0; time <= this.totalDuration; time += interval) {
        this.timeMarkers.push({
          time: this.formatTime(time),
          position: (time / this.totalDuration) * 100
        });
      }
    }
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  private updateSegmentsFromHLS(fragments: any[]) {
    // Convert HLS fragments to our segment format
    this.segments = fragments.map((fragment: any, index: number) => ({
      index,
      url: fragment.url || fragment.relurl || `segment-${index}.ts`,
      duration: fragment.duration || 10,
      size: fragment.bytes || Math.random() * 2000000 + 500000, // Estimate if not available
      bitrate: 2500000, // Will be updated from current level
      status: 'pending' as const,
      progress: 0,
      startTime: fragment.start || 0,
      endTime: fragment.end || fragment.start + fragment.duration || 0
    }));

    this.totalDuration = this.segments.reduce((total, seg) => total + seg.duration, 0);
    this.generateTimeMarkers();
    this.currentSegmentIndex = -1;
    this.bufferedSegments = 0;

    // Start tracking segment loading
    this.startSegmentTracking();
  }

  private updatePlaybackPosition(currentTime: number, duration: number) {
    if (this.segments.length === 0) return;

    // Update total duration if we have a better value
    if (duration > 0 && Math.abs(this.totalDuration - duration) > 1) {
      this.totalDuration = duration;
      this.generateTimeMarkers();
    }

    // Find current segment based on playback time
    const newCurrentSegment = this.segments.findIndex(segment =>
      currentTime >= segment.startTime && currentTime < segment.endTime
    );

    if (newCurrentSegment !== -1 && newCurrentSegment !== this.currentSegmentIndex) {
      // Update segment statuses based on playback position
      this.segments.forEach((segment, index) => {
        if (index < newCurrentSegment) {
          segment.status = 'buffered'; // Already played
        } else if (index === newCurrentSegment) {
          segment.status = 'playing'; // Currently playing
        } else if (index <= newCurrentSegment + 3) {
          segment.status = 'loaded'; // Buffered ahead
        } else {
          segment.status = 'pending'; // Not yet loaded
        }

        // Update progress for current segment
        if (index === newCurrentSegment) {
          const segmentProgress = (currentTime - segment.startTime) / segment.duration;
          segment.progress = Math.min(100, Math.max(0, segmentProgress * 100));
        } else if (segment.status === 'loaded' || segment.status === 'buffered') {
          segment.progress = 100;
        }
      });

      this.currentSegmentIndex = newCurrentSegment;
      this.bufferedSegments = this.segments.filter(s =>
        s.status === 'loaded' || s.status === 'buffered'
      ).length;
    }
  }

  private startSegmentTracking() {
    // Simulate progressive segment loading based on video buffering
    const trackingInterval = setInterval(() => {
      if (this.segments.length === 0) {
        clearInterval(trackingInterval);
        return;
      }

      // Simulate segments loading ahead of playback
      const currentIndex = this.currentSegmentIndex;
      const loadAheadCount = 5; // Load 5 segments ahead

      for (let i = Math.max(0, currentIndex); i < Math.min(this.segments.length, currentIndex + loadAheadCount); i++) {
        const segment = this.segments[i];
        if (segment && segment.status === 'pending') {
          segment.status = 'loaded';
          segment.progress = 100;
          break; // Load one segment at a time
        }
      }

      this.bufferedSegments = this.segments.filter(s =>
        s.status === 'loaded' || s.status === 'buffered'
      ).length;

    }, 1000); // Check every second

    this.updateIntervals.push(trackingInterval);
  }
}
