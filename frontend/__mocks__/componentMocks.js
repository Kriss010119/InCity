jest.mock('../src/components/transport-icon/TransportIcon', () => ({
  TransportIcon: () => null,
}));
jest.mock('../src/components/notification/RouteUpdateNotification', () => ({
  RouteUpdateNotification: () => null,
}));
jest.mock('../src/components/Panels/map-panel/MapPanel', () => ({
  MapPanel: () => null,
}));
jest.mock('../src/components/Panels/input-panel/InputPanel', () => ({
  InputPanel: () => null,
}));
jest.mock('../src/components/Panels/info-panel/InfoPanel', () => ({
  InfoPanel: () => null,
}));
