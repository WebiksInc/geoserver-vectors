let config;

export default config = {
  defaultWorkspace: 'tiger',
  baseUrl: 'http://localhost:8080/geoserver',
  // baseUrl: process.env.GEO_SERVER_URL || 'http://localhost:8080/geoserver',
  username: 'admin',
  password: 'geoserver',
  auth: 'Basic YWRtaW46Z2Vvc2VydmVy',
  // auth: `Basic ${Buffer.from(`${process.env.GEO_SERVER_USER || 'admin'}:${process.env.GEO_SERVER_PASS || 'geoserver'}`).toString('base64')}`,
  wfs: {
    start: '/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=',
    middle: '&srsName=',
    end: '&count=50000&outputFormat=application/json'
  }
};
