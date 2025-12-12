import { fn } from "storybook/test";
import { Header } from "./Header";

/**
 * Application header with logo and user controls.
 *
 * The Header component demonstrates:
 * - Conditional rendering based on auth state
 * - Multiple action handlers
 * - Complex layouts with MUI components
 */
export default {
  title: "Tutorial/Header",
  component: Header,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The main application header. Shows login/signup when logged out, user info when logged in.",
      },
    },
  },
  tags: ["autodocs"],
  args: {
    onLogin: fn(),
    onLogout: fn(),
    onCreateAccount: fn(),
  },
};

/**
 * Header when user is logged out.
 * Shows login and signup buttons.
 */
export const LoggedOut = {
  args: {
    user: null,
  },
};

/**
 * Header when user is logged in.
 * Shows user name, avatar, and logout button.
 */
export const LoggedIn = {
  args: {
    user: {
      name: "Jane Developer",
      photoUrl: "https://avatars.githubusercontent.com/u/1?v=4",
    },
  },
};

/**
 * Logged in user without a profile photo.
 */
export const LoggedInNoPhoto = {
  args: {
    user: {
      name: "John Smith",
      photoUrl: null,
    },
  },
};
