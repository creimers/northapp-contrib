import {
  ACTIVITY_TYPE_TRANSPORTATION,
  TRANSPORTATION_MODE_TRAIN,
  TRANSPORTATION_MODE_BUS,
  TRANSPORTATION_MODE_PUBLIC_TRANSPORT,
} from '../../definitions';

// /////
// UTILS
// /////

/**
 * sum up the durations of a trip's legs
 *
 * @param {array} legs
 * @return {number}
 */
export const calculateTotalDurationFromLegs = (legs) => {
  const totalDuration = legs.reduce(
    (dur, leg) => dur + parseFloat(leg.duration_hours),
    0
  );
  return totalDuration;
};

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
    'https://outsmart.superservice-international.com/v1/trips/',
    {
      headers: {
        Authorization: `Bearer ${state.token}`,
      },
    }
  );

  const trips = await response.json();

  const activities = [];

  trips.forEach((trip) => {
    const departureLeg = trip.legs[0];
    const arrivalLeg = trip.legs[trip.legs.length - 1];
    const totalDuration = calculateTotalDurationFromLegs(trip.legs);

    const activity = {
      id: `outsmart-public-transport-${trip.id}`,
      datetime: departureLeg.departure_timestamp,
      durationHours: totalDuration,
      activityType: TRANSPORTATION_MODE_TRAIN,
      carrier: trip.transport_company,
      departureStation: departureLeg.departure_station,
      destinationStation: arrivalLeg.destination_station,
    };
    activities.push(activity);
  });
  return {
    activities,
    state,
  };
}

const config = {
  label: 'outsmart.eco',
  type: ACTIVITY_TYPE_TRANSPORTATION,
  description: 'collects trips from your train and bus journeys',
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
