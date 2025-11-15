import type { GalleryImage } from '../types';

const GALLERY_KEY = 'dessi-satta-gallery';

// Curated list of images with Indian faces
const curatedImages = [
    { url: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=600', caption: 'I won today!' },
    { url: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=600', caption: 'Trusted platform!' },
    { url: 'https://images.pexels.com/photos/1587009/pexels-photo-1587009.jpeg?auto=compress&cs=tinysrgb&w=600', caption: 'Fast withdrawal!' },
    { url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=600', caption: 'My lucky day!' },
    { url: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=600', caption: 'So much fun!' },
    { url: 'https://images.pexels.com/photos/1080213/pexels-photo-1080213.jpeg?auto=compress&cs=tinysrgb&w=600', caption: 'Feeling like a winner.' },
    { url: 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=600', caption: 'Best app ever.' },
    { url: 'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=compress&cs=tinysrgb&w=600', caption: 'Won a big prize!' },
    { url: 'https://images.pexels.com/photos/937481/pexels-photo-937481.jpeg?auto=compress&cs=tinysrgb&w=600', caption: 'Highly recommend this.' },
    { url: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=600', caption: 'Great experience.' },
    { url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=600', caption: 'My prediction was right!' },
    { url: 'https://images.pexels.com/photos/762020/pexels-photo-762020.jpeg?auto=compress&cs=tinysrgb&w=600', caption: 'Will play again.' },
    { url: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=600', caption: 'Awesome platform.' },
    { url: 'https://images.pexels.com/photos/846741/pexels-photo-846741.jpeg?auto=compress&cs=tinysrgb&w=600', caption: 'Big win today!' },
    { url: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=600', caption: 'The results are fair.' },
    { url: 'https://images.pexels.com/photos/1024311/pexels-photo-1024311.jpeg?auto=compress&cs=tinysrgb&w=600', caption: 'Amazing!' },
];


const generateInitialImages = (): GalleryImage[] => {
    return curatedImages.map((img, i) => ({
        id: Date.now() + i,
        url: img.url,
        caption: img.caption,
        uploader: 'Admin',
        isApproved: true,
    }));
};

const getGalleryFromStorage = (): GalleryImage[] => {
    try {
        const galleryStr = localStorage.getItem(GALLERY_KEY);
        if (galleryStr) {
            const gallery = JSON.parse(galleryStr);
            if (Array.isArray(gallery) && gallery.length > 0 && gallery[0].hasOwnProperty('isApproved')) {
                return gallery;
            }
        }
        const initialGallery = generateInitialImages();
        saveGalleryToStorage(initialGallery);
        return initialGallery;

    } catch {
        const initialGallery = generateInitialImages();
        saveGalleryToStorage(initialGallery);
        return initialGallery;
    }
};

const saveGalleryToStorage = (gallery: GalleryImage[]) => {
    localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));
};

export const getApprovedImages = (): GalleryImage[] => {
    const gallery = getGalleryFromStorage();
    return gallery.filter(img => img.isApproved).reverse();
};

export const getPendingImages = (): GalleryImage[] => {
    const gallery = getGalleryFromStorage();
    return gallery.filter(img => !img.isApproved);
}

export const addUserUpload = (caption: string, username: string, imageDataUrl: string): boolean => {
    if (!caption || !imageDataUrl) return false;
    const gallery = getGalleryFromStorage();
    const newImage: GalleryImage = {
        id: Date.now(),
        url: imageDataUrl,
        caption,
        uploader: username,
        isApproved: false,
    };
    gallery.push(newImage);
    saveGalleryToStorage(gallery);
    return true;
};

export const approveImage = (id: number): void => {
    let gallery = getGalleryFromStorage();
    gallery = gallery.map(img => img.id === id ? { ...img, isApproved: true } : img);
    saveGalleryToStorage(gallery);
};

export const deleteImage = (id: number): void => {
    let gallery = getGalleryFromStorage();
    gallery = gallery.filter(img => img.id !== id);
    saveGalleryToStorage(gallery);
};

// Simulate daily shuffle/add
const LAST_UPDATE_KEY = 'dessi-satta-gallery-update';
export const simulateDailyUpdate = () => {
    const lastUpdate = localStorage.getItem(LAST_UPDATE_KEY);
    const today = new Date().toDateString();

    if (lastUpdate !== today) {
        let gallery = getGalleryFromStorage();
        // Remove 5 oldest images
        gallery = gallery.sort((a,b) => a.id - b.id).slice(5);

        // Add 5 new images
        const newImages = Array.from({length: 5}, (_, i) => ({
             id: Date.now() + i,
             url: curatedImages[(i + 5) % curatedImages.length].url,
             caption: `Today's Celebration #${i + 1}`,
             uploader: 'Admin',
             isApproved: true,
        }));

        const updatedGallery = [...gallery, ...newImages];
        saveGalleryToStorage(updatedGallery);
        localStorage.setItem(LAST_UPDATE_KEY, today);
    }
};