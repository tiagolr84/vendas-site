// Global variables
let itemsData = {};
let currentImages = [];
let currentImageIndex = 0;
let currentItemKey = '';

// DOM elements
const itemsGrid = document.getElementById('itemsGrid');
const filterButtons = document.querySelectorAll('.filter-btn');
const modal = document.getElementById('imageModal');
const closeModal = document.getElementById('closeModal');
const mainImage = document.getElementById('mainImage');
const thumbnailGallery = document.getElementById('thumbnailGallery');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const modalItemName = document.getElementById('modalItemName');
const modalItemPrice = document.getElementById('modalItemPrice');
const modalItemDescription = document.getElementById('modalItemDescription');
const modalItemLink = document.getElementById('modalItemLink');
const linkSection = document.getElementById('linkSection');
const saveDescriptionBtn = document.getElementById('saveDescription');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadItemsData();
    setupEventListeners();
});

// Load items data from JSON
async function loadItemsData() {
    try {
        const response = await fetch('items_data.json');
        itemsData = await response.json();
        renderItems();
    } catch (error) {
        console.error('Error loading items data:', error);
        showEmptyState('Erro ao carregar os dados dos itens.');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.dataset.category;
            filterItems(category);
            updateActiveFilter(this);
        });
    });

    // Modal events
    closeModal.addEventListener('click', closeImageModal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeImageModal();
        }
    });

    // Image navigation
    prevBtn.addEventListener('click', showPreviousImage);
    nextBtn.addEventListener('click', showNextImage);

    // Save description
    saveDescriptionBtn.addEventListener('click', saveDescription);

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (modal.style.display === 'block') {
            if (e.key === 'Escape') {
                closeImageModal();
            } else if (e.key === 'ArrowLeft') {
                showPreviousImage();
            } else if (e.key === 'ArrowRight') {
                showNextImage();
            }
        }
    });
}

// Render items in the grid
function renderItems(filteredItems = null) {
    const items = filteredItems || itemsData;
    
    if (Object.keys(items).length === 0) {
        showEmptyState('Nenhum item encontrado.');
        return;
    }

    itemsGrid.innerHTML = '';

    Object.entries(items).forEach(([key, item]) => {
        const itemCard = createItemCard(key, item);
        itemsGrid.appendChild(itemCard);
    });
}

// Create item card element
function createItemCard(key, item) {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.dataset.category = item.category;
    card.addEventListener('click', () => openImageModal(key, item));

    const hasImages = item.images && item.images.length > 0;
    const imageUrl = hasImages ? getImageUrl(item.images[0]) : 'https://via.placeholder.com/300x250?text=Sem+Imagem';
    const imageCount = hasImages ? item.images.length : 0;

    card.innerHTML = `
        <div class="item-image">
            <img src="${imageUrl}" alt="${item.original_name}" loading="lazy">
            ${imageCount > 1 ? `<div class="image-count"><i class="fas fa-images"></i> ${imageCount}</div>` : ''}
            <div class="category-badge">${item.category}</div>
        </div>
        <div class="item-content">
            <h3 class="item-name">${item.original_name}</h3>
            <div class="item-price">R$ ${formatPrice(item.value)}</div>
            <p class="item-description">${item.description || 'Clique para adicionar uma descrição...'}</p>
            ${item.link ? `<a href="${item.link}" class="item-link" onclick="event.stopPropagation()" target="_blank" rel="noopener noreferrer"><i class="fas fa-external-link-alt"></i> Ver produto original</a>` : ''}
        </div>
    `;

    return card;
}

// Get image URL (convert absolute path to relative)
function getImageUrl(imagePath) {
    if (imagePath.startsWith('/home/ubuntu/vendas-site/')) {
        return imagePath.replace('/home/ubuntu/vendas-site/', '');
    }
    return imagePath;
}

