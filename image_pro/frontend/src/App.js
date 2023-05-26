import React, { useState } from 'react';
import { Container, Box, Typography, TextField, Checkbox, FormControlLabel, Button, Grid } from '@mui/material';
import Form from './components/Form'

function App() {
  return (
      <Container maxWidth="md">
        <Box mt={4}>
          <Typography variant="h4" align="center">ImagePro</Typography>
        </Box>
         <Form />
      </Container>
  );
}

export default App;
