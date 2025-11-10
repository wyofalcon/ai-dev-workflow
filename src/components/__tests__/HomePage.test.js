import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomePage from '../HomePage';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: null,
    loading: false,
  }),
}));

describe('HomePage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // Check if main heading exists
    expect(screen.getByText(/Tell Your Story/i)).toBeInTheDocument();
  });

  it('should display the main value proposition', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Land The Job/i)).toBeInTheDocument();
    expect(screen.getByText(/craft the perfect resume/i)).toBeInTheDocument();
  });

  it('should display the new AI Resume Builder chip', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Job-Description-First AI Resume Builder/i)).toBeInTheDocument();
  });

  it('should have a button to try new AI resume builder', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    const aiButton = screen.getByText(/Try New AI Resume Builder/i);
    expect(aiButton).toBeInTheDocument();
  });

  it('should navigate to /create-resume when AI builder button is clicked', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    const aiButton = screen.getByText(/Try New AI Resume Builder/i);
    fireEvent.click(aiButton);

    expect(mockNavigate).toHaveBeenCalledWith('/create-resume');
  });

  it('should have a button for classic builder', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Use Classic Builder/i)).toBeInTheDocument();
  });

  it('should call onStart when classic builder button is clicked', () => {
    const mockOnStart = jest.fn();

    render(
      <BrowserRouter>
        <HomePage onStart={mockOnStart} />
      </BrowserRouter>
    );

    const classicButton = screen.getByText(/Use Classic Builder/i);
    fireEvent.click(classicButton);

    expect(mockOnStart).toHaveBeenCalled();
  });

  it('should display the key benefits', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Answer our questions/i)).toBeInTheDocument();
    expect(screen.getByText(/Zero revisions needed/i)).toBeInTheDocument();
  });
});
