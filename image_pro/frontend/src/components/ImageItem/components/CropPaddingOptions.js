import React from 'react'
import {Box, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup} from "@mui/material";

function CropPaddingOptions({ cropOrPadding, setCropOrPadding, preserveAspectRatio }) {
    const handleChange = (event) => {
        setCropOrPadding(event.target.value);
    };

    return (
        <Box align='center' sx={{ mt: 2, mb: 2, opacity: preserveAspectRatio ? 0.5 : 1}}>
            <FormControl component="fieldset" disabled={preserveAspectRatio}>
                <FormLabel align='center' component="legend" >Distort, Crop, or Padding</FormLabel>
                <RadioGroup row aria-label="cropOrPadding" name="cropOrPadding" value={cropOrPadding} onChange={handleChange}>
                    <FormControlLabel value="none" control={<Radio />} label="Distort" />
                    <FormControlLabel value="crop" control={<Radio />} label="Crop" />
                    <FormControlLabel value="padding" control={<Radio />} label="Padding" />
                </RadioGroup>
            </FormControl>
        </Box>
    );
}

export default CropPaddingOptions;