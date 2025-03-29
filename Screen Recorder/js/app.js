document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const micAudio = document.getElementById('micAudio');
    const systemAudio = document.getElementById('systemAudio');
    const preview = document.getElementById('preview');
    const placeholder = document.getElementById('placeholder');
    const recordingStatus = document.getElementById('recordingStatus');
    const recordingTime = document.getElementById('recordingTime');
    const conversionStatus = document.getElementById('conversionStatus');
    const conversionTool = document.getElementById('conversionTool');
    const convertNowBtn = document.getElementById('convertNowBtn'); // New button for direct conversion

    // Recording variables
    let mediaRecorder;
    let recordedChunks = [];
    let stream = null;
    let startTime = 0;
    let timerInterval = null;
    let recordedBlob = null;
    
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

    // Start recording function
    async function startRecording() {
        // Hide converter tool when starting new recording
        conversionTool.classList.add('hidden');
        
        // Reset blobs and UI
        recordedBlob = null;
        downloadBtn.disabled = true;
        
        recordedChunks = [];
        let displayMediaOptions = { video: { cursor: "always" }, audio: false };

        // Set audio settings
        if (systemAudio.checked) {
            displayMediaOptions.audio = true;
        }

        try {
            // Get screen capture stream
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

            // Combine all streams if needed
            if (streams.length > 1) {
                const audioContext = new AudioContext();
                const destination = audioContext.createMediaStreamDestination();
                
                streams.forEach(stream => {
                    stream.getAudioTracks().forEach(track => {
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
            } else {
                stream = streams[0];
            }

            // Show the preview and hide placeholder
            preview.style.display = 'block';
            placeholder.style.display = 'none';
            preview.srcObject = stream;

            // Create media recorder
            mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9,opus'
            });

            // Set up event handlers
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    recordedChunks.push(e.data);
                }
            };

            // Handle recording stop - SIMPLIFIED WITHOUT AUTOMATIC CONVERSION
            mediaRecorder.onstop = () => {
                recordingStatus.classList.add('hidden');
                clearInterval(timerInterval);
                
                // Create the WebM blob
                recordedBlob = new Blob(recordedChunks, { type: 'video/webm' });
                
                // Enable download button
                downloadBtn.disabled = false;
                
                // Show the conversion button/link
                conversionTool.classList.remove('hidden');
                
                // If converter tool has a setFile function, use it
                if (window.setConverterFile && recordedBlob) {
                    window.setConverterFile(recordedBlob);
                }
                
                // Clean up tracks
                stream.getTracks().forEach(track => track.stop());
            };

            // Start recording
            mediaRecorder.start(1000); // Collect data every second
            startTime = Date.now();
            timerInterval = setInterval(updateTimer, 1000);
            
            // Update UI
            startBtn.disabled = true;
            stopBtn.disabled = false;
            recordingStatus.classList.remove('hidden');
            
            // Allow user to stop when they close the screen share
            screenStream.getVideoTracks()[0].onended = () => {
                stopRecording();
            };

        } catch (err) {
            console.error("Error starting screen capture:", err);
            alert("Error starting screen capture. Please try again.");
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
    
    // Add event listener to the convert now button if it exists
    if (convertNowBtn) {
        convertNowBtn.addEventListener('click', openCloudConvert);
    }
});