// Format price
function formatPrice(price) {
    if (!price) return '0,00';
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Filter items by category
function filterItems(category) {
    const cards = document.querySelectorAll('.item-card');
    
    cards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
}

// Update active filter button
function updateActiveFilter(activeButton) {
    filterButtons.forEach(button => {
        button.classList.remove('active');
    });
    activeButton.classList.add('active');
}

// Open image modal
function openImageModal(key, item) {
    currentItemKey = key;
    currentImages = item.images || [];
    currentImageIndex = 0;

    // Set item details
    modalItemName.textContent = item.original_name;
    modalItemPrice.textContent = `R$ ${formatPrice(item.value)}`;
    modalItemDescription.value = item.description || '';

    // Handle link
    if (item.link) {
        modalItemLink.href = item.link;
        linkSection.style.display = 'block';
    } else {
        linkSection.style.display = 'none';
    }

    // Setup images
    if (currentImages.length > 0) {
        setupImageGallery();
        showImage(0);
    } else {
        // Show placeholder if no images
        mainImage.src = 'https://via.placeholder.com/400x400?text=Sem+Imagem';
        mainImage.alt = item.original_name;
        thumbnailGallery.innerHTML = '';
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
    }

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Setup image gallery
function setupImageGallery() {
    // Create thumbnails
    thumbnailGallery.innerHTML = '';
    currentImages.forEach((image, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'thumbnail';
        if (index === 0) thumbnail.classList.add('active');
        
        thumbnail.innerHTML = `<img src="${getImageUrl(image)}" alt="Thumbnail ${index + 1}">`;
        thumbnail.addEventListener('click', () => showImage(index));
        
        thumbnailGallery.appendChild(thumbnail);
    });

    // Show/hide navigation buttons
    if (currentImages.length > 1) {
        prevBtn.style.display = 'flex';
        nextBtn.style.display = 'flex';
    } else {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
    }
}

// Show specific image
function showImage(index) {
    if (index < 0 || index >= currentImages.length) return;
    
    currentImageIndex = index;
    mainImage.src = getImageUrl(currentImages[index]);
    mainImage.alt = `Imagem ${index + 1}`;

    // Update active thumbnail
    const thumbnails = thumbnailGallery.querySelectorAll('.thumbnail');
    thumbnails.forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });
}

// Show previous image
function showPreviousImage() {
    const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : currentImages.length - 1;
    showImage(newIndex);
}

// Show next image
function showNextImage() {
    const newIndex = currentImageIndex < currentImages.length - 1 ? currentImageIndex + 1 : 0;
    showImage(newIndex);
}

// Close image modal
function closeImageModal() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    currentImages = [];
    currentImageIndex = 0;
    currentItemKey = '';
}

// Save description
function saveDescription() {
    const description = modalItemDescription.value.trim();
    
    if (currentItemKey && itemsData[currentItemKey]) {
        itemsData[currentItemKey].description = description;
        
        // Update the item card
        renderItems();
        
        // Show success feedback
        const originalText = saveDescriptionBtn.innerHTML;
        saveDescriptionBtn.innerHTML = '<i class="fas fa-check"></i> Salvo!';
        saveDescriptionBtn.style.background = '#059669';
        
        setTimeout(() => {
            saveDescriptionBtn.innerHTML = originalText;
            saveDescriptionBtn.style.background = '#059669';
        }, 2000);
        
        // Save to localStorage for persistence
        localStorage.setItem('itemsData', JSON.stringify(itemsData));
    }
}

// Show empty state
function showEmptyState(message) {
    itemsGrid.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-box-open"></i>
            <h3>Nenhum item encontrado</h3>
            <p>${message}</p>
        </div>
    `;
}

// Load saved descriptions from localStorage on page load
function loadSavedDescriptions() {
    const savedData = localStorage.getItem('itemsData');
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            // Merge saved descriptions with loaded data
            Object.keys(parsed).forEach(key => {
                if (itemsData[key] && parsed[key].description) {
                    itemsData[key].description = parsed[key].description;
                }
            });
        } catch (error) {
            console.error('Error loading saved descriptions:', error);
        }
    }
}

// Update loadItemsData to include saved descriptions
const originalLoadItemsData = loadItemsData;
loadItemsData = async function() {
    await originalLoadItemsData();
    loadSavedDescriptions();
    renderItems();
};

