/**
 * Dedicated module for Screen + Camera functionality
 * Provides optimized picture-in-picture recording
 */
class ScreenCameraRecorder {
    constructor() {
        this.screenStream = null;
        this.webcamStream = null;
        this.canvasStream = null;
        this.canvasInterval = null;
        this.canvas = null;
        this.ctx = null;
        this.settings = {
            position: 'bottom-right',
            size: 'medium',
            shape: 'rectangle',
            opacity: 1.0
        };
    }
    
    /**
     * Update settings for the camera overlay
     * @param {Object} settings - Position, size, shape and opacity settings
     */
    updateSettings(settings) {
        this.settings = { ...this.settings, ...settings };
        return this;
    }
    
    /**
     * Initialize the screen and camera streams
     * @param {MediaStream} screenStream - The screen capture stream
     * @returns {Promise} - Resolves when both streams are ready
     */
    async initialize(screenStream) {
        this.screenStream = screenStream;
        
        try {
            // Get webcam if not already available
            this.webcamStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false // We'll get audio from screen recording
            });
            
            return true;
        } catch (err) {
            console.error('Failed to access webcam:', err);
            return false;
        }
    }
    
    /**
     * Create a composite stream with screen and camera
     * @returns {Promise<MediaStream>} - The combined stream
     */
    async createCompositeStream() {
        if (!this.screenStream || !this.webcamStream) {
            throw new Error('Screen or webcam stream not initialized');
        }
        
        // Get screen video track settings
        const videoTrack = this.screenStream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();
        
        // Create optimized canvas for compositing
        const outputWidth = settings.width || 1920;
        const outputHeight = settings.height || 1080;
        const scaleFactor = outputWidth > 1920 ? 0.5 : 0.75; // Scale for performance
        
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', {
            alpha: false,
            desynchronized: true // Use for better performance
        });
        
        this.canvas.width = outputWidth * scaleFactor;
        this.canvas.height = outputHeight * scaleFactor;
        
        // Setup video elements
        const screenVideo = document.createElement('video');
        screenVideo.srcObject = this.screenStream;
        screenVideo.autoplay = true;
        screenVideo.muted = true;
        
        const webcamVideo = document.createElement('video');
        webcamVideo.srcObject = this.webcamStream;
        webcamVideo.autoplay = true;
        webcamVideo.muted = true;
        
        // Wait for videos to be ready
        await Promise.all([
            new Promise(r => screenVideo.onloadedmetadata = () => screenVideo.play().then(r)),
            new Promise(r => webcamVideo.onloadedmetadata = () => webcamVideo.play().then(r))
        ]);
        
        // Calculate PiP dimensions
        const dimensions = this._calculatePipDimensions(
            this.canvas.width,
            this.canvas.height,
            webcamVideo.videoWidth / webcamVideo.videoHeight,
            scaleFactor
        );
        
        // Create drawing function
        const drawFrame = () => {
            // Get current settings (may have changed)
            const { position, size, shape, opacity } = this.settings;
            
            // Recalculate dimensions if needed
            if (dimensions.size !== size || dimensions.position !== position) {
                Object.assign(dimensions, this._calculatePipDimensions(
                    this.canvas.width,
                    this.canvas.height,
                    webcamVideo.videoWidth / webcamVideo.videoHeight,
                    scaleFactor,
                    size,
                    position
                ));
            }
            
            // Clear canvas with black background
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw screen first
            this.ctx.drawImage(
                screenVideo, 
                0, 0, screenVideo.videoWidth, screenVideo.videoHeight, 
                0, 0, this.canvas.width, this.canvas.height
            );
            
            // Draw webcam with shape and opacity
            this._drawWebcamWithShape(
                this.ctx,
                webcamVideo,
                dimensions.x,
                dimensions.y,
                dimensions.width,
                dimensions.height,
                shape,
                opacity,
                scaleFactor
            );
        };
        
        // Set up optimized animation loop (30fps is sufficient for most cases)
        this.canvasInterval = setInterval(drawFrame, 1000 / 30);
        
        // Create stream from canvas
        this.canvasStream = this.canvas.captureStream(60);
        
        // Add all audio tracks from screen stream to ensure audio works
        this.screenStream.getAudioTracks().forEach(track => {
            this.canvasStream.addTrack(track.clone());
        });
        
        return this.canvasStream;
    }
    
    /**
     * Stop all streams and clean up resources
     */
    stop() {
        if (this.canvasInterval) {
            clearInterval(this.canvasInterval);
            this.canvasInterval = null;
        }
        
        // Don't stop the original streams as they're managed by the caller
        this.canvasStream = null;
        this.canvas = null;
        this.ctx = null;
    }
    
    /**
     * Calculate dimensions for the picture-in-picture overlay
     * @private
     */
    _calculatePipDimensions(canvasWidth, canvasHeight, aspectRatio, scaleFactor, size = 'medium', position = 'bottom-right') {
        const padding = 20 * scaleFactor;
        
        // Determine width based on size
        let width;
        switch (size) {
            case 'small':
                width = canvasWidth * 0.2;
                break;
            case 'large':
                width = canvasWidth * 0.35;
                break;
            case 'medium':
            default:
                width = canvasWidth * 0.25;
        }
        
        // Calculate height based on aspect ratio
        const height = width / aspectRatio;
        
        // Calculate position
        let x, y;
        switch (position) {
            case 'top-left':
                x = padding;
                y = padding;
                break;
            case 'top-right':
                x = canvasWidth - width - padding;
                y = padding;
                break;
            case 'bottom-left':
                x = padding;
                y = canvasHeight - height - padding;
                break;
            case 'bottom-right':
            default:
                x = canvasWidth - width - padding;
                y = canvasHeight - height - padding;
        }
        
        return { x, y, width, height, size, position };
    }
    
    /**
     * Draw webcam with the specified shape
     * @private
     */
    _drawWebcamWithShape(ctx, video, x, y, width, height, shape, opacity, scaleFactor) {
        ctx.save();
        
        // Apply clipping for shape
        switch (shape) {
            case 'rounded': {
                const radius = 16 * scaleFactor;
                ctx.beginPath();
                ctx.moveTo(x + radius, y);
                ctx.arcTo(x + width, y, x + width, y + height, radius);
                ctx.arcTo(x + width, y + height, x, y + height, radius);
                ctx.arcTo(x, y + height, x, y, radius);
                ctx.arcTo(x, y, x + width, y, radius);
                ctx.closePath();
                ctx.clip();
                break;
            }
            case 'circle': {
                const centerX = x + width / 2;
                const centerY = y + height / 2;
                const radiusX = width / 2;
                const radiusY = height / 2;
                
                ctx.beginPath();
                ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                break;
            }
            // Rectangle doesn't need clipping
        }
        
        // Apply opacity
        ctx.globalAlpha = opacity;
        
        // Draw webcam video
        ctx.drawImage(video, x, y, width, height);
        
        // Reset opacity
        ctx.globalAlpha = 1.0;
        ctx.restore();
        
        // Draw border based on shape
        ctx.strokeStyle = '#4361ee';
        ctx.lineWidth = 3 * scaleFactor;
        
        switch (shape) {
            case 'rounded': {
                const radius = 16 * scaleFactor;
                ctx.beginPath();
                ctx.moveTo(x + radius, y);
                ctx.arcTo(x + width, y, x + width, y + height, radius);
                ctx.arcTo(x + width, y + height, x, y + height, radius);
                ctx.arcTo(x, y + height, x, y, radius);
                ctx.arcTo(x, y, x + width, y, radius);
                ctx.closePath();
                ctx.stroke();
                break;
            }
            case 'circle': {
                const centerX = x + width / 2;
                const centerY = y + height / 2;
                const radiusX = width / 2;
                const radiusY = height / 2;
                
                ctx.beginPath();
                ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
                ctx.closePath();
                ctx.stroke();
                break;
            }
            default:
                ctx.strokeRect(x, y, width, height);
        }
    }
    
    /**
     * Get a clone of the webcam stream (for preview)
     */
    getWebcamStream() {
        return this.webcamStream;
    }
}

// Export the class
window.ScreenCameraRecorder = ScreenCameraRecorder;
