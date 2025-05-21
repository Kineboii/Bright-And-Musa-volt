document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const loginScreen = document.getElementById('loginScreen');
    const appMain = document.getElementById('appMain');
    const loginForm = document.getElementById('loginForm');
    const lockBtn = document.getElementById('lockBtn');
    const uploadArea = document.getElementById('uploadArea');
    const photoUpload = document.getElementById('photoUpload');
    const photosGrid = document.getElementById('photosGrid');
    const selectionControls = document.getElementById('selectionControls');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    const downloadSelectedBtn = document.getElementById('downloadSelectedBtn');
    const cancelSelectionBtn = document.getElementById('cancelSelectionBtn');
    const toast = document.getElementById('toast');
    const userAvatar = document.getElementById('userAvatar');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const togglePassword = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('password');

    // App State
    let currentUser = null;
    let sessionTimeout = null;
    const SESSION_DURATION = 3 * 60 * 1000; // 3 minutes
    
    // User data
    const users = {
        'bright': {
            password: 'bright123',
            name: 'Bright',
            color: 'var(--bright-color)',
            toast: 'Welcome back Bright! ✨ Your private moments are ready.'
        },
        'musa': {
            password: 'musa123',
            name: 'Musa',
            color: 'var(--musa-color)',
            toast: 'Hello Musa! 🌟 Your special memories await you.'
        }
    };
    
    // Sample photos data (in real app, this would come from server)
    const userPhotos = {
        'bright': [
            { id: 1, url: 'https://source.unsplash.com/random/600x600/?couple,love', date: '2023-05-15' },
            { id: 2, url: 'https://source.unsplash.com/random/600x600/?smile,happy', date: '2023-06-20' },
            { id: 3, url: 'https://source.unsplash.com/random/600x600/?sunset,beach', date: '2023-07-10' },
            { id: 4, url: 'https://source.unsplash.com/random/600x600/?wedding,ring', date: '2023-08-05' }
        ],
        'musa': [
            { id: 1, url: 'https://source.unsplash.com/random/600x600/?travel,adventure', date: '2023-04-12' },
            { id: 2, url: 'https://source.unsplash.com/random/600x600/?nature,mountain', date: '2023-05-18' },
            { id: 3, url: 'https://source.unsplash.com/random/600x600/?city,night', date: '2023-06-22' },
            { id: 4, url: 'https://source.unsplash.com/random/600x600/?dinner,romantic', date: '2023-07-30' }
        ]
    };
    
    // Initialize the app
    init();
    
    function init() {
        // Check if user is already logged in from sessionStorage
        const savedUser = sessionStorage.getItem('currentUser');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            startSession();
            showApp();
        }
        
        setupEventListeners();
    }
    
    function setupEventListeners() {
        // Login form submission
        loginForm.addEventListener('submit', handleLogin);
        
        // Toggle password visibility
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
        
        // Lock button to logout
        lockBtn.addEventListener('click', lockApp);
        
        // Photo upload handling
        uploadArea.addEventListener('click', () => photoUpload.click());
        photoUpload.addEventListener('change', handlePhotoUpload);
        
        // Selection controls
        deleteSelectedBtn.addEventListener('click', deleteSelectedPhotos);
        downloadSelectedBtn.addEventListener('click', downloadSelectedPhotos);
        cancelSelectionBtn.addEventListener('click', cancelSelection);
        
        // Drag and drop for upload
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--bright-color)';
            uploadArea.style.backgroundColor = 'rgba(255, 159, 28, 0.1)';
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            uploadArea.style.backgroundColor = 'transparent';
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            uploadArea.style.backgroundColor = 'transparent';
            
            if (e.dataTransfer.files.length) {
                photoUpload.files = e.dataTransfer.files;
                handlePhotoUpload();
            }
        });
    }
    
    function handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.toLowerCase();
        const password = document.getElementById('password').value;
        
        if (users[username] && users[username].password === password) {
            // Successful login
            currentUser = {
                username: username,
                name: users[username].name,
                color: users[username].color
            };
            
            // Save to sessionStorage
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Start session timer
            startSession();
            
            // Show the main app
            showApp();
            
            // Show welcome toast
            showToast(users[username].toast, username);
        } else {
            showToast('Invalid credentials. Please try again.');
        }
    }
    
    function startSession() {
        // Clear any existing timeout
        if (sessionTimeout) {
            clearTimeout(sessionTimeout);
        }
        
        // Set new timeout
        sessionTimeout = setTimeout(() => {
            lockApp();
            showToast('Your session has expired. Please login again.');
        }, SESSION_DURATION);
    }
    
    function showApp() {
        loginScreen.style.display = 'none';
        appMain.style.display = 'flex';
        
        // Update UI with user info
        userAvatar.textContent = currentUser.name.charAt(0);
        userAvatar.style.background = currentUser.color;
        welcomeMessage.textContent = `Hello, ${currentUser.name}`;
        
        // Load user's photos
        loadPhotos(currentUser.username);
    }
    
    function lockApp() {
        // Clear session
        sessionStorage.removeItem('currentUser');
        if (sessionTimeout) {
            clearTimeout(sessionTimeout);
            sessionTimeout = null;
        }
        
        // Reset form
        loginForm.reset();
        passwordInput.setAttribute('type', 'password');
        togglePassword.innerHTML = '<i class="fas fa-eye"></i>';
        
        // Show login screen
        appMain.style.display = 'none';
        loginScreen.style.display = 'flex';
        
        // Clear any selections
        cancelSelection();
    }
    
    function loadPhotos(username) {
        photosGrid.innerHTML = '';
        
        if (userPhotos[username]) {
            userPhotos[username].forEach(photo => {
                const photoItem = document.createElement('div');
                photoItem.className = 'photo-item';
                photoItem.innerHTML = `
                    <input type="checkbox" class="photo-checkbox" id="photo-${photo.id}">
                    <div class="photo-overlay">
                        <i class="fas fa-check"></i>
                    </div>
                    <img src="${photo.url}" alt="Photo ${photo.id}">
                `;
                
                // Add event listener to the checkbox
                const checkbox = photoItem.querySelector('.photo-checkbox');
                checkbox.addEventListener('change', function() {
                    updateSelectionControls();
                });
                
                photosGrid.appendChild(photoItem);
            });
        }
    }
    
    function handlePhotoUpload() {
        if (photoUpload.files.length === 0) return;
        
        // Simulate upload process
        showToast(`Uploading ${photoUpload.files.length} photos...`);
        
        // In a real app, you would upload to a server here
        setTimeout(() => {
            showToast('Photos uploaded successfully!', currentUser.username);
            
            // Simulate adding new photos to the gallery
            Array.from(photoUpload.files).forEach((file, index) => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const newId = userPhotos[currentUser.username].length + 1 + index;
                        const newPhoto = {
                            id: newId,
                            url: e.target.result,
                            date: new Date().toISOString().split('T')[0]
                        };
                        
                        userPhotos[currentUser.username].push(newPhoto);
                        
                        const photoItem = document.createElement('div');
                        photoItem.className = 'photo-item';
                        photoItem.innerHTML = `
                            <input type="checkbox" class="photo-checkbox" id="photo-${newId}">
                            <div class="photo-overlay">
                                <i class="fas fa-check"></i>
                            </div>
                            <img src="${newPhoto.url}" alt="Uploaded photo ${newId}">
                        `;
                        
                        const checkbox = photoItem.querySelector('.photo-checkbox');
                        checkbox.addEventListener('change', function() {
                            updateSelectionControls();
                        });
                        
                        photosGrid.prepend(photoItem);
                    };
                    reader.readAsDataURL(file);
                }
            });
            
            // Reset file input
            photoUpload.value = '';
        }, 2000);
    }
    
    function updateSelectionControls() {
        const selectedCount = document.querySelectorAll('.photo-checkbox:checked').length;
        
        if (selectedCount > 0) {
            selectionControls.style.display = 'flex';
            deleteSelectedBtn.innerHTML = `<i class="fas fa-trash"></i> Delete (${selectedCount})`;
            downloadSelectedBtn.innerHTML = `<i class="fas fa-download"></i> Download (${selectedCount})`;
        } else {
            selectionControls.style.display = 'none';
        }
    }
    
    function deleteSelectedPhotos() {
        const checkboxes = document.querySelectorAll('.photo-checkbox:checked');
        
        if (checkboxes.length === 0) return;
        
        if (confirm(`Are you sure you want to delete ${checkboxes.length} selected photos?`)) {
            checkboxes.forEach(checkbox => {
                const photoId = parseInt(checkbox.id.split('-')[1]);
                
                // Remove from array (in real app, this would be a server call)
                userPhotos[currentUser.username] = userPhotos[currentUser.username].filter(
                    photo => photo.id !== photoId
                );
                
                // Remove from DOM
                checkbox.closest('.photo-item').remove();
            });
            
            showToast(`${checkboxes.length} photos deleted`, currentUser.username);
            cancelSelection();
        }
    }
    
    function downloadSelectedPhotos() {
        const checkboxes = document.querySelectorAll('.photo-checkbox:checked');
        
        if (checkboxes.length === 0) return;
        
        showToast(`Preparing ${checkboxes.length} photos for download...`, currentUser.username);
        
        // In a real app, you would create a zip or initiate multiple downloads
        setTimeout(() => {
            showToast(`${checkboxes.length} photos ready to download`, currentUser.username);
            
            // For demo purposes, we'll just open the first selected image in a new tab
            if (checkboxes.length > 0) {
                const firstImg = checkboxes[0].closest('.photo-item').querySelector('img');
                window.open(firstImg.src, '_blank');
            }
        }, 1500);
    }
    
    function cancelSelection() {
        document.querySelectorAll('.photo-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        selectionControls.style.display = 'none';
    }
    
    function showToast(message, userType) {
        toast.textContent = message;
        toast.className = 'toast-notification';
        
        if (userType) {
            toast.classList.add(userType);
        }
        
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    // Prevent back button from showing login screen if session is active
    window.addEventListener('popstate', function() {
        if (currentUser) {
            showApp();
        }
    });
});