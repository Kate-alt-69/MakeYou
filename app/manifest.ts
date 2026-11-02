export default function manifest() {
  return {
    id: "/",
    name: "MakeYou",
    short_name: "MakeYou",
    description: "A clean, lightweight space to discover and watch videos.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#11131a",
    theme_color: "#11131a",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    share_target: {
      action: "/share",
      method: "GET",
      enctype: "application/x-www-form-urlencoded",
      params: {
        title: "title",
        text: "text",
        url: "url",
      },
    },
  };
}
