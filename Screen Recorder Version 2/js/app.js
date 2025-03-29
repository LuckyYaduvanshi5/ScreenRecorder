document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const micAudio = document.getElementById('micAudio');
    const systemAudio = document.getElementById('systemAudio');
    const videoQuality = document.getElementById('videoQuality');
    const frameRate = document.getElementById('frameRate');
    const bitrate = document.getElementById('bitrate');
    const preview = document.getElementById('preview');
    const placeholder = document.getElementById('placeholder');
    const recordingStatus = document.getElementById('recordingStatus');
    const recordingTime = document.getElementById('recordingTime');
    const conversionStatus = document.getElementById('conversionStatus');
    const conversionTool = document.getElementById('conversionTool');
    const convertNowBtn = document.getElementById('convertNowBtn');
    
    // Mode selector elements
    const screenMode = document.getElementById('screenMode');
    const webcamMode = document.getElementById('webcamMode');
    const pipMode = document.getElementById('pipMode');
    const pipControls = document.getElementById('pipControls');
    const pipPosition = document.getElementById('pipPosition');
    const pipSize = document.getElementById('pipSize');
    const webcamContainer = document.getElementById('webcamContainer');
    const webcamVideo = document.getElementById('webcamVideo');
    const pipShape = document.getElementById('pipShape');
    const pipOpacity = document.getElementById('pipOpacity');
    const opacityValue = document.getElementById('opacityValue');

    // Recording variables
    let mediaRecorder;
    let recordedChunks = [];
    let stream = null;
    let webcamStream = null;
    let startTime = 0;
    let timerInterval = null;
    let recordedBlob = null;
    let pipOverlay = null;
    let canvasStream = null;
    let canvasInterval = null;
    
    // Function to format recording time
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        seconds = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Update the recording timer
    function updateTimer() {
        const currentTime = (Date.now() - startTime) / 1000;
        recordingTime.textContent = formatTime(currentTime);
    }
    
    // Get recording mode
    function getRecordingMode() {
        if (screenMode.checked) return 'screen';
        if (webcamMode.checked) return 'webcam';
        if (pipMode.checked) return 'pip';
        return 'screen'; // Default
    }
    
    // Show/hide PiP controls based on mode
    function updateUIForMode() {
        const mode = getRecordingMode();
        
        // Update labels to reflect "Screen + Camera" instead of PiP
        document.querySelectorAll('.mode-item label').forEach(label => {
            if (label.getAttribute('for') === 'pipMode' && label.textContent === 'Picture-in-Picture') {
                label.textContent = 'Screen + Camera';
            }
        });
        
        if (mode === 'pip') {
            pipControls.classList.remove('hidden');
        } else {
            pipControls.classList.add('hidden');
        }
        
        // Show appropriate preview based on mode
        if (mode === 'webcam') {
            preview.style.display = 'none';
            placeholder.style.display = 'none';
            webcamContainer.classList.remove('hidden');
            
            // Start webcam preview
            startWebcamPreview();
        } else {
            webcamContainer.classList.add('hidden');
            
            if (stream) {
                preview.style.display = 'block';
                placeholder.style.display = 'none';
            } else {
                preview.style.display = 'none';
                placeholder.style.display = 'flex';
            }
            
            // Stop webcam preview if not in webcam or PiP mode
            if (mode !== 'pip' && webcamStream) {
                stopWebcamStream();
            }
        }
    }
    
    // Start webcam preview
    async function startWebcamPreview() {
        try {
            if (!webcamStream) {
                webcamStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false
                });
            }
            webcamVideo.srcObject = webcamStream;
        } catch (err) {
            console.error('Error accessing webcam:', err);
            alert('Could not access webcam. Please check permissions and try again.');
        }
    }
    
    // Stop webcam stream
    function stopWebcamStream() {
        if (webcamStream) {
            webcamStream.getTracks().forEach(track => track.stop());
            webcamStream = null;
            webcamVideo.srcObject = null;
        }
    }
    
    // Create PiP overlay with updated shape and opacity options
    function createPipOverlay() {
        if (pipOverlay) {
            preview.parentElement.removeChild(pipOverlay);
        }
        
        // Create overlay div
        pipOverlay = document.createElement('div');
        pipOverlay.className = `pip-overlay pip-${pipSize.value} pip-${pipPosition.value} pip-shape-${pipShape.value}`;
        
        // Set opacity from range input
        const opacity = pipOpacity.value / 100;
        pipOverlay.style.opacity = opacity;
        
        // Create video element for the webcam
        const pipVideo = document.createElement('video');
        pipVideo.autoplay = true;
        pipVideo.muted = true;
        pipVideo.style.width = '100%';
        pipVideo.style.height = '100%';
        
        // Add to DOM
        pipOverlay.appendChild(pipVideo);
        preview.parentElement.appendChild(pipOverlay);
        
        return pipVideo;
    }
    
    // Setup canvas for picture-in-picture recording
    async function setupPipRecording(screenStream) {
        // Create canvas with screen stream dimensions
        const videoTrack = screenStream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();
        
        // Get webcam stream if not already available
        if (!webcamStream) {
            try {
                webcamStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false // Don't capture audio from webcam separately
                });
            } catch (err) {
                console.error('Error accessing webcam for Screen + Camera:', err);
                alert('Could not access webcam for Screen + Camera mode. Recording screen only.');
                return { combinedStream: screenStream };
            }
        }
        
        // Create a video element for the webcam
        const webcamVideo = document.createElement('video');
        webcamVideo.srcObject = webcamStream;
        webcamVideo.autoplay = true;
        webcamVideo.muted = true;
        
        // Wait for webcam video to be ready
        await new Promise(resolve => {
            webcamVideo.onloadedmetadata = () => {
                webcamVideo.play().then(resolve);
            };
        });
        
        // Performance optimization: Use a lower canvas resolution for compositing
        // while maintaining the screen resolution for output
        const outputWidth = settings.width || 1920;
        const outputHeight = settings.height || 1080;
        const canvasScaleFactor = 0.5; // Scale to 50% for better performance
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true }); // Performance optimizations
        
        canvas.width = outputWidth * canvasScaleFactor;
        canvas.height = outputHeight * canvasScaleFactor;
        
        // Calculate PiP dimensions and position
        let pipWidth, pipHeight, pipX, pipY;
        const padding = 20 * canvasScaleFactor;
        
        // Size based on selection
        switch (pipSize.value) {
            case 'small':
                pipWidth = canvas.width * 0.2;
                break;
            case 'large':
                pipWidth = canvas.width * 0.4;
                break;
            case 'medium':
            default:
                pipWidth = canvas.width * 0.3;
        }
        
        // Maintain webcam aspect ratio
        const webcamAspect = webcamVideo.videoWidth / webcamVideo.videoHeight;
        pipHeight = pipWidth / webcamAspect;
        
        // Position based on selection
        switch (pipPosition.value) {
            case 'top-left':
                pipX = padding;
                pipY = padding;
                break;
            case 'top-right':
                pipX = canvas.width - pipWidth - padding;
                pipY = padding;
                break;
            case 'bottom-left':
                pipX = padding;
                pipY = canvas.height - pipHeight - padding;
                break;
            case 'bottom-right':
            default:
                pipX = canvas.width - pipWidth - padding;
                pipY = canvas.height - pipHeight - padding;
        }
        
        // Create a video element for the screen
        const screenVideo = document.createElement('video');
        screenVideo.srcObject = screenStream;
        screenVideo.autoplay = true;
        screenVideo.muted = true;
        
        // Wait for screen video to be ready
        await new Promise(resolve => {
            screenVideo.onloadedmetadata = () => {
                screenVideo.play().then(resolve);
            };
        });
        
        // Get opacity value
        const opacity = pipOpacity.value / 100;
        
        // Function to draw frame with proper clipping for different shapes
        function drawFrame() {
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw screen (scaled)
            ctx.drawImage(
                screenVideo, 
                0, 0, screenVideo.videoWidth, screenVideo.videoHeight, 
                0, 0, canvas.width, canvas.height
            );
            
            // Save context for clipping
            ctx.save();
            
            // Apply clipping based on shape
            const shape = pipShape.value;
            if (shape === 'rounded') {
                // Rounded rectangle
                const radius = 16 * canvasScaleFactor;
                ctx.beginPath();
                ctx.moveTo(pipX + radius, pipY);
                ctx.arcTo(pipX + pipWidth, pipY, pipX + pipWidth, pipY + pipHeight, radius);
                ctx.arcTo(pipX + pipWidth, pipY + pipHeight, pipX, pipY + pipHeight, radius);
                ctx.arcTo(pipX, pipY + pipHeight, pipX, pipY, radius);
                ctx.arcTo(pipX, pipY, pipX + pipWidth, pipY, radius);
                ctx.closePath();
                ctx.clip();
            } else if (shape === 'circle') {
                // Circle or oval
                const centerX = pipX + pipWidth / 2;
                const centerY = pipY + pipHeight / 2;
                const radiusX = pipWidth / 2;
                const radiusY = pipHeight / 2;
                
                ctx.beginPath();
                ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
            }
            // Rectangle doesn't need clipping
            
            // Apply global alpha for opacity
            ctx.globalAlpha = opacity;
            
            // Draw webcam video
            ctx.drawImage(webcamVideo, pipX, pipY, pipWidth, pipHeight);
            
            // Restore context
            ctx.globalAlpha = 1.0;
            ctx.restore();
            
            // Draw border around PiP
            ctx.strokeStyle = '#4361ee';
            ctx.lineWidth = 3 * canvasScaleFactor;
            
            if (shape === 'rounded') {
                const radius = 16 * canvasScaleFactor;
                ctx.beginPath();
                ctx.moveTo(pipX + radius, pipY);
                ctx.arcTo(pipX + pipWidth, pipY, pipX + pipWidth, pipY + pipHeight, radius);
                ctx.arcTo(pipX + pipWidth, pipY + pipHeight, pipX, pipY + pipHeight, radius);
                ctx.arcTo(pipX, pipY + pipHeight, pipX, pipY, radius);
                ctx.arcTo(pipX, pipY, pipX + pipWidth, pipY, radius);
                ctx.closePath();
                ctx.stroke();
            } else if (shape === 'circle') {
                const centerX = pipX + pipWidth / 2;
                const centerY = pipY + pipHeight / 2;
                const radiusX = pipWidth / 2;
                const radiusY = pipHeight / 2;
                
                ctx.beginPath();
                ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
                ctx.closePath();
                ctx.stroke();
            } else {
                // Rectangle
                ctx.strokeRect(pipX, pipY, pipWidth, pipHeight);
            }
        }
        
        // For better performance: optimize the frame rate based on device capability
        // Use 30fps for better performance, adjust if needed
        const frameRate = 30;
        canvasInterval = setInterval(drawFrame, 1000 / frameRate);
        
        // Create a higher quality stream from canvas
        canvasStream = canvas.captureStream(60); // Use 60fps as target, browser will optimize
        
        // IMPORTANT: Add ALL audio tracks from screenStream to canvasStream
        // This fixes the missing audio issue
        screenStream.getAudioTracks().forEach(track => {
            canvasStream.addTrack(track.clone());
        });
        
        return {
            combinedStream: canvasStream,
            cleanup: () => {
                clearInterval(canvasInterval);
                canvasInterval = null;
                canvasStream = null;
            }
        };
    }
    
    // Get video constraints based on selected quality
    function getVideoConstraints() {
        // Resolution constraints
        let width, height;
        switch(videoQuality.value) {
            case '4k':
                width = 3840;
                height = 2160;
                break;
            case '2k':
                width = 2560;
                height = 1440;
                break;
            case '1080p':
                width = 1920;
                height = 1080;
                break;
            case '720p':
            default:
                width = 1280;
                height = 720;
        }
        
        // Frame rate
        const fps = parseInt(frameRate.value);
        
        console.log(`Setting video quality: ${width}x${height} @ ${fps}fps`);
        
        return {
            width: { ideal: width },
            height: { ideal: height },
            frameRate: { ideal: fps }
        };
    }

    // Start recording function
    async function startRecording() {
        try {
            // Hide converter tool when starting new recording
            conversionTool.classList.add('hidden');
            
            // Reset blobs and UI
            recordedBlob = null;
            downloadBtn.disabled = true;
            recordedChunks = [];
            
            // Get the recording mode
            const mode = getRecordingMode();
            
            // Different handling based on mode
            if (mode === 'webcam') {
                // Webcam-only recording
                try {
                    if (!webcamStream) {
                        webcamStream = await navigator.mediaDevices.getUserMedia({
                            video: true,
                            audio: micAudio.checked
                        });
                    }
                    
                    stream = webcamStream;
                    webcamVideo.srcObject = webcamStream;
                } catch (err) {
                    console.error('Error accessing webcam:', err);
                    alert('Could not access webcam. Please check permissions and try again.');
                    return;
                }
            } else {
                // Screen recording (with or without PiP)
                // Get video constraints based on quality settings
                const videoConstraints = getVideoConstraints();
                
                // Prepare display media options
                let displayMediaOptions = { 
                    video: {
                        cursor: "always",
                        ...videoConstraints
                    }, 
                    audio: systemAudio.checked
                };
    
                // Get screen capture stream with the configured options
                const screenStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
                
                // Set up streams array
                const streams = [screenStream];
    
                // Add microphone if selected
                if (micAudio.checked) {
                    try {
                        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                        streams.push(micStream);
                    } catch (err) {
                        console.error('Error accessing microphone:', err);
                        alert('Could not access microphone. Recording without mic audio.');
                    }
                }
    
                // Special handling for PiP mode
                if (mode === 'pip') {
                    const { combinedStream, cleanup } = await setupPipRecording(screenStream);
                    stream = combinedStream;
                    
                    // Create visual PiP overlay for preview
                    const pipVideo = createPipOverlay();
                    
                    // Start webcam for PiP preview
                    await startWebcamPreview();
                    pipVideo.srcObject = webcamStream;
                } else {
                    // Regular screen recording - combine all streams if needed
                    if (streams.length > 1) {
                        try {
                            const audioContext = new AudioContext();
                            const destination = audioContext.createMediaStreamDestination();
                            
                            streams.forEach(s => {
                                s.getAudioTracks().forEach(track => {
                                    const source = audioContext.createMediaStreamSource(new MediaStream([track]));
                                    source.connect(destination);
                                });
                            });
            
                            // Create a new combined stream
                            const combinedStream = new MediaStream([
                                ...screenStream.getVideoTracks(),
                                ...destination.stream.getAudioTracks()
                            ]);
                            stream = combinedStream;
                        } catch (err) {
                            console.error('Error combining audio streams:', err);
                            stream = screenStream; // Fallback to screen stream only
                        }
                    } else {
                        stream = streams[0];
                    }
                }
                
                // Show the preview and hide placeholder
                preview.style.display = 'block';
                placeholder.style.display = 'none';
                preview.srcObject = stream;
            }

            // Set up MediaRecorder with selected quality
            let bitrateValue;
            switch(bitrate.value) {
                case 'high': bitrateValue = 16000000; break; // 16 Mbps
                case 'low': bitrateValue = 3000000; break;   // 3 Mbps
                case 'medium': default: bitrateValue = 8000000; // 8 Mbps
            }
            
            // Create MediaRecorder with appropriate settings
            try {
                const options = {
                    mimeType: 'video/webm;codecs=vp9,opus',
                    videoBitsPerSecond: bitrateValue, 
                    audioBitsPerSecond: 128000 // 128 kbps audio
                };
                mediaRecorder = new MediaRecorder(stream, options);
                console.log(`Using ${mode} recording with bitrate:`, bitrateValue);
            } catch (e) {
                console.warn('High-quality options not supported, using standard settings:', e);
                mediaRecorder = new MediaRecorder(stream);
            }

            // Set up event handlers for media recorder
            mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    recordedChunks.push(e.data);
                }
            };

            // Handle recording stop
            mediaRecorder.onstop = () => {
                recordingStatus.classList.add('hidden');
                clearInterval(timerInterval);
                
                // Cleanup PiP canvas interval if active
                if (canvasInterval) {
                    clearInterval(canvasInterval);
                    canvasInterval = null;
                }
                
                // Remove PiP overlay if exists
                if (pipOverlay) {
                    preview.parentElement.removeChild(pipOverlay);
                    pipOverlay = null;
                }
                
                // Create the WebM blob
                recordedBlob = new Blob(recordedChunks, { type: 'video/webm' });
                
                // Update file size info
                const fileSizeMB = (recordedBlob.size / (1024 * 1024)).toFixed(2);
                console.log(`Recording completed: ${fileSizeMB} MB`);
                
                // Enable download button
                downloadBtn.disabled = false;
                
                // Show the conversion button/link
                conversionTool.classList.remove('hidden');
                
                // Clean up tracks
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
                
                // Don't stop webcam stream in webcam mode if preview is still needed
                if (getRecordingMode() !== 'webcam') {
                    stopWebcamStream();
                }
            };

            // Start recording
            mediaRecorder.start(1000); // Collect data every second
            startTime = Date.now();
            timerInterval = setInterval(updateTimer, 1000);
            
            // Update UI
            startBtn.disabled = true;
            stopBtn.disabled = false;
            recordingStatus.classList.remove('hidden');
            
            // Remove any previous quality indicator
            const oldIndicator = recordingStatus.querySelector('.quality-indicator');
            if (oldIndicator) {
                recordingStatus.removeChild(oldIndicator);
            }
            
            // Add recording mode and quality indicator
            const qualityText = document.createElement('span');
            qualityText.className = 'quality-indicator';
            qualityText.innerHTML = `<i class="fas fa-${mode === 'webcam' ? 'video' : mode === 'pip' ? 'clone' : 'desktop'}"></i> ${mode.toUpperCase()} ${mode !== 'webcam' ? `@ ${videoQuality.value}` : ''}`;
            recordingStatus.appendChild(qualityText);
            
            // Allow user to stop when they close the screen share (if in screen or pip mode)
            if (mode !== 'webcam' && stream.getVideoTracks().length > 0) {
                stream.getVideoTracks()[0].onended = () => {
                    stopRecording();
                };
            }

        } catch (err) {
            console.error("Error starting recording:", err);
            alert("Error starting recording. Please try again.");
        }
    }

    // Stop recording function
    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            startBtn.disabled = false;
            stopBtn.disabled = true;
        }
    }

    // Download recording function (WebM only)
    function downloadRecording() {
        if (!recordedBlob) {
            console.error('No recording to download');
            return;
        }
        
        try {
            const url = URL.createObjectURL(recordedBlob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `screen-recording-${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.webm`;
            
            document.body.appendChild(a);
            a.click();
            
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download the recording. Please try again.');
        }
    }

    // Direct link to CloudConvert
    function openCloudConvert() {
        window.open('https://cloudconvert.com/webm-to-mp4', '_blank');
    }

    // Event listeners
    startBtn.addEventListener('click', startRecording);
    stopBtn.addEventListener('click', stopRecording);
    downloadBtn.addEventListener('click', downloadRecording);
    
    // Add event listeners for mode changes
    screenMode.addEventListener('change', updateUIForMode);
    webcamMode.addEventListener('change', updateUIForMode);
    pipMode.addEventListener('change', updateUIForMode);
    
    // Add event listeners for PiP position and size changes
    pipPosition.addEventListener('change', updatePipOverlay);
    pipSize.addEventListener('change', updatePipOverlay);
    
    // New event listeners for shape and opacity
    if (pipShape) {
        pipShape.addEventListener('change', updatePipOverlay);
    }

    if (pipOpacity) {
        pipOpacity.addEventListener('input', () => {
            // Update opacity value display
            if (opacityValue) {
                opacityValue.textContent = `${pipOpacity.value}%`;
            }
            updatePipOverlay();
        });
    }
    
    // Update PiP overlay when settings change
    function updatePipOverlay() {
        if (!pipOverlay) return;
        
        // Update position classes
        const posClasses = ['pip-top-right', 'pip-top-left', 'pip-bottom-right', 'pip-bottom-left'];
        posClasses.forEach(cls => pipOverlay.classList.remove(cls));
        pipOverlay.classList.add(`pip-${pipPosition.value}`);
        
        // Update size classes
        const sizeClasses = ['pip-small', 'pip-medium', 'pip-large'];
        sizeClasses.forEach(cls => pipOverlay.classList.remove(cls));
        pipOverlay.classList.add(`pip-${pipSize.value}`);
        
        // Update shape classes if shape control exists
        if (pipShape) {
            const shapeClasses = ['pip-shape-rectangle', 'pip-shape-rounded', 'pip-shape-circle'];
            shapeClasses.forEach(cls => pipOverlay.classList.remove(cls));
            pipOverlay.classList.add(`pip-shape-${pipShape.value}`);
        }
        
        // Update opacity if opacity control exists
        if (pipOpacity) {
            pipOverlay.style.opacity = pipOpacity.value / 100;
        }
    }
    
    // Add event listener to the convert now button if it exists
    if (convertNowBtn) {
        convertNowBtn.addEventListener('click', openCloudConvert);
    }
    
    // Initialize UI based on default mode
    updateUIForMode();
    setupPipUIHandlers();
    
    // Add tooltip to explain quality settings
    const qualityItems = document.querySelectorAll('.quality-item');
    qualityItems.forEach(item => {
        const tooltip = document.createElement('span');
        tooltip.className = 'tooltip';
        tooltip.textContent = item.querySelector('label').textContent === 'Resolution:' ? 
            'Higher resolution = better quality, larger file size' :
            item.querySelector('label').textContent === 'Frame Rate:' ?
            'Higher frame rate = smoother video, larger file size' :
            'Higher quality = better visual fidelity, larger file size';
        item.appendChild(tooltip);
        
        item.addEventListener('mouseenter', () => {
            tooltip.style.visibility = 'visible';
            tooltip.style.opacity = '1';
        });
        
        item.addEventListener('mouseleave', () => {
            tooltip.style.visibility = 'hidden';
            tooltip.style.opacity = '0';
        });
    });
    
    // Add this function to set up PiP UI handlers
    function setupPipUIHandlers() {
        // Add tooltips for PiP controls if they exist
        const pipControlItems = document.querySelectorAll('.pip-control-item');
        pipControlItems.forEach(item => {
            const label = item.querySelector('label');
            if (!label) return;
            
            const tooltip = document.createElement('span');
            tooltip.className = 'tooltip';
            
            switch(label.getAttribute('for')) {
                case 'pipPosition':
                    tooltip.textContent = 'Choose where to display your webcam on the screen';
                    break;
                case 'pipSize':
                    tooltip.textContent = 'Set the size of your webcam overlay';
                    break;
                case 'pipShape':
                    tooltip.textContent = 'Change the shape of your webcam overlay';
                    break;
                case 'pipOpacity':
                    tooltip.textContent = 'Adjust the transparency of your webcam overlay';
                    break;
            }
            
            if (tooltip.textContent) {
                item.appendChild(tooltip);
                
                item.addEventListener('mouseenter', () => {
                    tooltip.style.visibility = 'visible';
                    tooltip.style.opacity = '1';
                });
                
                item.addEventListener('mouseleave', () => {
                    tooltip.style.visibility = 'hidden';
                    tooltip.style.opacity = '0';
                });
            }
        });
    }

    // Call the setup function
    setupPipUIHandlers();
});
