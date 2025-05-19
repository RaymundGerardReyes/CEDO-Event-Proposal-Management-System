export default function manifest() {
  return {
    name: "SDP Event Approval Platform",
    short_name: "SDP Platform",
    description: "Scholars Development Program Event Approval System",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0c2d6b",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }
}
