import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HlsService } from '../services/hls.service';

@Component({
  selector: 'app-comparison',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comparison.component.html',
  styleUrls: ['./comparison.component.css']
})
export class ComparisonComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoPlayerA') videoPlayerA!: ElementRef<HTMLVideoElement>;
  @ViewChild('videoPlayerB') videoPlayerB!: ElementRef<HTMLVideoElement>;

  networkSpeed = 'unlimited';
  currentThrottle = 'unlimited';

  availableStreams = [
    {
      name: 'Big Buck Bunny',
      url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      description: 'Classic test stream'
    },
    {
      name: 'Sintel',
      url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
      description: 'High quality test stream'
    },
    {
      name: 'Tears of Steel',
      url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
      description: 'Multi-bitrate stream'
    }
  ];

  playerA = {
    selectedStream: '',
    hlsService: new HlsService(),
    stats: {
      bitrate: 0,
      quality: 'Auto',
      bufferHealth: 0
    }
  };

  playerB = {
    selectedStream: '',
    hlsService: new HlsService(),
    stats: {
      bitrate: 0,
      quality: 'Auto',
      bufferHealth: 0
    }
  };

  private updateIntervals: number[] = [];

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly ngZone: NgZone
  ) {}

  ngAfterViewInit() {
    this.initializePlayers();
  }

  ngOnDestroy() {
    this.playerA.hlsService.destroy();
    this.playerB.hlsService.destroy();
    this.updateIntervals.forEach(interval => clearInterval(interval));
    this.updateIntervals = [];
  }

  private initializePlayers() {
    // Initialize Player A
    if (this.videoPlayerA?.nativeElement) {
      this.playerA.hlsService.initialize(this.videoPlayerA.nativeElement);
      this.playerA.hlsService.onMetrics((metrics) => {
        this.ngZone.run(() => {
          this.playerA.stats = {
            bitrate: metrics.bitrate,
            quality: metrics.qualityLevel,
            bufferHealth: metrics.bufferHealth
          };
          this.cdr.detectChanges();
        });
      });
      this.playerA.hlsService.startMetricsUpdate();
    }

    // Initialize Player B
    if (this.videoPlayerB?.nativeElement) {
      this.playerB.hlsService.initialize(this.videoPlayerB.nativeElement);
      this.playerB.hlsService.onMetrics((metrics) => {
        this.ngZone.run(() => {
          this.playerB.stats = {
            bitrate: metrics.bitrate,
            quality: metrics.qualityLevel,
            bufferHealth: metrics.bufferHealth
          };
          this.cdr.detectChanges();
        });
      });
      this.playerB.hlsService.startMetricsUpdate();
    }
  }

  onPlayerAStreamChange() {
    if (this.playerA.selectedStream) {
      this.playerA.hlsService.loadSource(this.playerA.selectedStream);
    }
  }

  onPlayerBStreamChange() {
    if (this.playerB.selectedStream) {
      this.playerB.hlsService.loadSource(this.playerB.selectedStream);
      // Apply current throttling if any
      if (this.currentThrottle !== 'unlimited') {
        this.applyThrottling();
      }
    }
  }

  setNetworkThrottle(throttle: string) {
    this.currentThrottle = throttle;
    this.applyThrottling();
  }

  private applyThrottling() {
    // Apply network throttling to Player B only
    const throttleSettings = this.getThrottleSettings(this.currentThrottle);
    // Note: Network throttling would be implemented in the HlsService
    // For now, this is a placeholder for the throttling functionality
    if (throttleSettings && (this.playerB.hlsService as any).setNetworkThrottle) {
      (this.playerB.hlsService as any).setNetworkThrottle(throttleSettings);
    }
  }

  private getThrottleSettings(throttle: string) {
    switch (throttle) {
      case '3g':
        return { downloadBandwidth: 1000000, uploadBandwidth: 500000, latency: 300 }; // 1 Mbps down, 500 Kbps up, 300ms latency
      case '4g':
        return { downloadBandwidth: 5000000, uploadBandwidth: 2000000, latency: 100 }; // 5 Mbps down, 2 Mbps up, 100ms latency
      case 'wifi':
        return { downloadBandwidth: 25000000, uploadBandwidth: 10000000, latency: 20 }; // 25 Mbps down, 10 Mbps up, 20ms latency
      default:
        return null; // No throttling
    }
  }

  getThrottleLabel(throttle: string): string {
    switch (throttle) {
      case '3g': return '3G (1 Mbps)';
      case '4g': return '4G (5 Mbps)';
      case 'wifi': return 'WiFi (25 Mbps)';
      default: return 'Unlimited';
    }
  }

  getThrottleDescription(throttle: string): string {
    switch (throttle) {
      case '3g': return 'Simulates slow mobile connection with high latency';
      case '4g': return 'Simulates typical mobile 4G connection';
      case 'wifi': return 'Simulates fast WiFi connection';
      default: return 'No bandwidth or latency restrictions';
    }
  }

  // Sync playback controls
  syncPlay() {
    this.videoPlayerA?.nativeElement?.play();
    this.videoPlayerB?.nativeElement?.play();
  }

  syncPause() {
    this.videoPlayerA?.nativeElement?.pause();
    this.videoPlayerB?.nativeElement?.pause();
  }

  syncSeek() {
    const playerA = this.videoPlayerA?.nativeElement;
    const playerB = this.videoPlayerB?.nativeElement;
    if (playerA && playerB) {
      const currentTime = playerA.currentTime;
      playerB.currentTime = currentTime;
    }
  }

  // Metrics comparison helpers
  getMetricPercentage(metric: string, player: string): number {
    const playerStats = player === 'A' ? this.playerA.stats : this.playerB.stats;
    const otherStats = player === 'A' ? this.playerB.stats : this.playerA.stats;

    switch (metric) {
      case 'bitrate': {
        const maxBitrate = Math.max(playerStats.bitrate, otherStats.bitrate, 1);
        return (playerStats.bitrate / maxBitrate) * 100;
      }
      case 'buffer': {
        const maxBuffer = Math.max(playerStats.bufferHealth, otherStats.bufferHealth, 1);
        return (playerStats.bufferHealth / maxBuffer) * 100;
      }
      default:
        return 0;
    }
  }

  getStatusClass(stats: any): string {
    if (stats.bufferHealth > 5) return 'status-good';
    if (stats.bufferHealth > 2) return 'status-warning';
    return 'status-poor';
  }

  getStatusText(stats: any): string {
    if (stats.bufferHealth > 5) return 'Excellent';
    if (stats.bufferHealth > 2) return 'Good';
    return 'Poor';
  }

  applyNetworkThrottling() {
    // Legacy method for backward compatibility
    this.setNetworkThrottle(this.networkSpeed);
  }
}