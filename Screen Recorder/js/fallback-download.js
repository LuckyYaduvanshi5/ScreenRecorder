/**
 * A fallback solution for downloading screen recordings
 * when FFmpeg conversion fails
 */

// Function to check if a browser supports downloading WebM
function browserSupportsWebM() {
    const videoElement = document.createElement('video');
    return videoElement.canPlayType('video/webm') !== '';
}

// Function to download a recording in the original format
function downloadOriginalRecording(recordedChunks) {
    if (!recordedChunks || recordedChunks.length === 0) {
        console.error('No recording data available');
        return;
    }
    
    try {
        // Create blob from chunks
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `screen-recording-${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.webm`;
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        return true;
    } catch (error) {
        console.error('Fallback download failed:', error);
        return false;
    }
}

// Add these functions to window for access from main app
window.browserSupportsWebM = browserSupportsWebM;
window.downloadOriginalRecording = downloadOriginalRecording;
