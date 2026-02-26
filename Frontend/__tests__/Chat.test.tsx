import React from 'react';
import {render, fireEvent, act, waitFor} from '@testing-library/react-native';
import App, {AppContent} from '../App';
import {Alert} from 'react-native';

// TypeScript doesn't know about Jest's global object
declare var global: any;

const dummyUser = {
  id: 1,
  username: 'jdoe',
  name: 'John Doe',
  avatar: 'https://example.com/avatar.png',
  bio: '',
  followers: 0,
  following: 0,
  email: '',
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
  timezone: 'UTC',
};

const conversations = [
  {
    user_id: 2,
    user: {name: 'Alice', avatar: 'https://example.com/alice.png'},
    last_message: 'hello',
    timestamp: '1:00',
    unread: true,
  },
  {
    user_id: 3,
    user: {name: 'Bob', avatar: 'https://example.com/bob.png'},
    last_message: 'hey there',
    timestamp: '2:00',
    unread: false,
  },
];

const messages = [
  {id: 1, sender_id: 2, receiver_id: 1, content: 'hi', timestamp: '1:00'},
];

describe('Chat screen behaviors', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    // make sure any timers scheduled by react-native setup are flushed
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as any) = jest.fn((url: string, opts: any) => {
      // strip base for easier matching
      if (typeof url === 'string' && url.endsWith('/conversations')) {
        return Promise.resolve({ok: true, status: 200, json: () => Promise.resolve(conversations)});
      }
      if (typeof url === 'string' && url.includes('/messages') && (!opts || opts.method === 'GET')) {
        return Promise.resolve({ok: true, status: 200, json: () => Promise.resolve(messages)});
      }
      if (typeof url === 'string' && url.endsWith('/messages') && opts && opts.method === 'POST') {
        return Promise.resolve({ok: true, status: 200, json: () => Promise.resolve({success: true})});
      }
      return Promise.resolve({ok: true, status: 200, json: () => Promise.resolve({})});
    });
  });

  it('allows searching and filtering by unread', async () => {
    const {getByText, getByPlaceholderText, queryByText} = render(
      <AppContent currentUser={dummyUser} onLogout={() => {}} />
    );

    // navigate to chat tab
    act(() => {
      fireEvent.press(getByText('Chat'));
    });

    // wait for conversations to render
    await waitFor(() => getByText('Alice'));
    expect(getByText('Bob')).toBeTruthy();

    // search for Alice only
    act(() => {
      fireEvent.changeText(getByPlaceholderText('Search chats'), 'Alice');
    });
    expect(getByText('Alice')).toBeTruthy();
    expect(queryByText('Bob')).toBeNull();

    // clear search and filter unread
    act(() => {
      fireEvent.changeText(getByPlaceholderText('Search chats'), '');
      fireEvent.press(getByText('Unread'));
    });
    expect(getByText('Alice')).toBeTruthy();
    expect(queryByText('Bob')).toBeNull();
  });

  it('opens a conversation and can send a message', async () => {
    const {getByText, getByPlaceholderText, getByTestId} = render(
      <AppContent currentUser={dummyUser} onLogout={() => {}} />
    );

    act(() => {
      fireEvent.press(getByText('Chat'));
    });

    await waitFor(() => getByText('Alice'));

    act(() => {
      fireEvent.press(getByText('Alice'));
    });

    // thread card should be visible (composer present)
    await waitFor(() => getByTestId('chat-composer'));
    expect(getByTestId('chat-composer')).toBeTruthy();

    // type and send
    act(() => {
      fireEvent.changeText(getByTestId('chat-composer'), 'hello');
    });
    act(() => {
      fireEvent.press(getByTestId('chat-send-button'));
    });

    expect((global.fetch as jest.Mock).mock.calls.some(call =>
      typeof call[0] === 'string' && call[0].endsWith('/messages') && call[1]?.method === 'POST'
    )).toBe(true);
  });

  it('reflects theme changes on hero banner', async () => {
    const {getByText, getByTestId} = render(<AppContent currentUser={dummyUser} onLogout={() => {}} />);
    // switch to profile and select dark mode
    act(() => {
      fireEvent.press(getByText('Profile'));
    });
    // open menu
    await waitFor(() => getByText('Menu'));
    act(() => {
      fireEvent.press(getByText('Menu'));
    });
    const darkChip = await getByText('Dark');
    act(() => {
      fireEvent.press(darkChip);
    });
    // go back to chat
    act(() => {
      fireEvent.press(getByText('Chat'));
    });
    // hero should have dark background
    const hero = getByTestId('chat-hero');
    expect(hero.props.style).toEqual(expect.arrayContaining([expect.objectContaining({backgroundColor: '#0f172a'})]));
  });
});
