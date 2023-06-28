import React, { useContext } from 'react';
import { Button, Box } from '@mui/material';
import { ImageContext } from '../Form'

function ActionButtons() {
    const { state, onSubmit, handleSubmit } = useContext(ImageContext);
    const { fileList, newWidthValue, newHeightValue, aspectRatio } = state;

    return (
        <Box mt={2}>
            <Button
                sx={{marginRight: 1}}
                variant="contained"
                color="primary"
                disabled={
                    !fileList.length ||
                    (fileList.length >= 1 && (!newWidthValue || !newHeightValue) && !aspectRatio)
                }
                onClick={handleSubmit((data) => onSubmit(data, false))}
            >
                Resize
            </Button>

            <Button
                variant="contained"
                color="primary"
                disabled={!fileList.length}
                onClick={handleSubmit((data) => onSubmit(data, true))}
            >
                Optimize
            </Button>
        </Box>
    );
}

export default ActionButtons;
