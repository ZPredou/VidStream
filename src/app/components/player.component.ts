import { Component, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HlsService, StreamMetrics, LogEntry } from '../services/hls.service';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="player-container">
      <div class="player-header">
        <h1 class="player-title">Video Player</h1>
        <div class="player-controls">
          <button class="control-btn" (click)="toggleDeveloperMode()">
            {{ developerMode ? '🔧 Hide Dev Tools' : '🔧 Show Dev Tools' }}
          </button>
        </div>
      </div>

      <div class="player-layout" [class.dev-mode]="developerMode">
        <div class="video-section">
          <div class="video-container">
            <video 
              #videoElement
              class="video-player"
              controls
              playsinline
            >
              Your browser does not support the video tag.
            </video>
          </div>
          
          <div class="video-info" *ngIf="currentStream">
            <h3>{{ currentStream.name || 'Video Stream' }}</h3>
            <p>{{ currentStream.url || 'Local file' }}</p>
            <div class="stream-stats">
              <span class="stat">Type: {{ currentStream.type?.toUpperCase() || 'Unknown' }}</span>
            </div>
          </div>
        </div>

        <div class="analytics-section" *ngIf="!developerMode">
          <div class="analytics-panel">
            <h3>📊 Streaming Analytics</h3>
            <div class="metrics-grid">
              <div class="metric-card">
                <span class="metric-label">Bitrate</span>
                <span class="metric-value">{{ metrics.bitrate }} kbps</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">Buffer Health</span>
                <span class="metric-value">{{ metrics.bufferHealth }}s</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">Dropped Frames</span>
                <span class="metric-value">{{ metrics.droppedFrames }}</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">Quality Level</span>
                <span class="metric-value">{{ metrics.qualityLevel }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="developer-section" *ngIf="developerMode">
          <div class="dev-panel">
            <h3>🛠️ Developer Tools</h3>
            <div class="dev-tabs">
              <button 
                class="tab-btn" 
                [class.active]="activeTab === 'console'"
                (click)="activeTab = 'console'"
              >
                Console
              </button>
              <button 
                class="tab-btn" 
                [class.active]="activeTab === 'manifest'"
                (click)="activeTab = 'manifest'"
              >
                Manifest
              </button>
              <button 
                class="tab-btn" 
                [class.active]="activeTab === 'segments'"
                (click)="activeTab = 'segments'"
              >
                Segments
              </button>
            </div>
            
            <div class="tab-content">
              <div *ngIf="activeTab === 'console'" class="console-panel">
                <div class="console-output">
                  <div *ngFor="let log of consoleLogs" class="log-entry" [class]="log.level">
                    <span class="log-time">{{ log.timestamp | date:'HH:mm:ss.SSS' }}</span>
                    <span class="log-level">{{ log.level.toUpperCase() }}</span>
                    <span class="log-message">{{ log.message }}</span>
                  </div>
                </div>
              </div>
              
              <div *ngIf="activeTab === 'manifest'" class="manifest-panel">
                <pre class="manifest-content">{{ manifestContent || 'No manifest loaded' }}</pre>
              </div>
              
              <div *ngIf="activeTab === 'segments'" class="segments-panel">
                <div class="segments-timeline">
                  <p>Segment timeline visualization will be implemented here</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .player-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
      color: white;
    }

    .player-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .player-title {
      font-size: 2rem;
      margin: 0;
    }

    .control-btn {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .control-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .player-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    .player-layout.dev-mode {
      grid-template-columns: 2fr 1fr;
    }

    .video-section {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 1rem;
      padding: 1.5rem;
      backdrop-filter: blur(10px);
    }

    .video-container {
      position: relative;
      width: 100%;
      aspect-ratio: 16/9;
      background: #000;
      border-radius: 0.5rem;
      overflow: hidden;
      margin-bottom: 1rem;
    }

    .video-player {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .video-info h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.2rem;
    }

    .video-info p {
      margin: 0 0 1rem 0;
      opacity: 0.8;
      font-size: 0.9rem;
      word-break: break-all;
    }

    .stream-stats {
      display: flex;
      gap: 1rem;
    }

    .stat {
      background: rgba(255, 255, 255, 0.1);
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.875rem;
    }

    .analytics-section,
    .developer-section {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 1rem;
      padding: 1.5rem;
      backdrop-filter: blur(10px);
    }

    .analytics-panel h3,
    .dev-panel h3 {
      margin: 0 0 1.5rem 0;
      font-size: 1.3rem;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }

    .metric-card {
      background: rgba(255, 255, 255, 0.1);
      padding: 1rem;
      border-radius: 0.5rem;
      text-align: center;
    }

    .metric-label {
      display: block;
      font-size: 0.875rem;
      opacity: 0.8;
      margin-bottom: 0.5rem;
    }

    .metric-value {
      display: block;
      font-size: 1.2rem;
      font-weight: 600;
    }

    .dev-tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .tab-btn {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 0.5rem 1rem;
      border-radius: 0.25rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .tab-btn.active {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.4);
    }

    .tab-content {
      background: rgba(0, 0, 0, 0.3);
      border-radius: 0.5rem;
      padding: 1rem;
      min-height: 300px;
      max-height: 400px;
      overflow-y: auto;
    }

    .console-output {
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
    }

    .log-entry {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
      padding: 0.25rem;
      border-radius: 0.25rem;
    }

    .log-entry.info {
      background: rgba(59, 130, 246, 0.1);
    }

    .log-entry.warn {
      background: rgba(245, 158, 11, 0.1);
    }

    .log-entry.error {
      background: rgba(239, 68, 68, 0.1);
    }

    .log-time {
      color: #9ca3af;
      font-size: 0.75rem;
      min-width: 80px;
    }

    .log-level {
      font-weight: 600;
      min-width: 50px;
    }

    .log-message {
      flex: 1;
    }

    .manifest-content {
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
      white-space: pre-wrap;
      margin: 0;
      color: #e5e7eb;
    }

    @media (max-width: 1024px) {
      .player-layout.dev-mode {
        grid-template-columns: 1fr;
      }
      
      .metrics-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .player-container {
        padding: 1rem;
      }
      
      .player-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }
      
      .metrics-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PlayerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;

  developerMode = false;
  activeTab = 'console';
  currentStream: any = null;

  metrics: StreamMetrics = {
    bitrate: 0,
    bufferHealth: 0,
    droppedFrames: 0,
    qualityLevel: 'Loading...',
    currentLevel: -1,
    loadedLevels: []
  };

  consoleLogs: LogEntry[] = [];
  manifestContent = 'Loading manifest...';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly hlsService: HlsService
  ) {
    this.route.queryParams.subscribe(params => {
      if (params['url']) {
        this.currentStream = {
          name: params['name'] || 'Stream',
          url: params['url'],
          type: params['type'] || 'hls'
        };
      } else if (params['file']) {
        this.currentStream = {
          name: params['file'],
          url: null,
          type: 'upload'
        };
      }
    });
  }

  ngAfterViewInit() {
    this.initializeHls();
    if (this.currentStream?.url) {
      setTimeout(() => this.loadStream(), 100);
    }
  }

  ngOnDestroy() {
    this.hlsService.destroy();
  }

  toggleDeveloperMode() {
    this.developerMode = !this.developerMode;
  }

  private initializeHls() {
    if (!this.hlsService.isSupported()) {
      this.addLog('error', 'HLS.js is not supported in this browser');
      return;
    }

    const success = this.hlsService.initialize(this.videoElement.nativeElement);
    if (!success) {
      this.addLog('error', 'Failed to initialize HLS.js');
      return;
    }

    // Set up callbacks
    this.hlsService.onMetrics((metrics) => {
      this.metrics = metrics;
    });

    this.hlsService.onLog((log) => {
      this.addLog(log.level, log.message);
    });

    this.hlsService.onManifest((manifest) => {
      this.manifestContent = manifest;
    });

    // Start metrics updates
    this.hlsService.startMetricsUpdate();
  }

  private loadStream() {
    if (!this.currentStream?.url) return;

    this.addLog('info', `Loading stream: ${this.currentStream.name}`);
    this.hlsService.loadSource(this.currentStream.url);
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
}
