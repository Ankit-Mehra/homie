// Local, non-secret browser configuration. The default enables the backend's
// fixed development token only when the app is opened on localhost.
const localHost = ["localhost", "127.0.0.1", "::1"].includes(
  window.location.hostname,
);

window.HOMIE_CONFIG = {
  apiUrl: "",
  devAuth: localHost,
  supabaseUrl: "",
  supabaseAnonKey: "",
};
