import React, { useContext } from 'react';
import { Typography, Slider } from '@mui/material';
import { ImageContext } from "../Form";

function ImageQualitySlider() {
    const { state, dispatch } = useContext(ImageContext);
    const { quality, fileList } = state;

    return (
        <>
            <Typography gutterBottom>Quality ({quality})</Typography>
            <Slider
                value={quality}
                onChange={(event, newValue) => dispatch({ type: 'SET_QUALITY', payload: newValue })}
                valueLabelDisplay="auto"
                step={1}
                marks
                min={1}
                max={99}
                disabled={fileList.length < 1}
                sx={{ marginBottom: 2, opacity: fileList.length < 1 ? 0.2 : 1 }}
            />
        </>
    );
}

export default ImageQualitySlider;
