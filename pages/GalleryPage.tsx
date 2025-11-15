import React, { useEffect, useState } from 'react';
import { getApprovedImages, addUserUpload, simulateDailyUpdate } from '../services/galleryService';
import type { GalleryImage } from '../types';
import { useAuth } from '../hooks/useAuth';
import RoyalButton from '../components/ui/RoyalButton';
import RoyalInput from '../components/ui/RoyalInput';
import { useLocalization } from '../hooks/useLocalization';
import useForm from '../hooks/useForm';
import { MULTI_LANGUAGE_CONTENT } from '../constants';
import useRotatingContent from '../hooks/useRotatingContent';

type FormValues = { caption: string };

const validate = (values: FormValues, t: (key: string, options?: Record<string, string | number>) => string) => {
    const errors: Partial<FormValues> = {};
    if (!values.caption) {
        errors.caption = t('validationRequired');
    } else if (values.caption.length < 5) {
        errors.caption = t('validationMinLength', { length: 5 });
    }
    return errors;
};

const GalleryPage: React.FC = () => {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [showUpload, setShowUpload] = useState(false);
    const { isAuthenticated, user } = useAuth();
    const { t, language } = useLocalization();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState('');

    const taglines = MULTI_LANGUAGE_CONTENT.TAGLINES[language].filter(tag => tag.includes('Platform') || tag.includes('Millions'));
    const currentTagline = useRotatingContent(taglines, 5000);

    const {
        values,
        errors,
        touched,
        isFormValid,
        handleChange,
        handleBlur,
        handleSubmit,
        setValues,
    } = useForm({ caption: '' }, validate);

    useEffect(() => {
        simulateDailyUpdate();
        setImages(getApprovedImages());
    }, []);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setFileError('');
        if (file) {
            // Validate file type
            if (!['image/jpeg', 'image/png'].includes(file.type)) {
                setFileError(t('validationFileType'));
                return;
            }
            // Validate file size (1MB)
            if (file.size > 1024 * 1024) {
                setFileError(t('validationFileSize', { size: '1MB' }));
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleUpload = (formValues: FormValues) => {
        if (!user || !selectedFile) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const imageDataUrl = reader.result as string;
            if (addUserUpload(formValues.caption, user.username, imageDataUrl)) {
                alert("Image submitted for approval!");
                setValues({ caption: '' });
                setSelectedFile(null);
                setFileError('');
                setShowUpload(false);
            } else {
                alert("Submission failed. Please try again.");
            }
        };
        reader.readAsDataURL(selectedFile);
    };

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-4xl font-cinzel text-yellow-400">{t('gallery')}</h1>
                <p className="text-gray-400 mt-2">Celebrations from the Royal Club</p>
            </div>

            {isAuthenticated && (
                <div className="text-center">
                    <RoyalButton onClick={() => setShowUpload(!showUpload)}>
                        {showUpload ? 'Cancel Upload' : 'Upload Your Winning Moment'}
                    </RoyalButton>
                </div>
            )}

            {showUpload && (
                <div className="max-w-md mx-auto p-4 bg-black/40 border border-amber-500/50 rounded-lg">
                    <form onSubmit={handleSubmit(handleUpload)} className="space-y-4" noValidate>
                        <div>
                            <label className="block text-sm font-medium text-amber-400 mb-2 font-cinzel">Image (JPG/PNG, max 1MB)</label>
                            <input 
                                type="file" 
                                accept="image/jpeg, image/png"
                                onChange={handleFileChange}
                                className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-black hover:file:bg-yellow-600"
                            />
                            {fileError && <p className="text-red-500 text-xs mt-1">{fileError}</p>}
                        </div>
                        <RoyalInput 
                            label="Caption"
                            type="text"
                            name="caption"
                            value={values.caption}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.caption}
                            touched={touched.caption}
                            required
                        />
                        <RoyalButton type="submit" className="w-full" disabled={!isFormValid || !selectedFile || !!fileError}>Submit for Approval</RoyalButton>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image, index) => (
                    <div key={image.id} className="group relative overflow-hidden rounded-lg border-2 border-amber-800/50 hover:border-amber-400 transition-all aspect-square">
                        <img src={image.url} alt={image.caption} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                        <div className="absolute inset-0 flex flex-col justify-end p-3 text-white">
                            {index % 3 === 0 && (
                                <p className="text-xs font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-amber-400 mb-1 font-teko tracking-wider" key={currentTagline}>{currentTagline}</p>
                            )}
                            <p className="font-bold text-sm leading-tight">{image.caption}</p>
                            <p className="text-xs text-gray-300">By: {image.uploader}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GalleryPage;