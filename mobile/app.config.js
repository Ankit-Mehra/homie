module.exports = ({ config }) => {
  if (process.env.EAS_BUILD_PROFILE === "production") {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    if (!apiUrl || new URL(apiUrl).protocol !== "https:") {
      throw new Error(
        "Production builds require EXPO_PUBLIC_API_URL to use HTTPS.",
      );
    }
    if (process.env.EXPO_PUBLIC_DEV_AUTH === "true") {
      throw new Error(
        "Production builds cannot enable development authentication.",
      );
    }
  }
  return config;
};
