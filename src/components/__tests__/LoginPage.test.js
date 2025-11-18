import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock Firebase
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
}));

jest.mock('../../firebase/config', () => ({
  auth: { currentUser: null },
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ currentUser: null, loading: false }),
}));

describe('LoginPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<BrowserRouter><LoginPage /></BrowserRouter>);
    expect(screen.getByText(/CVstomize/i)).toBeInTheDocument();
  });

  it('should display email input field', () => {
    render(<BrowserRouter><LoginPage /></BrowserRouter>);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('should display password input field', () => {
    render(<BrowserRouter><LoginPage /></BrowserRouter>);
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('should display sign-in buttons', () => {
    render(<BrowserRouter><LoginPage /></BrowserRouter>);
    const buttons = screen.getAllByText(/sign in/i);
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should display sign-up link', () => {
    render(<BrowserRouter><LoginPage /></BrowserRouter>);
    expect(screen.getByText(/Don't have an account/i)).toBeInTheDocument();
  });

  it('should display forgot password link', () => {
    render(<BrowserRouter><LoginPage /></BrowserRouter>);
    expect(screen.getByText(/forgot.*password/i)).toBeInTheDocument();
  });

  it('should allow typing in email field', () => {
    render(<BrowserRouter><LoginPage /></BrowserRouter>);
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput.value).toBe('test@example.com');
  });

  it('should allow typing in password field', () => {
    render(<BrowserRouter><LoginPage /></BrowserRouter>);
    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(passwordInput.value).toBe('password123');
  });
});
