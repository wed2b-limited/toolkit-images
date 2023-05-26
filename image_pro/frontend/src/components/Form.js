import React, { useRef, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Box, TextField, Button, Grid, Snackbar, Alert, Slider, Typography, FormControl, InputLabel, MenuItem, Select, Checkbox, FormControlLabel } from '@mui/material';
import ImageItem from './ImageItem';
import axios from 'axios';
import JSZip from 'jszip';
import {saveAs} from 'file-saver';

function Form() {
    const { register, handleSubmit, watch, setValue } = useForm();
    const [images, setImages] = useState([]);
    const [quality, setQuality] = useState(85);
    const fileInputRef = useRef();
    const [processing, setProcessing] = useState(false);
    const [aspectRatio, setAspectRatio] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [clearDialogOpen, setClearDialogOpen] = useState(false);
    const [dimensionError, setDimensionError] = useState(false);
    const [fileSizeError, setFileSizeError] = useState(false);
    const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
    const [originalWidth, setOriginalWidth] = useState(null);
    const [originalHeight, setOriginalHeight] = useState(null);
    const [newWidthValue, setNewWidthValue] = useState(originalWidth);
    const [newHeightValue, setNewHeightValue] = useState(originalHeight);
    const [lastChanged, setLastChanged] = useState(null);
    const [manualChange, setManualChange] = useState(false);



    useEffect(() => {
        if (maintainAspectRatio && !manualChange) {
            const calculatedHeight = Math.round((newWidthValue * originalHeight) / originalWidth);
            const calculatedWidth = Math.round((newHeightValue * originalWidth) / originalHeight);

            if (lastChanged === "width" && newWidthValue && calculatedHeight !== newHeightValue) {
                setValue("height", calculatedHeight);
            } else if (lastChanged === "height" && newHeightValue && calculatedWidth !== newWidthValue) {
                setValue("width", calculatedWidth);
            }
        }
        setManualChange(false);
    }, [maintainAspectRatio, newWidthValue, newHeightValue, manualChange]);



    const handleClearDialogOpen = () => {
        setClearDialogOpen(true);
    };

    const handleClearDialogClose = () => {
        setClearDialogOpen(false);
    };

    const handleFileChange = async (e) => {
        const files = e.target.files;
        setFileList([...files]);

        if (files.length === 1) {
            const img = await createImage(files[0]);
            setOriginalWidth(img.width);
            setOriginalHeight(img.height);

            const aspectRatio = img.width / img.height;
            setAspectRatio(aspectRatio.toFixed(2));
        } else {
            setOriginalWidth(null);
            setOriginalHeight(null);
            setAspectRatio(null);
        }
    };

    const handleWidthChange = (e) => {
        const newWidth = e.target.value;
        setNewWidthValue(newWidth)
        setValue("width", newWidth);
        setLastChanged("width");
        setManualChange(true);
    };

    const handleHeightChange = (e) => {
        const newHeight = e.target.value;
        setNewHeightValue(newHeight)
        setValue("height", newHeight);
        setLastChanged("height");
        setManualChange(true);
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

    const createImage = (file) => new Promise((resolve) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => resolve(img);
    });



    const onSubmit = async (data, optimize) => {
        const files = data.file;
        const formWidth = data.width;
        const formHeight = data.height;

        if (!optimize) {
            // Resize function
            if (formWidth && (formWidth < 1 || formWidth > 8000)) {
                setDimensionError(true);
                return;
            }

            if (formHeight && (formHeight < 1 || formHeight > 8000)) {
                setDimensionError(true);
                return;
            }
        } else {
            // Optimize function
            const totalFileSize = Array.from(files).reduce(
                (total, file) => total + file.size,
                0
            );
            if (totalFileSize > 50 * 1024 * 1024) {
                setFileSizeError(true);
                return;
            }
        }

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
                        filename: responseData.filename.replace(/\.[^/.]+$/, ''),
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

        await processImages(formWidth, formHeight);

        setProcessing(false);
        setValue("width", "");
        setValue("height", "");
    };




    const clearAll = () => {
        setImages([]);
        setClearDialogOpen(false);
    };

    const downloadAll = async () => {
        const zip = new JSZip();
        const operation = images[0].operation === "Optimized" ? "optimized" : "resized";
        const zipFileName = `${operation}_images.zip`;

        const promises = images.map(async (image, index) => {
            const response = await fetch(image.optimizedImage);
            const blob = await response.blob();
            const fileName = `${image.filename}_${operation}.jpg`;
            zip.file(fileName, blob, { binary: true });
        });

        await Promise.all(promises);
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, zipFileName);
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
                    disabled={fileList < 1}
                    sx={{ marginBottom: 2, opacity: fileList < 1 ? 0.2 : 1 }}
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
                    disabled={fileList < 1 && aspectRatio}
                    sx={{ mb: 1, opacity: fileList < 1 ? 0.2 : 1 }}
                />
                <TextField
                    label="Height (px)"
                    type="number"
                    InputLabelProps={{
                        shrink: true,
                    }}
                    value={height}
                    onChange={(e) => handleHeightChange(e)}
                    disabled={fileList < 1 && aspectRatio}
                    sx={{ mb: 1, opacity: fileList < 1 ? 0.2 : 1 }}
                />
                <FormControlLabel
                    control={<Checkbox checked={maintainAspectRatio} onChange={(e) => setMaintainAspectRatio(e.target.checked)} />}
                    label="Maintain Aspect Ratio"
                    sx={{ mb: 1 }}
                />
                <FormControl fullWidth sx={{ mb: 1 }}>
                    <InputLabel
                        id="aspect-ratio-label"
                        sx={{
                            opacity: maintainAspectRatio || fileList < 1 ? 0.2 : 1
                        }}
                    >
                        Aspect Ratio
                    </InputLabel>
                    <Select
                        labelId="aspect-ratio-label"
                        value={aspectRatio || ""}
                        onChange={handleAspectRatioChange}
                        label="Aspect Ratio"
                        disabled={maintainAspectRatio || fileList < 1}
                        sx={{ opacity: maintainAspectRatio || fileList < 1 ? 0.2 : 1 }}
                    >
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
                        disabled={(!fileList.length) || (fileList.length >= 1 && (!width || !height) && !aspectRatio)}
                        onClick={handleSubmit((data) => onSubmit(data, false))}
                    >
                        Resize
                    </Button>


                    <Button
                        variant="contained"
                        color="primary"
                        disabled={(!fileList.length)}
                        onClick={handleSubmit((data) => onSubmit(data, true))}
                    >
                        Optimize
                    </Button>
                </Box>
            </Box>
            {images.length > 0 && (
                <Box mt={2} mb={4} align="center">
                    <Button variant="contained" color="error" onClick={handleClearDialogOpen}>
                        Clear All
                    </Button>
                    <Dialog
                        open={clearDialogOpen}
                        onClose={handleClearDialogClose}
                    >
                        <DialogTitle>{"Confirm Clear All"}</DialogTitle>
                        <DialogContent>
                            <DialogContentText>
                                Are you sure you want to clear all images?
                            </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleClearDialogClose} color="primary">
                                Cancel
                            </Button>
                            <Button onClick={clearAll} color="primary" autoFocus>
                                Yes
                            </Button>
                        </DialogActions>
                    </Dialog>
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

            {/* Dimension error modal */}
            <Dialog open={dimensionError} onClose={() => setDimensionError(false)}>
                <DialogTitle>Dimension Exceeded</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        The image dimension values should be between 1 and 8000.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDimensionError(false)}>OK</Button>
                </DialogActions>
            </Dialog>

            {/* File size error modal */}
            <Dialog open={fileSizeError} onClose={() => setFileSizeError(false)}>
                <DialogTitle>File Size Issue</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        The total file size should not exceed 50MB.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setFileSizeError(false)}>OK</Button>
                </DialogActions>
            </Dialog>

        </>
    );
};

export default Form;