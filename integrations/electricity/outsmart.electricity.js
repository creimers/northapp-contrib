import { ACTIVITY_TYPE_ELECTRICITY } from '../../definitions';

// /////////////
// NORTH METHODS
// /////////////

async function connect(requestLogin, requestWebView) {
  const { username, password } = await requestLogin();

  if (!(password || '').length) {
    throw Error('Password cannot be empty');
  }

  const response = await fetch(
    'https://outsmart.superservice-international.com/v1/auth/jwt/create/',
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: username, password }),
    }
  );

  const result = await response.json();

  // Set state to be persisted
  const token = result.access;
  return {
    token,
    email: username,
    password,
  };
}

function disconnect() {
  // Here we should do any cleanup (deleting tokens etc..)
  return {};
}

async function collect(state, logger) {
  const response = await fetch(
    'https://outsmart.superservice-international.com/v1/electricity-bills/',
    {
      headers: {
        Authorization: `Bearer ${state.token}`,
      },
    }
  );

  const activities = await response.json();
  return {
    activities,
    state,
  };
}

const config = {
  label: 'outsmart electricity',
  type: ACTIVITY_TYPE_ELECTRICITY,
  description:
    'collects monthly electricity consumption from your paper electricity bills',
  isPrivate: true,
  signupLink: 'https://outsmart.superservice-international.com/',
  contributors: ['creimers'],
  // minRefreshInterval: 60
};

export default {
  connect,
  disconnect,
  collect,
  config,
};
