import { useState, useRef, useCallback } from 'react';
import { useEngine } from '../../../../engine/contexts/EngineContext';

export function useProfile(content: any, currentLanguage: any) {
    const { t } = useEngine();
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const profileName = content?.displayName || t('Admin User', currentLanguage.code, 'ui');
    const profileRole = content?.role || t('Cloud Manager', currentLanguage.code, 'ui');
    const profileEmail = content?.email || "admin@inventure.ai";
    const profileBio = content?.bio || t('Managing the inventory and operations for Inventure POS System.', currentLanguage.code, 'ui');

    const handleCameraClick = useCallback(() => {
        setIsUploadDialogOpen(true);
    }, []);

    const handleUploadClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewImage(url);
            setIsUploadDialogOpen(false);
        }
    }, []);

    const handleRemovePhoto = useCallback(() => {
        setPreviewImage(null);
        setIsUploadDialogOpen(false);
    }, []);

    return {
        isUploadDialogOpen,
        setIsUploadDialogOpen,
        isPasswordDialogOpen,
        setIsPasswordDialogOpen,
        previewImage,
        fileInputRef,
        profileName,
        profileRole,
        profileEmail,
        profileBio,
        handleCameraClick,
        handleUploadClick,
        handleFileChange,
        handleRemovePhoto
    };
}
