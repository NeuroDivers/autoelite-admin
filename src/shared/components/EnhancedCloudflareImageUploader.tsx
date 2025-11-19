import React, { useState, useCallback } from 'react';
import { 
  Box, 
  Button, 
  CircularProgress, 
  Typography, 
  Grid, 
  IconButton, 
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Alert
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Image as ImageIcon, 
  Edit as EditIcon,
  Label as LabelIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

// Types
import { CloudflareImage } from '../types';

// Interface for the image upload API
export interface ImageApiInterface {
  upload: (file: File, metadata?: any) => Promise<any>;
  delete: (imageId: string) => Promise<any>;
}

interface EnhancedCloudflareImageUploaderProps {
  onImagesUploaded: (images: CloudflareImage[]) => void;
  existingImages?: CloudflareImage[];
  vehicleId?: number;
  dealerId?: number;
  maxImages?: number;
  projectName?: string;
  allowedTags?: string[];
  imagesApi: ImageApiInterface;
  cfImageDeliveryUrl: string;
  cfAccountHash: string;
  projectIdentifier?: string;
  applicationIdentifier?: string;
}

const EnhancedCloudflareImageUploader: React.FC<EnhancedCloudflareImageUploaderProps> = ({
  onImagesUploaded,
  existingImages = [],
  vehicleId,
  dealerId,
  maxImages = 10,
  projectName,
  allowedTags = ['exterior', 'interior', 'engine', 'damage', 'feature', 'document'],
  imagesApi,
  cfImageDeliveryUrl,
  cfAccountHash,
  projectIdentifier = 'autoelite',
  applicationIdentifier = 'autoelite'
}) => {
  const [uploadedImages, setUploadedImages] = useState<CloudflareImage[]>(existingImages);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [editImageDialogOpen, setEditImageDialogOpen] = useState<boolean>(false);
  const [currentEditImage, setCurrentEditImage] = useState<{image: CloudflareImage, index: number} | null>(null);
  const [newTag, setNewTag] = useState<string>('');
  const [customTags, setCustomTags] = useState<string[]>([]);

  // Metadata keys that should be included in all uploads
  const REQUIRED_METADATA_KEYS = {
    project: projectIdentifier,
    source: 'admin-site',
    application: applicationIdentifier,
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (uploadedImages.length + acceptedFiles.length > maxImages) {
      setError(`You can only upload a maximum of ${maxImages} images.`);
      return;
    }

    setIsUploading(true);
    setError(null);
    
    const newImages: CloudflareImage[] = [];
    
    try {
      // If we're replacing images (maxImages = 1 and we already have images), delete the previous ones
      if (maxImages === 1 && uploadedImages.length > 0) {
        console.log('Deleting previous images before uploading new ones');
        for (const image of uploadedImages) {
          if (image.id && !image.id.startsWith('local_')) {
            try {
              await imagesApi.delete(image.id);
              console.log(`Successfully deleted previous image with ID: ${image.id}`);
            } catch (err) {
              console.warn(`Failed to delete previous image with ID: ${image.id}`, err);
              // Continue with upload even if delete fails
            }
          }
        }
      }
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        setUploadProgress(Math.round((i / acceptedFiles.length) * 100));
        
        // Generate standardized filename
        const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').split('.')[0];
        const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const dealerPrefix = dealerId ? `dealer${dealerId}_` : '';
        const vehiclePrefix = vehicleId ? `vehicle${vehicleId}_` : '';
        const standardizedFilename = `${projectName}_${dealerPrefix}${vehiclePrefix}${timestamp}_${i}.${extension}`;
        
        // Prepare metadata with required keys and custom project data
        const metadata = {
          // Required metadata keys that identify this as an AutoElite image
          ...REQUIRED_METADATA_KEYS,
          // Project-specific metadata
          projectName: projectName,
          dealerId: dealerId,
          vehicleId: vehicleId,
          originalFilename: file.name,
          uploadDate: new Date().toISOString(),
          fileType: file.type,
          fileSize: file.size,
          description: `${applicationIdentifier} ${projectName} ${dealerId ? `dealer ${dealerId}` : ''} ${vehicleId ? `vehicle ${vehicleId}` : ''}`
        };
        
        // Upload to Cloudflare Images via our API
        const response = await imagesApi.upload(file, metadata);
        
        console.log('Cloudflare Images upload response:', response);
        
        if (response.success && response.image) {
          // Handle Cloudflare Images API response format
          const imageData = response.image;
          
          const newImage: CloudflareImage = {
            id: imageData.id,
            // Use variants.public URL if available, otherwise use a placeholder
            url: imageData.variants ? 
              (Array.isArray(imageData.variants) ? imageData.variants[0] : imageData.variants) : 
              `https://imagedelivery.net/${cfAccountHash}/${imageData.id}/public`,
            filename: imageData.filename || standardizedFilename,
            uploaded: imageData.uploaded || new Date().toISOString(),
            tags: [],
            metadata: metadata
          };
          
          console.log('Created new image object:', newImage);
          newImages.push(newImage);
        } else {
          console.error('Invalid response from Cloudflare Images API:', response);
          throw new Error('Failed to upload image: Invalid response from server');
        }
      }
      
      // If maxImages is 1, replace all existing images with the new ones
      // Otherwise, append the new images to existing ones
      const updatedImages = maxImages === 1 ? newImages : [...uploadedImages, ...newImages];
      setUploadedImages(updatedImages);
      onImagesUploaded(updatedImages);
      
    } catch (err: any) {
      console.error('Error uploading images:', err);
      setError(err.message || 'Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [uploadedImages, maxImages, onImagesUploaded, projectName, dealerId, vehicleId, imagesApi, cfAccountHash, REQUIRED_METADATA_KEYS, applicationIdentifier]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    disabled: isUploading || uploadedImages.length >= maxImages
  });

  const handleRemoveImage = async (index: number) => {
    try {
      const imageToRemove = uploadedImages[index];
      
      // If it's a real Cloudflare image (has an ID), delete it from the server
      if (imageToRemove.id && !imageToRemove.id.startsWith('local_')) {
        await imagesApi.delete(imageToRemove.id);
      }
      
      // If removing a file with a URL.createObjectURL, revoke it to prevent memory leaks
      if (imageToRemove.url && typeof imageToRemove.url === 'string' && imageToRemove.url.startsWith('blob:')) {
        URL.revokeObjectURL(imageToRemove.url);
      }
      
      const newImages = [...uploadedImages];
      newImages.splice(index, 1);
      setUploadedImages(newImages);
      onImagesUploaded(newImages);
    } catch (err: any) {
      console.error('Error removing image:', err);
      setError(err.message || 'Failed to remove image');
    }
  };

  const handleEditImage = (image: CloudflareImage, index: number) => {
    setCurrentEditImage({ image, index });
    setEditImageDialogOpen(true);
  };

  const handleAddTag = (tag: string) => {
    if (!currentEditImage) return;
    
    const { image, index } = currentEditImage;
    const currentTags = image.tags || [];
    
    if (tag && !currentTags.includes(tag)) {
      const updatedImage = {
        ...image,
        tags: [...currentTags, tag]
      };
      
      const newImages = [...uploadedImages];
      newImages[index] = updatedImage;
      
      setCurrentEditImage({ image: updatedImage, index });
    }
    
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!currentEditImage) return;
    
    const { image, index } = currentEditImage;
    const currentTags = image.tags || [];
    
    const updatedImage = {
      ...image,
      tags: currentTags.filter(tag => tag !== tagToRemove)
    };
    
    const newImages = [...uploadedImages];
    newImages[index] = updatedImage;
    
    setCurrentEditImage({ image: updatedImage, index });
  };

  const handleSaveImageMetadata = () => {
    if (!currentEditImage) return;
    
    const { image, index } = currentEditImage;
    
    const newImages = [...uploadedImages];
    newImages[index] = image;
    
    setUploadedImages(newImages);
    onImagesUploaded(newImages);
    setEditImageDialogOpen(false);
    setCurrentEditImage(null);
  };

  const handleUpdateDescription = (description: string) => {
    if (!currentEditImage) return;
    
    const { image, index } = currentEditImage;
    
    const updatedImage = {
      ...image,
      metadata: {
        ...image.metadata,
        description
      }
    };
    
    setCurrentEditImage({ image: updatedImage, index });
  };

  // Get the image URL, handling both Cloudflare Images and local blob URLs
  const getCloudflareImageUrl = (imageUrl: string | undefined | null, variant: string = 'public'): string => {
    // Handle undefined or null imageUrl
    if (!imageUrl) {
      console.warn('Image URL is undefined or null');
      return '';
    }
    
    // If it's a blob URL (local preview) or a full URL, return as is
    if (imageUrl.startsWith('blob:') || imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    // For Cloudflare Images IDs, construct the URL
    if (cfImageDeliveryUrl && cfAccountHash) {
      return `${cfImageDeliveryUrl}/${cfAccountHash}/${imageUrl}/${variant}`;
    }
    
    return imageUrl;
  };

  const handleCustomTagChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewTag(event.target.value);
  };

  const handleTagSelect = (event: SelectChangeEvent<string>) => {
    handleAddTag(event.target.value);
  };

  const handleAddCustomTag = () => {
    if (newTag && !customTags.includes(newTag)) {
      setCustomTags([...customTags, newTag]);
    }
    handleAddTag(newTag);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Vehicle Images
      </Typography>
      
      {error && (
        <Typography color="error" variant="body2" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.400',
          borderRadius: 1,
          p: 3,
          mb: 2,
          textAlign: 'center',
          backgroundColor: isDragActive ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
          cursor: isUploading || uploadedImages.length >= maxImages ? 'not-allowed' : 'pointer',
          opacity: isUploading || uploadedImages.length >= maxImages ? 0.6 : 1,
        }}
      >
        <input {...getInputProps()} />
        
        {isUploading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress variant="determinate" value={uploadProgress} sx={{ mb: 2 }} />
            <Typography>Uploading... {uploadProgress}%</Typography>
          </Box>
        ) : (
          <Box>
            <ImageIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography>
              {isDragActive
                ? 'Drop the images here...'
                : uploadedImages.length >= maxImages
                ? `Maximum ${maxImages} images reached`
                : `Drag & drop images here, or click to select files (${uploadedImages.length}/${maxImages})`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Images will be automatically named with project, dealer, and vehicle identifiers
            </Typography>
          </Box>
        )}
      </Box>
      
      {uploadedImages.length > 0 && (
        <Grid container spacing={2}>
          {uploadedImages.filter(image => image && image.url).map((image, index) => (
            <Grid item xs={6} sm={4} md={3} key={image.id}>
              <Box
                sx={{
                  position: 'relative',
                  height: 150,
                  borderRadius: 1,
                  overflow: 'hidden',
                  '&:hover .image-actions': {
                    opacity: 1,
                  },
                }}
              >
                <Box
                  component="img"
                  src={getCloudflareImageUrl(image.url || '')}
                  alt={image.filename || ''}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                <Box
                  className="image-actions"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                    borderRadius: '0 0 0 4px',
                    display: 'flex',
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => handleEditImage(image, index)}
                    sx={{ color: 'white' }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveImage(index)}
                    sx={{ color: 'white' }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
                {index === 0 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      bgcolor: 'rgba(0, 0, 0, 0.5)',
                      color: 'white',
                      p: 0.5,
                      fontSize: '0.75rem',
                      textAlign: 'center',
                    }}
                  >
                    Primary Image
                  </Box>
                )}
                {image.tags && image.tags.length > 0 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: index === 0 ? 24 : 0,
                      left: 0,
                      maxWidth: '100%',
                      bgcolor: 'rgba(0, 0, 0, 0.5)',
                      color: 'white',
                      p: 0.5,
                      fontSize: '0.75rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    <LabelIcon sx={{ fontSize: '0.75rem', mr: 0.5, verticalAlign: 'middle' }} />
                    {image.tags.join(', ')}
                  </Box>
                )}
              </Box>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Edit Image Dialog */}
      <Dialog 
        open={editImageDialogOpen} 
        onClose={() => setEditImageDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Image Metadata</DialogTitle>
        <DialogContent>
          {currentEditImage && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                <Box
                  component="img"
                  src={getCloudflareImageUrl(currentEditImage.image.url || '')}
                  alt={currentEditImage.image.filename || ''}
                  sx={{
                    maxWidth: '100%',
                    maxHeight: 200,
                    objectFit: 'contain',
                  }}
                />
              </Box>

              <Typography variant="subtitle2" gutterBottom>
                Filename
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {currentEditImage.image.filename}
              </Typography>

              <TextField
                fullWidth
                label="Image Description"
                value={currentEditImage.image.metadata?.description || ''}
                onChange={(e) => handleUpdateDescription(e.target.value)}
                margin="normal"
                variant="outlined"
                multiline
                rows={2}
              />

              <Box sx={{ mt: 2, mb: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {(currentEditImage.image.tags || []).map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      onDelete={() => handleRemoveTag(tag)}
                      size="small"
                    />
                  ))}
                  {(currentEditImage.image.tags || []).length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No tags added yet
                    </Typography>
                  )}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel id="tag-select-label">Add Tag</InputLabel>
                  <Select
                    labelId="tag-select-label"
                    value=""
                    label="Add Tag"
                    onChange={handleTagSelect}
                    size="small"
                  >
                    {allowedTags.map((tag) => (
                      <MenuItem key={tag} value={tag}>{tag}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Typography sx={{ pt: 1 }}>or</Typography>
                
                <TextField
                  label="Custom Tag"
                  value={newTag}
                  onChange={handleCustomTagChange}
                  size="small"
                  sx={{ flexGrow: 1 }}
                />
                
                <Button 
                  variant="outlined" 
                  onClick={handleAddCustomTag}
                  disabled={!newTag}
                  size="small"
                  sx={{ mt: 0.5 }}
                >
                  Add
                </Button>
              </Box>

              <Box sx={{ mt: 3, bgcolor: 'background.default', p: 1, borderRadius: 1 }}>
                <Typography variant="caption" display="flex" alignItems="center">
                  <InfoIcon fontSize="small" sx={{ mr: 0.5 }} />
                  Images are automatically tagged with project, dealer, and vehicle identifiers
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditImageDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveImageMetadata} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export { EnhancedCloudflareImageUploader };
export type { EnhancedCloudflareImageUploaderProps };
