import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ConversationalWizard from '../ConversationalWizard';

// Mock Firebase auth - must be before import
jest.mock('../../firebase', () => ({
  auth: {
    currentUser: {
      getIdToken: jest.fn(() => Promise.resolve('mock-token-123')),
    },
  },
}));

// Mock fetch
global.fetch = jest.fn();

// Import after mocking to get the mocked version
const { auth } = require('../../firebase');

describe('ConversationalWizard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
    auth.currentUser.getIdToken.mockResolvedValue('mock-token-123');
  });

  describe('Initial State', () => {
    it('should render without crashing', () => {
      render(<ConversationalWizard onComplete={jest.fn()} />);
      expect(screen.getByText(/Let's Start with the Job Description/i)).toBeInTheDocument();
    });

    it('should show job description textarea initially', () => {
      render(<ConversationalWizard onComplete={jest.fn()} />);
      const textarea = screen.getByPlaceholderText(/paste.*job description/i);
      expect(textarea).toBeInTheDocument();
    });

    it('should have an analyze button', () => {
      render(<ConversationalWizard onComplete={jest.fn()} />);
      const analyzeButton = screen.getByText(/Analyze.*Job/i);
      expect(analyzeButton).toBeInTheDocument();
    });

    it('should disable analyze button when textarea is empty', () => {
      render(<ConversationalWizard onComplete={jest.fn()} />);
      const analyzeButton = screen.getByText(/Analyze.*Job/i);
      expect(analyzeButton).toBeDisabled();
    });

    it('should show stepper/progress indicator', () => {
      render(<ConversationalWizard onComplete={jest.fn()} />);
      
      const progressElements = screen.queryAllByRole('progressbar');
      expect(progressElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Job Description Input', () => {
    it('should enable analyze button when user types in textarea', () => {
      render(<ConversationalWizard onComplete={jest.fn()} />);
      
      const textarea = screen.getByPlaceholderText(/paste.*job description/i);
      fireEvent.change(textarea, {
        target: { value: 'Senior Software Engineer position requiring 5+ years experience with React, Node.js, and AWS.' }
      });

      const analyzeButton = screen.getByText(/Analyze.*Job/i);
      expect(analyzeButton).not.toBeDisabled();
    });

    it('should update textarea value as user types', () => {
      render(<ConversationalWizard onComplete={jest.fn()} />);
      
      const textarea = screen.getByPlaceholderText(/paste.*job description/i);
      const jobDescription = 'Software Engineer job description...';
      
      fireEvent.change(textarea, { target: { value: jobDescription } });

      expect(textarea.value).toBe(jobDescription);
    });

    it('should call API with auth token when analyze button is clicked', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          analysis: {
            title: 'Senior Software Engineer',
          },
          questions: [
            { id: 1, text: 'Question 1' },
            { id: 2, text: 'Question 2' },
            { id: 3, text: 'Question 3' },
            { id: 4, text: 'Question 4' },
            { id: 5, text: 'Question 5' },
          ],
        }),
      });

      render(<ConversationalWizard onComplete={jest.fn()} />);
      
      const jobDescription = 'Senior Software Engineer at Tech Corp';
      const textarea = screen.getByPlaceholderText(/paste.*job description/i);
      fireEvent.change(textarea, { target: { value: jobDescription } });

      const analyzeButton = screen.getByText(/Analyze.*Job/i);
      fireEvent.click(analyzeButton);

      await waitFor(() => expect(global.fetch).toHaveBeenCalled());
      
      expect(auth.currentUser.getIdToken).toHaveBeenCalled();
      const firstCall = global.fetch.mock.calls[0];
      expect(firstCall[0]).toContain('/api/resume/analyze-jd');
      expect(firstCall[1].headers['Authorization']).toBe('Bearer mock-token-123');
    });

    it('should display error message when API call fails', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      render(<ConversationalWizard onComplete={jest.fn()} />);
      
      const textarea = screen.getByPlaceholderText(/paste.*job description/i);
      fireEvent.change(textarea, { target: { value: 'Job description...' } });

      const analyzeButton = screen.getByText(/Analyze.*Job/i);
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        const errorElement = screen.getByText(/error|failed/i);
        expect(errorElement).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('UI Elements', () => {
    it('should display back button', () => {
      render(<ConversationalWizard onComplete={jest.fn()} />);
      
      const backButton = screen.getByText(/Back/i);
      expect(backButton).toBeInTheDocument();
    });

    it('should show progress through steps', () => {
      render(<ConversationalWizard onComplete={jest.fn()} />);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should show helpful instructions', () => {
      render(<ConversationalWizard onComplete={jest.fn()} />);
      
      expect(screen.getByText(/Our AI will analyze it and ask you specific questions/i)).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should accept onComplete callback prop', () => {
      const mockOnComplete = jest.fn();
      
      const { container } = render(<ConversationalWizard onComplete={mockOnComplete} />);
      
      expect(container).toBeInTheDocument();
      expect(mockOnComplete).not.toHaveBeenCalled();
    });
  });
});
