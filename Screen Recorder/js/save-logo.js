// Script to save the logo image
(async function() {
    // This script is used to download the logo and save it
    const logoUrl = 'https://freeimage.host/i/3ovQgvn'; // Original URL
    const directImageUrl = 'https://iili.io/3ovQgvn.png'; // Direct image URL
    
    // Create a function to download and save the image
    async function downloadLogo() {
        try {
            const response = await fetch(directImageUrl);
            const blob = await response.blob();
            
            // For browsers
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'logo.png';
            link.click();
            
            console.log('Logo downloaded successfully!');
        } catch (error) {
            console.error('Failed to download logo:', error);
        }
    }
    
    // Add a button to trigger the download
    const button = document.createElement('button');
    button.textContent = 'Download Logo for App';
    button.style.position = 'fixed';
    button.style.bottom = '10px';
    button.style.right = '10px';
    button.style.zIndex = '9999';
    button.addEventListener('click', downloadLogo);
    
    // Uncomment to add the button to the page
    // document.body.appendChild(button);
    
    // Automatically download in development environment
    // downloadLogo();
})();
