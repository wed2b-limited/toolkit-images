import React, {useRef, useState} from 'react';
import {useForm} from 'react-hook-form';
import {Box, TextField, Button, Grid, Snackbar, Alert, Slider, Typography, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import ImageItem from './ImageItem';
import axios from 'axios';
import JSZip from 'jszip';
import {saveAs} from 'file-saver';

function Form() {
    const {register, handleSubmit, watch, setValue} = useForm();
    const [images, setImages] = useState([]);
    const [quality, setQuality] = useState(85);
    const fileInputRef = useRef();
    const [processing, setProcessing] = useState(false);
    const [aspectRatio, setAspectRatio] = useState(null);
    const [fileList, setFileList] = useState([]);


    const handleFileChange = (e) => {
        const files = e.target.files;
        setFileList([...files]);
    };

    const handleWidthChange = (e) => {
        const newWidth = e.target.value;
        setValue("width", newWidth);

        if (aspectRatio && newWidth) {
            const [aspectWidth, aspectHeight] = aspectRatio.split(':').map(Number);
            const newHeight = Math.round((newWidth * aspectHeight) / aspectWidth);
            setValue("height", newHeight);
        } else if (!newWidth) {
            setValue("height", "");
        }
    };

    const handleHeightChange = (e) => {
        const newHeight = e.target.value;
        setValue("height", newHeight);

        if (aspectRatio && newHeight) {
            const [aspectWidth, aspectHeight] = aspectRatio.split(':').map(Number);
            const newWidth = Math.round((newHeight * aspectWidth) / aspectHeight);
            setValue("width", newWidth);
        } else if (!newHeight) {
            setValue("width", "");
        }
    };

    const handleAspectRatioChange = async (e) => {
        const newAspectRatio = e.target.value;
        setAspectRatio(newAspectRatio);

        if (!newAspectRatio || fileList.length === 0) return;

        if (fileList.length === 1) {
            const img = await createImage(fileList[0]);
            const originalWidth = img.width;
            const originalHeight = img.height;
            const [aspectWidth, aspectHeight] = newAspectRatio.split(':').map(Number);
            const originalAspectRatio = originalWidth / originalHeight;

            let newWidth, newHeight;
            if (originalAspectRatio > aspectWidth / aspectHeight) {
                newWidth = originalWidth;
                newHeight = Math.round((originalWidth * aspectHeight) / aspectWidth);
            } else {
                newWidth = Math.round((originalHeight * aspectWidth) / aspectHeight);
                newHeight = originalHeight;
            }

            if (newWidth > originalWidth) {
                const ratio = originalWidth / newWidth;
                newWidth = originalWidth;
                newHeight = Math.round(newHeight * ratio);
            }

            if (newHeight > originalHeight) {
                const ratio = originalHeight / newHeight;
                newHeight = originalHeight;
                newWidth = Math.round(newWidth * ratio);
            }

            setValue("width", newWidth);
            setValue("height", newHeight);
        }
    };


    const readFileAsDataUrl = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    };

    const calculateNewDimension = (currentDimension, aspectRatio) => {
        const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
        const newWidth = Math.round((currentDimension * widthRatio) / heightRatio);
        const newHeight = Math.round((currentDimension * heightRatio) / widthRatio);

        return { newWidth, newHeight };
    };

    const blob = (canvas) => new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve({blob, data: URL.createObjectURL(blob)});
        }, 'image/jpeg', 1);
    });

    const createImage = (file) => new Promise((resolve) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => resolve(img);
    });

    const resizeImage = (img, width, height, quality) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        return new Promise((resolve) => {
            canvas.toBlob(
                (blob) => {
                    const data = URL.createObjectURL(blob);
                    resolve({ canvas, data });
                },
                'image/jpeg',
                quality / 100
            );
        });
    };


    const optimizeImage = async (img, quality) => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        return await new Promise((resolve) => {
            img.addEventListener("load", () => {
                canvas.toBlob(
                    (blob) => {
                        const data = URL.createObjectURL(blob);
                        resolve({canvas, data});
                    },
                    "image/jpeg",
                    quality / 100
                );
            });
        });
    };

    const onSubmit = async (data, optimize) => {
        const files = data.file;
        const formWidth = data.width;
        const formHeight = data.height;

        setProcessing(true);

        const processImages = async (width, height) => {
            const formData = new FormData();
            if (width && height) {
                formData.append("width", width);
                formData.append("height", height);
            }
            formData.append("optimize", optimize);
            if (optimize) {
                formData.append('quality', quality);
            }

            const originalImageDataUrls = [];
            for (const file of files) {
                const originalImageDataUrl = await readFileAsDataUrl(file);
                originalImageDataUrls.push(originalImageDataUrl);
                formData.append("file[]", file);
            }

            try {
                const response = await axios.post("http://localhost:5000/upload", formData);
                const responseDataArray = response.data;
                for (let i = 0; i < responseDataArray.length; i++) {
                    const responseData = responseDataArray[i];
                    const optimizedImage = {
                        originalImage: originalImageDataUrls[i],
                        optimizedImage: responseData.optimized_image_url,
                        originalSizeMB: (responseData.original_size / (1024 * 1024)).toFixed(2),
                        optimizedSizeMB: (responseData.optimized_size / (1024 * 1024)).toFixed(2),
                        originalImageWidth: responseData.original_width,
                        originalImageHeight: responseData.original_height,
                        newImageWidth: responseData.new_width,
                        newImageHeight: responseData.new_height,
                        operation: optimize ? "Optimized" : "Resized",
                        quality: quality,
                        resizedImage: responseData.resized_image_data
                    };

                    setImages((prevImages) => [...prevImages, optimizedImage]);
                    fileInputRef.current.value = '';
                }
            } catch (error) {
                console.error("Error uploading the image:", error);
            }
        };

        if (formWidth && formHeight) {
            await processImages(formWidth, formHeight);
        } else {
            await processImages(null, null);
        }

        setProcessing(false);
        setValue("width", "");
        setValue("height", "");
    };



    const clearAll = () => {
            setImages([]);
        };

    const downloadAll = async () => {
        const zip = new JSZip();
        const promises = images.map(async (image, index) => {
            const response = await fetch(image.optimizedImage);
            const blob = await response.blob();
            const fileName = image.operation === 'Optimized' ? `optimized_image_${index}.jpg` : `resized_image_${index}.jpg`;
            zip.file(fileName, blob, { binary: true });
        });

        await Promise.all(promises);
        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, 'images.zip');
    };


        const width = watch("width");
        const height = watch("height");

        return (
            <>
                <Box component="form" onSubmit={handleSubmit((data) => onSubmit(data, false))} mt={4}
                     sx={{display: "flex", flexDirection: "column", justifyContent: "space-between"}}>
                    <TextField
                        label="Select the file(s)"
                        InputLabelProps={{
                            shrink: true,
                        }}
                        type="file"
                        variant="outlined"
                        {...register('file', { required: 'Please select an image' })}
                        InputProps={{ inputProps: { multiple: 'multiple' } }}
                        inputRef={fileInputRef}
                        sx={{ mb: 1 }}
                        onChange={handleFileChange}
                    />
                    <Typography gutterBottom>Quality ({quality})</Typography>
                    <Slider
                        value={quality}
                        onChange={(event, newValue) => setQuality(newValue)}
                        valueLabelDisplay="auto"
                        step={1}
                        marks
                        min={1}
                        max={100}
                        sx={{ marginBottom: 2 }}
                    />
                    <TextField
                        variant="outlined"
                        InputLabelProps={{
                            shrink: true,
                        }}
                        label="Width (px)"
                        type="number"
                        value={width}
                        onChange={(e) => handleWidthChange(e)}
                        disabled={fileList.length > 1 && aspectRatio}
                        sx={{ mb: 1 }}
                    />
                    <TextField
                        label="Height (px)"
                        type="number"
                        InputLabelProps={{
                            shrink: true,
                        }}
                        value={height}
                        onChange={(e) => handleHeightChange(e)}
                        disabled={fileList.length > 1 && aspectRatio}
                        sx={{ mb: 1 }}
                    />
                    <FormControl fullWidth sx={{ mb: 1 }}>
                        <InputLabel id="aspect-ratio-label">Aspect Ratio</InputLabel>
                        <Select
                            labelId="aspect-ratio-label"
                            value={aspectRatio || ""}
                            onChange={handleAspectRatioChange}
                            label="Aspect Ratio"
                        >
                            <MenuItem value="">None</MenuItem>
                            <MenuItem value="1:1">1:1</MenuItem>
                            <MenuItem value="4:3">4:3</MenuItem>
                            <MenuItem value="3:2">3:2</MenuItem>
                            <MenuItem value="16:9">16:9</MenuItem>
                        </Select>
                    </FormControl>
                    <Box mt={1}>
                        <Button
                            variant="contained"
                            color="primary"
                            disabled={(fileList.length <= 1 && (!width || !height)) || (fileList.length > 1 && !aspectRatio)}
                            onClick={handleSubmit((data) => onSubmit(data, false))}
                        >
                            Resize
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSubmit((data) => onSubmit(data, true))}
                        >
                            Optimize
                        </Button>
                    </Box>
                </Box>
                {images.length > 0 && (
                    <Box mt={2} mb={4} align="center">
                        <Button variant="contained" color="error" onClick={clearAll}>
                            Clear All
                        </Button>
                        {images.length > 1 && (
                            <Button variant="contained" color="info" onClick={downloadAll} style={{marginLeft: 8}}>
                                Download All
                            </Button>
                        )}
                    </Box>
                )}
                <Grid container spacing={2} mt={4} sx={{ p: 1 }} maxWidth="xl" justifyContent="center">
                    {images.map((image, index) => (
                        <Grid item key={index} xs={4} md={6}>
                            <ImageItem image={image} setImages={setImages}/>
                        </Grid>
                    ))}
                </Grid>

                <Snackbar anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} open={processing} autoHideDuration={null}>
                    <Alert variant="filled" severity="info">
                        "Processing image(s)..."
                    </Alert>
                </Snackbar>
            </>
        );
    };

    export default Form;