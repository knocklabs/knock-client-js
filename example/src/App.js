import { useEffect, useMemo } from "react";
import "./App.css";
import Knock from "@knocklabs/client";
import create from "zustand";

const knockClient = new Knock(process.env.REACT_APP_KNOCK_API_KEY, {
  host: "http://localhost:4001",
});

knockClient.authenticate("chris", process.env.REACT_APP_KNOCK_USER_TOKEN);

const useNotificationFeed = (knockClient, feedId) => {
  return useMemo(() => {
    // Create the notification feed instance
    const notificationFeed = knockClient.feeds.initialize(feedId);
    const notificationStore = create(notificationFeed.store);
    notificationFeed.fetch();

    return [notificationFeed, notificationStore];
  }, []);
};

function App() {
  const [feedClient, feedStore] = useNotificationFeed(
    knockClient,
    process.env.REACT_APP_KNOCK_CHANNEL_ID
  );

  useEffect(() => {
    const teardown = feedClient.listenForUpdates();

    feedClient.on("messages.new", (data) => {
      console.log(data);
    });

    return () => teardown();
  }, [feedClient]);

  const { loading, items } = feedStore((state) => state);

  return (
    <div className="App">
      <h1>Feed items</h1>

      {loading && <span>Loading...</span>}

      {items.map((item) => (
        <div>
          ID: {item.id}
          <br />
          Actor ID: {item.actors[0].id}
          <br />
          Actor email: {item.actors[0].email}
          <br />
        </div>
      ))}
    </div>
  );
}

export default App;
