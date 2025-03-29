/**
 * Dedicated WebM to MP4 converter tool
 * Using direct website links instead of form submission
 */
document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const videoFileUpload = document.getElementById('videoFileUpload');
    const selectedFileName = document.getElementById('selectedFileName');
    const convertBtn = document.getElementById('convertBtn');
    const conversionProgress = document.getElementById('conversionProgress');
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    
    // Variables
    let selectedFile = null;
    
    // Function to update progress bar
    function updateProgress(percent) {
        progressFill.style.width = `${percent}%`;
        progressText.textContent = `Converting: ${percent}%`;
    }
    
    // Function to set a file programmatically (used from app.js)
    window.setConverterFile = function(blob) {
        if (!blob) return;
        
        // Create a File object from the Blob
        const fileName = `recording-${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.webm`;
        const file = new File([blob], fileName, { type: 'video/webm' });
        
        // Set as selected file
        selectedFile = file;
        selectedFileName.textContent = file.name;
        convertBtn.disabled = false;
    };
    
    // Handle file selection
    videoFileUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.type !== 'video/webm') {
            alert('Please select a WebM video file.');
            return;
        }
        
        selectedFile = file;
        selectedFileName.textContent = file.name;
        convertBtn.disabled = false;
    });
    
    // Define converter options
    const converterOptions = [
        {
            name: 'Convertio',
            url: 'https://convertio.co/webm-mp4/',
            instructions: '1. Click "Choose Files" and select your WebM recording\n2. Click "Convert" button\n3. Click "Download" when conversion is complete'
        },
        {
            name: 'EZGif',
            url: 'https://ezgif.com/webm-to-mp4',
            instructions: '1. Click "Choose File" and select your WebM recording\n2. Click "Upload video!" button\n3. Click "Convert to MP4!" button\n4. Click "Save" to download the MP4 file'
        },
        {
            name: 'Online-Convert',
            url: 'https://www.online-convert.com/webm-to-mp4',
            instructions: '1. Click "Choose Files" and select your WebM recording\n2. Click "Start" button\n3. Click "Download" when conversion is complete'
        }
    ];
    
    // Open the website for conversion rather than sending the form
    function openConverterWebsite(selectedOption = 0) {
        const option = converterOptions[selectedOption];
        
        // Open the converter website in a new tab
        window.open(option.url, '_blank');
        
        // Show instructions
        alert(`A new tab has opened with ${option.name}. Please follow these steps:\n\n${option.instructions}`);
        
        updateProgress(100);
    }
    
    // Handle conversion button click
    convertBtn.addEventListener('click', async () => {
        if (!selectedFile) {
            alert('Please select a WebM video file first.');
            return;
        }
        
        // Show progress
        conversionProgress.classList.remove('hidden');
        updateProgress(0);
        
        try {
            convertBtn.disabled = true;
            
            // Show converter options dialog
            const optionIndex = await showConverterOptions();
            openConverterWebsite(optionIndex);
            
            // Reset UI after a delay
            setTimeout(() => {
                conversionProgress.classList.add('hidden');
                convertBtn.disabled = false;
            }, 2000);
            
        } catch (error) {
            console.error('Failed to open conversion service:', error);
            conversionProgress.classList.add('hidden');
            convertBtn.disabled = false;
        }
    });
    
    // Show converter options to the user
    function showConverterOptions() {
        return new Promise((resolve) => {
            // Create a custom dialog for converter selection
            const dialog = document.createElement('div');
            dialog.className = 'converter-selection-dialog';
            dialog.innerHTML = `
                <div class="dialog-content">
                    <h3>Choose Converter Service</h3>
                    <p>Please select one of the following services to convert your WebM file to MP4:</p>
                    <div class="converter-options">
                        ${converterOptions.map((option, index) => `
                            <button class="converter-option btn" data-index="${index}">
                                <span>${option.name}</span>
                            </button>
                        `).join('')}
                    </div>
                    <div class="dialog-footer">
                        <button class="btn cancel-btn">Cancel</button>
                    </div>
                </div>
            `;
            
            // Style the dialog
            dialog.style.position = 'fixed';
            dialog.style.top = '0';
            dialog.style.left = '0';
            dialog.style.width = '100%';
            dialog.style.height = '100%';
            dialog.style.backgroundColor = 'rgba(0,0,0,0.7)';
            dialog.style.zIndex = '9999';
            dialog.style.display = 'flex';
            dialog.style.justifyContent = 'center';
            dialog.style.alignItems = 'center';
            
            // Add to document
            document.body.appendChild(dialog);
            
            // Add event listeners to options
            const options = dialog.querySelectorAll('.converter-option');
            options.forEach(option => {
                option.addEventListener('click', () => {
                    const index = parseInt(option.dataset.index);
                    document.body.removeChild(dialog);
                    resolve(index);
                });
            });
            
            // Cancel button
            const cancelBtn = dialog.querySelector('.cancel-btn');
            cancelBtn.addEventListener('click', () => {
                document.body.removeChild(dialog);
                resolve(0); // Default to first option if cancelled
            });
        });
    }
    
    // Add styles for the converter dialog
    const style = document.createElement('style');
    style.textContent = `
        .converter-selection-dialog .dialog-content {
            background-color: white;
            padding: 30px;
            border-radius: 12px;
            max-width: 500px;
            width: 90%;
        }
        
        .converter-selection-dialog h3 {
            margin-top: 0;
            color: var(--secondary-color);
        }
        
        .converter-options {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin: 20px 0;
        }
        
        .converter-option {
            text-align: left;
            padding: 15px !important;
        }
        
        .cancel-btn {
            background-color: #e2e8f0;
        }
    `;
    document.head.appendChild(style);
    
    // Alternative: Add direct download links for popular converters
    const toolHeader = document.querySelector('.tool-header');
    if (toolHeader) {
        const alternativeLinks = document.createElement('div');
        alternativeLinks.className = 'alternative-converters';
        alternativeLinks.innerHTML = `
            <p>Alternative online converters:</p>
            <div class="converter-links">
                <a href="https://convertio.co/webm-mp4/" target="_blank">Convertio</a>
                <a href="https://ezgif.com/webm-to-mp4" target="_blank">EZGif</a>
                <a href="https://www.online-convert.com/webm-to-mp4" target="_blank">Online-Convert</a>
            </div>
        `;
        toolHeader.appendChild(alternativeLinks);
    }
});
