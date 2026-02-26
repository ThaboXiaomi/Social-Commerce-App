import React from 'react';
import {render, fireEvent, act, waitFor} from '@testing-library/react-native';
import App, {AppContent} from '../App';
import {Alert, Clipboard} from 'react-native';

const dummyUser = {
  id: 1,
  username: 'jdoe',
  name: 'John Doe',
  avatar: 'https://example.com/avatar.png',
  bio: 'Hello world',
  followers: 5,
  following: 2,
  email: 'jdoe@example.com',
  phone: '',
  dateOfBirth: '',
  gender: '',
  pronouns: '',
  location: '',
  website: '',
  company: '',
  jobTitle: '',
  interests: [],
  language: 'English',
  timezone: 'America/New_York',
};

describe('Profile interactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('copies invite code and shows alert', async () => {
    const {getByText, getByTestId} = render(<AppContent currentUser={dummyUser} onLogout={()=>{}} />);
    fireEvent.press(getByText('Profile'));

    // wait for profile to render
    const inviteButton = await getByTestId('invite-button');
    act(() => {
      fireEvent.press(inviteButton);
    });

    expect(Clipboard.setString).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      'Invite Code',
      expect.stringContaining('Share this code with friends'),
    );
  });

  it('stat buttons trigger an alert', async () => {
    const {getByText} = render(<AppContent currentUser={dummyUser} onLogout={()=>{}} />);
    fireEvent.press(getByText('Profile'));

    const followersStat = await getByText('Followers');
    act(() => {
      fireEvent.press(followersStat);
    });
    expect(Alert.alert).toHaveBeenCalledWith('Followers', expect.any(String));
  });

  it('theme toggler updates header color', async () => {
    const {getByText, getByTestId} = render(<AppContent currentUser={dummyUser} onLogout={()=>{}} />);
    act(() => {
      fireEvent.press(getByText('Profile'));
    });

    // wait until the profile overview is visible before continuing
    await waitFor(() => getByText('Overview'));

    // open "Menu" tab inside profile
    act(() => {
      fireEvent.press(getByText('Menu'));
    });

    // scroll to Preferences section and press "Dark" chip
    const darkChip = await getByText('Dark');
    act(() => {
      fireEvent.press(darkChip);
    });

    // header should have new background color
    const header = getByTestId('profile-header');
    expect(header.props.style).toMatchObject({backgroundColor: '#1e293b'});
  });
});