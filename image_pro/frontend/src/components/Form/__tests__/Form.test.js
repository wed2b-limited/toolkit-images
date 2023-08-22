import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import Form from '../Form';
import axios from 'axios';
import { act } from 'react-dom/test-utils';

jest.mock('axios'); // Mocking axios to avoid actual API calls

describe('Form Component', () => {
    it('renders without crashing', () => {
        render(<Form />);
    });

    it('displays error when width or height is out of range', async () => {
        const { getByTestId, getByText } = render(<Form />);
        const widthInput = getByTestId('width-input');
        const heightInput = getByTestId('height-input');

        fireEvent.change(widthInput, { target: { value: '9000' } });
        fireEvent.change(heightInput, { target: { value: '9000' } });

        const submitButton = getByTestId('submit-button');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(getByText('Dimension error')).toBeInTheDocument();
        });
    });

    it('submits the form and calls the API', async () => {
        const { getByTestId } = render(<Form />);
        const widthInput = getByTestId('width-input');
        const heightInput = getByTestId('height-input');

        fireEvent.change(widthInput, { target: { value: '500' } });
        fireEvent.change(heightInput, { target: { value: '500' } });

        const submitButton = getByTestId('submit-button');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalled();
        });
    });
});
