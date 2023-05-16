import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, CardMedia, Button, Slider } from '@mui/material';
import useDebounce from '../hooks/useDebounce';

const ImageItem = ({image, setImages}) => {
    const [inputQuality, setInputQuality] = useState(image.quality);
    const debouncedQuality = useDebounce(inputQuality, 300);
    const isOptimized = image.operation === "Optimized";

    useEffect(() => {
        updateQuality(debouncedQuality);
    }, [debouncedQuality]);

    const downloadImage = () => {
        const imageData = isOptimized ? image.optimizedImage : image.resizedImage;
        fetch(imageData)
            .then((response) => response.blob())
            .then((blob) => {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = isOptimized ? 'optimized_image.jpg' : 'resized_image.jpg';
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
    };

    const openImage = () => {
        const imageData = isOptimized ? image.optimizedImage : image.resizedImage;
        fetch(imageData)
            .then((response) => response.blob())
            .then((blob) => {
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
            });
    };


    const dataUrlToImage = (dataUrl) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = dataUrl;
            img.onload = () => resolve(img);
        });
    };

    const optimizeImage = async (img, quality) => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        return await new Promise((resolve) => {
            canvas.toBlob(
                (blob) => {
                    const data = URL.createObjectURL(blob);
                    resolve({ canvas, data });
                },
                "image/jpeg",
                quality / 100
            );
        });
    };

    const updateQuality = async (newQuality) => {
        const img = await dataUrlToImage(image.originalImage);
        const { canvas, data } = await optimizeImage(img, newQuality);
        const response = await fetch(data);
        const blob = await response.blob();
        const updatedOptimizedSize = blob.size;
        const updatedImage = {
            ...image,
            optimizedImage: data,
            optimizedSizeMB: (updatedOptimizedSize / (1024 * 1024)).toFixed(2),
            quality: newQuality,
        };
        setImages((prevImages) =>
            prevImages.map((prevImage) => (prevImage === image ? updatedImage : prevImage))
        );
    };



    return (
        <Card>
            <CardContent>
                <Typography gutterBottom variant="h5" component="div" align='center'>
                    {isOptimized ? 'Optimized Image' : 'Resized Image'}
                </Typography>
                <Box sx={{display: 'flex', justifyContent: 'space-between', mt: 2}}>
                    {isOptimized && (
                        <CardMedia
                            component="img"
                            alt="Original Image"
                            image={isOptimized ? image.originalImage : image.resizedImage}
                            title="Original Image"
                            sx={{maxWidth: '200px', ml: -2, mr: 2}}
                        />
                    )}
                    <CardMedia
                        component="img"
                        alt={isOptimized ? "Optimized Image" : "Resized Image"}
                        image={isOptimized ? image.optimizedImage : image.resizedImage}
                        title={isOptimized ? "Optimized Image" : "Resized Image"}
                        sx={{maxWidth: '200px'}}
                        align='center'
                    />
                </Box>
                <Box sx={{display: 'flex', flexDirection: 'column'}}>
                    {isOptimized ? (
                        <Box sx={{justifyContent: 'space-between' }}>
                            <Box sx={{display: 'flex', justifyContent: 'space-around'}}>
                                <Typography variant="body2" color="text.secondary" align="center">
                                    Original size: {image.originalSizeMB} MB
                                </Typography>
                                <Typography variant="body2" color="text.secondary" align="center">
                                    Optimized size: {image.optimizedSizeMB} MB
                                </Typography>
                            </Box>
                            <Typography mt={1} variant="body2" color="text.secondary" align="center" gutterBottom>Quality ({image.quality})</Typography>
                            <Slider
                                value={inputQuality}
                                onChange={(event, newValue) => setInputQuality(newValue)}
                                valueLabelDisplay="auto"
                                step={1}
                                marks
                                min={1}
                                max={100}
                                sx={{ marginBottom: 2 }}
                            />
                        </Box>
                    ) : (
                        <>
                            <Typography variant="body2" color="text.secondary" align="center">
                                Original dimensions: {image.originalImageWidth}x{image.originalImageHeight}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" align="center">
                                Resized dimensions: {image.newImageWidth}x{image.newImageHeight}
                            </Typography>
                        </>
                    )}
                </Box>


                <Box sx={{display: 'flex', justifyContent: 'space-around'}} mt={2}>
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={downloadImage}
                    >
                        Download
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={openImage}
                    >
                        Open
                    </Button>
                </Box>


            </CardContent>
        </Card>
    );
};

export default ImageItem;
