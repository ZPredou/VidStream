import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MuxService, VideoMetadata, ConversionProgress } from '../services/mux.service';

export interface DemoStream {
  name: string;
  url: string;
  description: string;
  type: 'hls' | 'mp4';
  quality: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent {
  uploadProgress: ConversionProgress | null = null;
  isProcessing = false;

  // Demo metrics for the external template
  demoMetrics = {
    bitrate: 2500,
    quality: 'Auto (1080p)',
    buffer: 8.5,
    progress: 75
  };

  // Available streams for the external template
  availableStreams = [
    {
      title: "Big Buck Bunny",
      url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      description: "Classic test video with multiple quality levels for adaptive streaming",
      thumbnail: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg",
      duration: "10:34",
      resolution: "Multi-bitrate"
    },
    {
      title: "Sintel 4K",
      url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
      description: "High-quality 4K content perfect for testing streaming performance",
      thumbnail: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg",
      duration: "14:48",
      resolution: "4K UHD"
    },
    {
      title: "Tears of Steel",
      url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
      description: "Professional quality content with multiple audio tracks",
      thumbnail: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg",
      duration: "12:14",
      resolution: "HD"
    }
  ];

  // Keep the old demoStreams for backward compatibility
  demoStreams: DemoStream[] = [
    {
      name: "Big Buck Bunny",
      url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      description: "Classic test video with multiple quality levels for adaptive streaming",
      type: "hls",
      quality: "Multi-bitrate"
    },
    {
      name: "Sintel 4K",
      url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
      description: "High-quality 4K content perfect for testing streaming performance",
      type: "hls",
      quality: "4K UHD"
    },
    {
      name: "Tears of Steel",
      url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
      description: "Professional quality content with multiple audio tracks",
      type: "hls",
      quality: "HD"
    }
  ];

  constructor(
    private readonly router: Router,
    private readonly muxService: MuxService
  ) {}

  // Method for external template
  selectStream(stream: any) {
    this.router.navigate(['/player'], {
      state: { stream }
    });
  }

  // Method for external template
  openInComparison(stream: any) {
    this.router.navigate(['/comparison'], {
      state: { stream }
    });
  }

  // Method for external template
  scrollToStreams() {
    const element = document.querySelector('.streams-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Keep the old method for backward compatibility
  playStream(stream: DemoStream) {
    this.router.navigate(['/player'], {
      queryParams: {
        url: stream.url,
        name: stream.name,
        type: stream.type
      }
    });
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (!this.muxService.isFormatSupported(file)) {
      alert('Unsupported file format. Please select a video file.');
      return;
    }

    this.isProcessing = true;
    this.uploadProgress = null;

    try {
      // Extract metadata first
      const metadata: VideoMetadata = await this.muxService.extractMetadata(file);
      console.log('Video metadata:', metadata);

      // Convert file using mux.js
      const convertedData = await this.muxService.convertMp4ToTs(file, (progress) => {
        this.uploadProgress = progress;
      });

      // Create blob URL for the converted data
      const blobUrl = this.muxService.createBlobUrl(convertedData);

      // Navigate to player with converted stream
      this.router.navigate(['/player'], {
        queryParams: {
          url: blobUrl,
          name: `${file.name} (Converted)`,
          type: 'converted',
          originalFile: file.name
        }
      });

    } catch (error) {
      console.error('File processing failed:', error);
      alert('Failed to process the video file. Please try another file.');
    } finally {
      this.isProcessing = false;
      this.uploadProgress = null;
    }
  }
}
