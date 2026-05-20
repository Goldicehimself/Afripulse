import PostFeed from "../components/PostFeed";
import ExternalFeed from "../components/ExternalFeed";

function Entertainment() {
  return (
    <div className="space-y-10">
      <ExternalFeed
        feedKey="entertainment"
        title="Nigeria Entertainment"
        subtitle="Nollywood, Afrobeats, celebrities, and culture."
      />
      <ExternalFeed
        feedKey="africa-gist"
        title="Africa Gist"
        subtitle="Entertainment and lifestyle stories across the continent."
      />
      <PostFeed
        fixedCategory="entertainment"
        title="More Entertainment"
        subtitle="Featured culture, music, and film stories."
        hideWhenEmpty
      />
    </div>
  );
}

export default Entertainment;
