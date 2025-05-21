
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
    
    // User data with encrypted passwords (in real app, use proper server-side hashing)
    const users = {
        'bright': {
            password: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', // SHA-256 of 'bright123'
            name: 'Bright',
            color: 'var(--bright-color)',
            toast: 'Welcome back Bright! ✨ Your private moments are ready.'
        },
        'musa': {
            password: '15e2b0d3c33891ebb0f1ef609ec419420c20e320ce94c65fbc8c3312448eb225', // SHA-256 of 'musa123'
            name: 'Musa',
            color: 'var(--musa-color)',
            toast: 'Hello Musa! 🌟 Your special memories await you.'
        }
    };
    
    // Initialize the app
    init();
    
    function init() {
        // Check if user is already logged in from sessionStorage
        const savedUser = sessionStorage.getItem('currentUser');
        if (savedUser) {
            try {
                currentUser = JSON.parse(savedUser);
                startSession();
                showApp();
            } catch (e) {
                sessionStorage.removeItem('currentUser');
                sessionStorage.removeItem('userPhotos');
                console.error('Session parsing error:', e);
            }
        }
        
        setupEventListeners();
    }
    
    function setupEventListeners() {
        loginForm.addEventListener('submit', handleLogin);
        togglePassword.addEventListener('click', togglePasswordVisibility);
        lockBtn.addEventListener('click', lockApp);
        uploadArea.addEventListener('click', () => photoUpload.click());
        photoUpload.addEventListener('change', handlePhotoUpload);
        deleteSelectedBtn.addEventListener('click', deleteSelectedPhotos);
        downloadSelectedBtn.addEventListener('click', downloadSelectedPhotos);
        cancelSelectionBtn.addEventListener('click', cancelSelection);
        
        // Drag and drop events
        ['dragover', 'dragleave', 'drop'].forEach(event => {
            uploadArea.addEventListener(event, preventDefaults, false);
        });
        
        uploadArea.addEventListener('dragover', highlightUploadArea);
        uploadArea.addEventListener('dragleave', unhighlightUploadArea);
        uploadArea.addEventListener('drop', handleDrop);
    }
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlightUploadArea() {
        uploadArea.style.borderColor = 'var(--bright-color)';
        uploadArea.style.backgroundColor = 'rgba(255, 159, 28, 0.1)';
    }
    
    function unhighlightUploadArea() {
        uploadArea.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        uploadArea.style.backgroundColor = 'transparent';
    }
    
    function handleDrop(e) {
        unhighlightUploadArea();
        if (e.dataTransfer.files.length) {
            photoUpload.files = e.dataTransfer.files;
            handlePhotoUpload();
        }
    }
    
    function togglePasswordVisibility() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    }
    
    async function handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.toLowerCase();
        const password = document.getElementById('password').value;
        
        if (!users[username]) {
            showToast('User not found');
            return;
        }
        
        // Hash the input password to compare with stored hash
        const hashedPassword = await hashPassword(password);
        
        if (hashedPassword === users[username].password) {
            currentUser = {
                username: username,
                name: users[username].name,
                color: users[username].color
            };
            
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            startSession();
            showApp();
            showToast(users[username].toast, username);
        } else {
            showToast('Invalid password. Please try again.');
        }
    }
    
    async function hashPassword(password) {
        // Simple client-side hashing (in real app, use server-side hashing with salt)
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    function startSession() {
        if (sessionTimeout) clearTimeout(sessionTimeout);
        sessionTimeout = setTimeout(lockApp, SESSION_DURATION);
    }
    
    function showApp() {
        loginScreen.style.display = 'none';
        appMain.style.display = 'flex';
        
        userAvatar.textContent = currentUser.name.charAt(0);
        userAvatar.style.background = currentUser.color;
        welcomeMessage.textContent = `Hello, ${currentUser.name}`;
        
        loadPhotos();
    }
    
    function lockApp() {
        sessionStorage.removeItem('currentUser');
        if (sessionTimeout) clearTimeout(sessionTimeout);
        
        loginForm.reset();
        passwordInput.setAttribute('type', 'password');
        togglePassword.innerHTML = '<i class="fas fa-eye"></i>';
        
        appMain.style.display = 'none';
        loginScreen.style.display = 'flex';
        cancelSelection();
    }
    
    function loadPhotos() {
        photosGrid.innerHTML = '';
        
        // Load photos from persistent storage
        const storedPhotos = localStorage.getItem(`photos_${currentUser.username}`);
        const userPhotos = storedPhotos ? JSON.parse(storedPhotos) : [];
        
        if (userPhotos.length === 0) {
            photosGrid.innerHTML = '<p class="no-photos">No photos yet. Upload some memories!</p>';
            return;
        }
        
        userPhotos.forEach(photo => {
            createPhotoElement(photo);
        });
    }
    
    function createPhotoElement(photo) {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        photoItem.dataset.id = photo.id;
        photoItem.innerHTML = `
            <input type="checkbox" class="photo-checkbox" id="photo-${photo.id}">
            <div class="photo-overlay">
                <i class="fas fa-check"></i>
            </div>
            <img src="${photo.url}" alt="Photo ${photo.id}">
        `;
        
        photoItem.querySelector('.photo-checkbox').addEventListener('change', updateSelectionControls);
        photosGrid.appendChild(photoItem);
    }
    
    function handlePhotoUpload() {
        const files = photoUpload.files;
        if (!files || files.length === 0) return;
        
        showToast(`Uploading ${files.length} photo(s)...`, currentUser.username);
        
        // Load existing photos
        const storedPhotos = localStorage.getItem(`photos_${currentUser.username}`);
        const userPhotos = storedPhotos ? JSON.parse(storedPhotos) : [];
        
        let uploadCount = 0;
        
        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const newId = Date.now() + Math.floor(Math.random() * 1000);
                const newPhoto = {
                    id: newId,
                    url: e.target.result,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    date: new Date().toISOString()
                };
                
                userPhotos.unshift(newPhoto); // Add to beginning
                uploadCount++;
                
                // Update storage after each upload
                localStorage.setItem(`photos_${currentUser.username}`, JSON.stringify(userPhotos));
                
                // Add to DOM
                if (photosGrid.querySelector('.no-photos')) {
                    photosGrid.innerHTML = '';
                }
                createPhotoElement(newPhoto);
                
                if (uploadCount === files.length) {
                    showToast(`${uploadCount} photo(s) uploaded successfully!`, currentUser.username);
                }
            };
            reader.readAsDataURL(file);
        });
        
        photoUpload.value = '';
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
        
        if (!confirm(`Delete ${checkboxes.length} selected photo(s)?`)) return;
        
        // Load current photos
        const storedPhotos = localStorage.getItem(`photos_${currentUser.username}`);
        let userPhotos = storedPhotos ? JSON.parse(storedPhotos) : [];
        
        checkboxes.forEach(checkbox => {
            const photoId = checkbox.id.split('-')[1];
            
            // Remove from array
            userPhotos = userPhotos.filter(photo => photo.id !== photoId);
            
            // Remove from DOM
            document.querySelector(`.photo-item[data-id="${photoId}"]`)?.remove();
        });
        
        // Update storage
        localStorage.setItem(`photos_${currentUser.username}`, JSON.stringify(userPhotos));
        
        if (userPhotos.length === 0) {
            photosGrid.innerHTML = '<p class="no-photos">No photos yet. Upload some memories!</p>';
        }
        
        showToast(`${checkboxes.length} photo(s) deleted`, currentUser.username);
        cancelSelection();
    }
    
    function downloadSelectedPhotos() {
        const checkboxes = document.querySelectorAll('.photo-checkbox:checked');
        if (checkboxes.length === 0) return;
        
        showToast(`Preparing ${checkboxes.length} photo(s) for download...`, currentUser.username);
        
        // In a real app, you would create a zip file or similar
        setTimeout(() => {
            checkboxes.forEach((checkbox, index) => {
                const photoId = checkbox.id.split('-')[1];
                const photoItem = document.querySelector(`.photo-item[data-id="${photoId}"]`);
                const img = photoItem?.querySelector('img');
                
                if (img) {
                    const link = document.createElement('a');
                    link.href = img.src;
                    link.download = `photo_${photoId}.jpg`;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            });
            
            showToast(`Download started for ${checkboxes.length} photo(s)`, currentUser.username);
            cancelSelection();
        }, 1000);
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
    
    // Prevent back button from breaking the session
    window.addEventListener('popstate', function() {
        if (currentUser && sessionStorage.getItem('currentUser')) {
            showApp();
        }
    });
});
